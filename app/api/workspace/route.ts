import {NextRequest,NextResponse} from 'next/server';
import {database,workspace} from '@/lib/mentor/server';
import {diagnosticQuestions,mentorFeedback} from '@/lib/mentor/coaching';
import {pillars,domains,horizons} from '@/lib/mentor/types';
export const dynamic='force-dynamic';
const fail=(message:string,status=400)=>NextResponse.json({error:message},{status});
function text(v:unknown,max=500,required=true):string {if(typeof v!=='string'||v.length>max||(required&&!v.trim())) throw Error('Please complete all required fields.');return v.trim();}
function choice(v:unknown,values:readonly string[]) {const s=text(v); if(!values.includes(s)) throw Error('Choose a valid option.');return s;}
function date(v:unknown) {const s=text(v,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||isNaN(Date.parse(s))||new Date(s).toISOString().slice(0,10)!==s) throw Error('Enter a valid date.');return s;}
function num(v:unknown,min=0) {const n=Number(v);if(v==null||v===''||!Number.isFinite(n)||n<min||n>1e12)throw Error('Enter a valid number.');return n;}
function id(v:unknown) {const s=text(v,36);if(!/^[\da-f]{8}(-[\da-f]{4}){3}-[\da-f]{12}$/.test(s))throw Error('Invalid record.');return s;}
export async function GET(req:NextRequest) {
  try {const w=await workspace(req.nextUrl.searchParams.get('timezone')||'UTC'),db=database();
    const results=await Promise.all([
      db.from('visions').select('statement,target_date').eq('workspace_id',w).single(),
      db.from('goals').select('*').eq('workspace_id',w).order('created_at'),
      db.from('weekly_scorecards').select('*,scorecard_entries(*)').eq('workspace_id',w).order('week_start',{ascending:false}),
      db.from('commitments').select('*').eq('workspace_id',w).order('created_at'),
      db.from('activity_logs').select('*').eq('workspace_id',w).order('log_date',{ascending:false}),
      db.from('weekly_audits').select('*,audit_entries(*)').eq('workspace_id',w).order('week_start',{ascending:false}),
      db.from('diagnostics').select('*').eq('workspace_id',w).order('created_at',{ascending:false}),
      db.from('mentor_interviews').select('*').eq('workspace_id',w).order('created_at',{ascending:false})
    ]);
    if(results.some(r=>r.error)) throw Error('Could not load your workspace. Please retry.');
    return NextResponse.json(Object.fromEntries(['vision','goals','cards','commitments','logs','audits','diagnostics','interviews'].map((k,i)=>[k,results[i].data])),{headers:{'Cache-Control':'private, no-store'}});
  } catch(e){return fail(e instanceof Error?e.message:'Could not load workspace.',503);}
}
export async function POST(req:NextRequest) {
  const origin=req.headers.get('origin');
  if(!origin||new URL(origin).host!==req.headers.get('host'))return fail('Request origin rejected.',403);
  try {
    const raw=await req.text();if(raw.length>100000)return fail('Submission too large.');
    const b=JSON.parse(raw),w=await workspace(),db=database();let error;
    if(b.action==='vision') {
      ({error}=await db.from('visions').update({statement:text(b.statement,10000),target_date:date(b.target_date),updated_at:new Date().toISOString()}).eq('workspace_id',w));
    } else if(b.action==='goal') {
      const data={title:text(b.title),pillar:choice(b.pillar,pillars),term:choice(b.term,['long','short']),domain:choice(b.domain,domains),horizon:choice(b.horizon,horizons),parent_id:b.parent_id?id(b.parent_id):null,baseline:b.baseline===''?null:num(b.baseline),target:b.target===''?null:num(b.target,0.000001),unit:b.target===''?null:text(b.unit,80),direction:choice(b.direction,['increase','decrease']),deadline:b.deadline?date(b.deadline):null,status:choice(b.status,['active','completed','archived']),reward:text(b.reward||'',1000,false),stake:text(b.stake||'',1000,false),updated_at:new Date().toISOString()};
      if(data.target&&!data.deadline)throw Error('A measurable target needs a deadline.');
      if(data.parent_id) {const {data:parent}=await db.from('goals').select('horizon').eq('workspace_id',w).eq('id',data.parent_id).single();
        if(!parent||horizons.indexOf(parent.horizon)>=horizons.indexOf(data.horizon as typeof horizons[number])||data.parent_id===b.id)throw Error('Choose a parent with a longer horizon.');}
      if(b.id) {
        const {data:children}=await db.from('goals').select('horizon').eq('workspace_id',w).eq('parent_id',id(b.id));
        if(children?.some(c=>horizons.indexOf(c.horizon)<=horizons.indexOf(data.horizon as typeof horizons[number])))throw Error('This horizon must stay longer than its children.');
        ({error}=await db.from('goals').update(data).eq('workspace_id',w).eq('id',id(b.id)).select('id').single());
      } else ({error}=await db.from('goals').insert({...data,workspace_id:w}));
    } else if(b.action==='delete-goal') {
      ({error}=await db.from('goals').delete().eq('workspace_id',w).eq('id',id(b.id)).select('id').single());
    } else if(b.action==='scorecard') {
      const entries=b.entries;if(!Array.isArray(entries)||entries.length>200)throw Error('Invalid scorecard.');
      for(const e of entries){id(e.goal_id);if(!Number.isInteger(e.score)||e.score<1||e.score>10)throw Error('Rate every goal from 1 to 10.');text(e.note||'',2000,false);}
      ({error}=await db.rpc('save_scorecard',{p_workspace:w,p_week:date(b.week),p_reflection:text(b.reflection||'',5000,false),p_entries:entries}));
    } else if(b.action==='commitment') {
      const fields={title:text(b.title),domain:choice(b.domain,domains),weekly_target:num(b.weekly_target,0.000001),daily_target:num(b.daily_target,0.000001),unit:text(b.unit,80),goal_id:b.goal_id?id(b.goal_id):null,archived:Boolean(b.archived)};
      if(fields.goal_id){const {data:g}=await db.from('goals').select('id').eq('workspace_id',w).eq('id',fields.goal_id).single();if(!g)throw Error('Choose a goal from your workspace.');}
      if(b.id)({error}=await db.from('commitments').update(fields).eq('workspace_id',w).eq('id',id(b.id)).select('id').single());
      else ({error}=await db.from('commitments').insert({...fields,workspace_id:w}));
    } else if(b.action==='log') {
      const logDate=date(b.log_date);if(logDate>new Date(Date.now()+86400000).toISOString().slice(0,10))throw Error('Evidence cannot be in the future.');
      const {data:c}=await db.from('commitments').select('id').eq('workspace_id',w).eq('id',id(b.commitment_id)).eq('archived',false).single();if(!c)throw Error('Choose an active commitment.');
      ({error}=await db.from('activity_logs').upsert({workspace_id:w,commitment_id:c.id,log_date:logDate,quantity:num(b.quantity),note:text(b.note||'',2000,false),updated_at:new Date().toISOString()},{onConflict:'commitment_id,log_date'}));
    } else if(b.action==='audit') {
      ({error}=await db.rpc('save_evidence_audit',{p_workspace:w,p_week:date(b.week)}));
    } else if(b.action==='interview') {
      const proposal={title:text(b.title),pillar:choice(b.pillar,pillars),domain:choice(b.domain,domains),baseline:num(b.baseline),target:num(b.target,0.000001),unit:text(b.unit,80),direction:choice(b.direction,['increase','decrease']),deadline:date(b.deadline),reason:text(b.reason||'',5000,false)};
      if(proposal.deadline<=new Date().toISOString().slice(0,10))throw Error('Set a future vision deadline.');
      const result=mentorFeedback(proposal);
      ({error}=await db.from('mentor_interviews').insert({workspace_id:w,proposal,...result}));
    } else if(b.action==='convert-plan') {
      const {data:interview}=await db.from('mentor_interviews').select('*').eq('workspace_id',w).eq('id',id(b.id)).single();
      if(!interview||interview.status!=='ready')throw Error('Finish the mentor challenge first.');
      const p=interview.proposal;
      const milestones=[{horizon:'10-year',target:p.target,deadline:p.deadline,reward:'',stake:''},...['3-year','annual','quarterly'].map(h=>({horizon:h,target:num(b[h+'_target'],0.000001),deadline:date(b[h+'_deadline']),reward:text(b[h+'_reward']||'',1000,false),stake:text(b[h+'_stake']||'',1000,false)}))];
      for(let i=1;i<milestones.length;i++){const m=milestones[i],parent=milestones[i-1];if(m.deadline>=parent.deadline||m.deadline<=new Date().toISOString().slice(0,10))throw Error('Each nearer milestone needs an earlier future deadline.');if(p.direction==='increase'?(m.target>=parent.target||m.target<=p.baseline):(m.target<=parent.target||m.target>=p.baseline))throw Error('Each milestone must progress from the baseline toward its parent target.');}
      ({error}=await db.rpc('convert_mentor_plan',{p_workspace:w,p_interview:interview.id,p_milestones:milestones}));
    } else if(b.action==='diagnostic-start') {
      ({error}=await db.from('diagnostics').insert({workspace_id:w,domain:choice(b.domain,domains)}));
    } else if(b.action==='diagnostic-answer') {
      const {data:d}=await db.from('diagnostics').select('*').eq('workspace_id',w).eq('id',id(b.id)).single();if(!d||d.completed||d.turns.length>=4)throw Error('This interview is no longer accepting answers.');
      if(b.step!==d.turns.length)throw Error('This interview changed. Reload before answering.');
      const answer=text(b.answer,3000);if(answer.length<20)throw Error('Be specific: describe the behavior and evidence in at least 20 characters.');
      ({error}=await db.from('diagnostics').update({turns:[...d.turns,{question:diagnosticQuestions[d.turns.length],answer}],updated_at:new Date().toISOString()}).eq('workspace_id',w).eq('id',d.id).eq('updated_at',d.updated_at).select('id').single());
    } else if(b.action==='diagnostic-finish') {
      const {data:d}=await db.from('diagnostics').select('*').eq('workspace_id',w).eq('id',id(b.id)).single();if(!d||d.turns.length!==4||d.completed)throw Error('Complete all four diagnostic questions first.');
      const action=text(b.corrective_action,1000),target=num(b.target,0.000001),unit=text(b.unit,80),deadline=date(b.deadline);
      if(deadline<new Date().toISOString().slice(0,10))throw Error('Choose today or a future deadline.');
      ({error}=await db.from('diagnostics').update({hypothesis:text(b.hypothesis,1000),corrective_action:`${action} — ${target} ${unit} by ${deadline}`,deadline,completed:true,updated_at:new Date().toISOString()}).eq('workspace_id',w).eq('id',d.id));
    } else return fail('Unknown action.');
    if(error){console.error('Workspace mutation failed:',error.code);return fail('Could not save. Check your entries and reload if your goals changed.');}
    return NextResponse.json({ok:true});
  }catch(e){return fail(e instanceof Error?e.message:'Could not save changes.');}
}

import {NextRequest,NextResponse} from 'next/server';
import {database,workspace} from '@/lib/mentor/server';
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
      db.from('diagnostics').select('*').eq('workspace_id',w).order('created_at',{ascending:false})
    ]);
    if(results.some(r=>r.error)) throw Error('Could not load your workspace. Please retry.');
    return NextResponse.json(Object.fromEntries(['vision','goals','cards','commitments','logs','audits','diagnostics'].map((k,i)=>[k,results[i].data])),{headers:{'Cache-Control':'private, no-store'}});
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
    } else return fail('Unknown action.');
    if(error){console.error('Workspace mutation failed:',error.code);return fail('Could not save. Check your entries and reload if your goals changed.');}
    return NextResponse.json({ok:true});
  }catch(e){return fail(e instanceof Error?e.message:'Could not save changes.');}
}

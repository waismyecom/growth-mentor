import assert from 'node:assert/strict';
const base=process.env.TEST_URL||'http://localhost:3100';let cookie='';
async function read(){const r=await fetch(base+'/api/workspace',{headers:{cookie}});if(r.headers.get('set-cookie'))cookie=r.headers.get('set-cookie').split(';')[0];const d=await r.json();assert.equal(r.status,200,JSON.stringify(d));return d;}
async function write(data,status=200){const r=await fetch(base+'/api/workspace',{method:'POST',headers:{'Content-Type':'application/json',Origin:base,cookie},body:JSON.stringify(data)});const d=await r.json();assert.equal(r.status,status,JSON.stringify(d));}
let d=await read();
const proposal={action:'interview',title:'Acceptance: serve more learners',pillar:'Career',domain:'Work',baseline:10,target:20,unit:'learners',direction:'increase',deadline:'2036-12-31',reason:''};
await write(proposal);d=await read();assert.equal(d.interviews[0].status,'revise');
await write({...proposal,target:1000,reason:'Build an accessible training program with reusable lessons and train other instructors.'});d=await read();assert.equal(d.interviews[0].status,'ready');
const plan={action:'convert-plan',id:d.interviews[0].id,'3-year_target':300,'3-year_deadline':'2029-12-31',annual_target:100,annual_deadline:'2027-12-31',quarterly_target:30,quarterly_deadline:'2026-12-31',annual_reward:'A holiday',annual_stake:'Pause optional purchases'};
await write({...plan,quarterly_target:200},400);assert.equal((await read()).goals.length,4);
await write(plan);d=await read();assert.equal(d.goals.length,8);assert.equal(d.interviews[0].status,'converted');await write(plan,400);
const chain=d.goals.filter(g=>g.title===proposal.title);assert.equal(chain.filter(g=>g.parent_id).length,3);
const domains=['Health','Relationships','Love','Work','Money','Fun','Personal Growth'];
for(const domain of domains) await write({action:'commitment',title:'Acceptance activity '+domain,domain,weekly_target:10,daily_target:1,unit:'sessions',goal_id:'',archived:false});
d=await read();let day=new Date().toISOString().slice(0,10);const monday=new Date(day+'T12:00:00Z');monday.setUTCDate(monday.getUTCDate()-((monday.getUTCDay()+6)%7));const week=monday.toISOString().slice(0,10);
for(let i=0;i<d.commitments.length;i++)await write({action:'log',commitment_id:d.commitments[i].id,log_date:day,quantity:i+1,note:'Test-only activity evidence'});
await write({action:'audit',week});d=await read();assert.equal(d.audits[0].audit_entries.length,7);assert.deepEqual(d.audits[0].audit_entries.map(e=>e.score).sort(),[1,2,3,4,5,6,7]);
const commitment=d.commitments[0];await write({action:'commitment',...commitment,weekly_target:20});d=await read();assert.equal(d.audits[0].audit_entries.find(e=>e.domain===commitment.domain).evidence_snapshot[0].target,10);
await write({action:'audit',week});d=await read();assert.equal(d.audits[0].audit_entries.find(e=>e.domain===commitment.domain).evidence_snapshot[0].target,20);
await write({action:'diagnostic-start',domain:'Health'});d=await read();const diagnostic=d.diagnostics[0].id;
await write({action:'diagnostic-finish',id:diagnostic},400);
for(let step=0;step<4;step++)await write({action:'diagnostic-answer',id:diagnostic,step,answer:['On Monday I missed my planned walk after opening messages.','I chose to check notifications before my planned walk.','Every morning the phone on my desk triggers checking messages.','I replace the scheduled walk with easy inbox clearing.'][step]});
await write({action:'diagnostic-finish',id:diagnostic,hypothesis:'Phone checking displaces scheduled movement',corrective_action:'Put my phone away before walking',target:1,unit:'phone-free walk daily',deadline:'2026-12-31'});
d=await read();assert.equal(d.diagnostics[0].completed,true);assert.match(d.diagnostics[0].corrective_action,/1 phone-free walk daily/);
console.log('PASS: target pushback, revision, atomic milestone chain, 7-domain logs and grading, frozen audit snapshots, explicit refresh, four-turn diagnosis and one measurable corrective action.');

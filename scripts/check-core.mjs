import assert from 'node:assert/strict';
const base=process.env.TEST_URL||'http://localhost:3100';
let cookie='';
async function read(){const r=await fetch(base+'/api/workspace',{headers:{cookie}});if(r.headers.get('set-cookie'))cookie=r.headers.get('set-cookie').split(';')[0];const d=await r.json();assert.equal(r.status,200,JSON.stringify(d));return d;}
async function write(data,status=200,session=cookie){const r=await fetch(base+'/api/workspace',{method:'POST',headers:{'Content-Type':'application/json',Origin:base,cookie:session},body:JSON.stringify(data)});const d=await r.json();assert.equal(r.status,status,JSON.stringify(d));return d;}
let d=await read();assert.equal(d.goals.length,4);
await write({action:'vision',statement:'Acceptance test: help 10000 learners by 2036',target_date:'2036-09-11'});
await write({action:'goal',title:'Acceptance: walk 20 times',pillar:'Health',term:'short',domain:'Health',horizon:'quarterly',parent_id:'',baseline:0,target:20,unit:'walks',direction:'increase',deadline:'2026-12-31',status:'active',reward:'Day trip',stake:'Skip optional shopping'});
d=await read();assert.equal(d.goals.length,5);assert.match(d.vision.statement,/10000/);
const now=new Date();now.setUTCDate(now.getUTCDate()-((now.getUTCDay()+6)%7));const week=now.toISOString().slice(0,10);
await write({action:'scorecard',week,reflection:'Persisted reflection',entries:d.goals.map((g,i)=>({goal_id:g.id,score:i+5,note:'Evidence '+i}))});
d=await read();assert.equal(d.cards[0].scorecard_entries.length,5);assert.equal(d.cards[0].scorecard_entries.reduce((s,e)=>s+e.score,0)/5,7);
await write({action:'scorecard',week,reflection:'Invalid partial',entries:[{goal_id:d.goals[0].id,score:2,note:''}]},400);
assert.equal((await read()).cards[0].reflection,'Persisted reflection');
const own=cookie;cookie='';const other=await read();assert.equal(other.goals.length,4);assert.notEqual(other.goals[0].id,d.goals[0].id);
await write({action:'delete-goal',id:d.goals[0].id},400);cookie=own;
await write({action:'delete-goal',id:d.goals[4].id});
d=await read();assert.equal(d.cards[0].scorecard_entries.length,5);assert.equal(d.goals.length,4);
console.log('PASS: seed, vision, goal, complete scorecard, average 7.0, reload, atomic rejection, visitor isolation, history after deletion. Test-only visitor records retained.');

import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
const base=process.env.TEST_URL||'http://localhost:3100';
const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const jar=new Map();const cookie=()=>Array.from(jar,([k,v])=>`${k}=${v}`).join('; ');
async function request(path,body,status=200){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{cookie:cookie(),Origin:base,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});for(const raw of r.headers.getSetCookie()){const [pair]=raw.split(';');const ix=pair.indexOf('=');jar.set(pair.slice(0,ix),pair.slice(ix+1));}const d=await r.json();assert.equal(r.status,status,JSON.stringify(d));return d;}
const email=`growth-auth-${crypto.randomUUID()}@example.com`;
async function login(address=email){const {data,error}=await admin.auth.admin.generateLink({type:'magiclink',email:address});assert.ifError(error);await request('/api/auth',{action:'verify',email:address,code:data.properties.email_otp,timezone:'Asia/Kuala_Lumpur'});}
let d=await request('/api/workspace');const initialGoal=d.goals[0].id;const guest=jar.get('mentor_workspace');
await request('/api/workspace',{action:'vision',statement:'Private account acceptance vision',target_date:'2036-12-31'});
await login();assert.equal((await request('/api/auth')).user.email,email);
d=await request('/api/workspace');assert.equal(d.vision.statement,'Private account acceptance vision');assert.equal(d.goals[0].id,initialGoal);
await request('/api/auth',{action:'signout'});assert.equal((await request('/api/auth')).user,null);
jar.clear();jar.set('mentor_workspace',guest);d=await request('/api/workspace');assert.notEqual(d.vision.statement,'Private account acceptance vision');assert.notEqual(d.goals[0].id,initialGoal);
jar.clear();await login();d=await request('/api/workspace');assert.equal(d.vision.statement,'Private account acceptance vision');assert.equal(d.goals[0].id,initialGoal);
jar.clear();jar.set('mentor_workspace',guest);await login(`growth-auth-${crypto.randomUUID()}@example.com`);d=await request('/api/workspace');assert.notEqual(d.goals[0].id,initialGoal);
await request('/api/workspace',{action:'delete-goal',id:initialGoal},400);
await request('/api/auth',{action:'signout'});
await request('/api/auth',{action:'verify',email,code:'00000000'},400);assert.equal((await request('/api/auth')).user,null);
const csrf=await fetch(base+'/api/auth',{method:'POST',headers:{Origin:'https://example.com','Content-Type':'application/json'},body:JSON.stringify({action:'signout'})});assert.equal(csrf.status,403);
console.log('PASS: real OTP verification, demo adoption, sign-out, old guest-cookie denial, cross-device restoration, second-account isolation, invalid-code rejection and CSRF denial. Generated test accounts only; no emails sent.');

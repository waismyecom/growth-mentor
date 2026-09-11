import {createClient} from '@supabase/supabase-js';
import {cookies} from 'next/headers';
import {createHmac,randomUUID,timingSafeEqual} from 'node:crypto';
export function database() {
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key) throw Error('Database setup is incomplete. Please contact the app owner.');
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
export async function workspace(timezone='UTC') {
  try {new Intl.DateTimeFormat('en',{timeZone:timezone}).format();}catch{timezone='UTC';}
  const secret=process.env.SESSION_SECRET;
  if(!secret) throw Error('Session configuration is missing.');
  const sign=(id:string)=>createHmac('sha256',secret).update(id).digest('hex');
  const jar=await cookies(); const raw=jar.get('mentor_workspace')?.value;
  if(raw) {const [id,sig]=raw.split('.');const expected=sign(id);
    if(/^[\da-f-]{36}$/.test(id)&&sig?.length===expected.length&&timingSafeEqual(Buffer.from(sig),Buffer.from(expected))) return id;
  }
  const id=randomUUID(); const {error}=await database().rpc('initialize_workspace',{p_id:id,p_timezone:timezone.slice(0,100)});
  if(error) throw Error('Could not create your workspace. Please retry.');
  jar.set('mentor_workspace',`${id}.${sign(id)}`,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:60*60*24*365});
  return id;
}

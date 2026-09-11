import {NextRequest,NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {createClient} from '@/lib/supabase/server';
import {workspace} from '@/lib/mentor/server';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
export async function GET(){
 const auth=await createClient();const {data:{user},error}=await auth.auth.getUser();
 if(error&&error.status&&error.status>=500)return reply({error:'Account service is temporarily unavailable.'},503);
 return reply({user:user?{email:user.email}:null});
}
export async function POST(req:NextRequest){
 if(req.headers.get('origin')!==req.nextUrl.origin)return reply({error:'Request origin rejected.'},403);
 try {
  const raw=await req.text();if(raw.length>4000)return reply({error:'Request too large.'},400);
  const body=JSON.parse(raw),auth=await createClient();
  if(body.action==='signout'){
    const {error}=await auth.auth.signOut({scope:'local'});
    if(error)return reply({error:'Could not sign out. Please retry.'},400);
    (await cookies()).delete('mentor_workspace');return reply({ok:true});
  }
  const email=typeof body.email==='string'?body.email.trim().toLowerCase():'';
  if(email.length>254||!/^\S+@\S+\.\S+$/.test(email))return reply({error:'Enter a valid email address.'},400);
  if(body.action==='send'){
    const {error}=await auth.auth.signInWithOtp({email,options:{shouldCreateUser:true,emailRedirectTo:req.nextUrl.origin+'/auth/callback'}});
    if(error){
      const message=error.status===429?'Too many attempts. Please wait a few minutes before requesting another link.':error.code==='email_address_not_authorized'?'Email delivery is not enabled for this address yet. The app owner needs to connect an email provider.':'We could not send the sign-in email. Check your email address and try again shortly.';
      return reply({error:message},error.status===429?429:400);
    }
    return reply({ok:true});
  }
  if(body.action==='verify'){
    if(typeof body.code!=='string'||!/^\d{6,10}$/.test(body.code))return reply({error:'Enter the numeric code from your email.'},400);
    const {error}=await auth.auth.verifyOtp({email,token:body.code,type:'email'});
    if(error)return reply({error:'That code is invalid or expired. Request a new code and try again.'},400);
    await workspace(typeof body.timezone==='string'?body.timezone:'UTC');
    return reply({ok:true});
  }
  return reply({error:'Unknown action.'},400);
 }catch{return reply({error:'Could not complete sign-in. Please try again.'},500);}
}

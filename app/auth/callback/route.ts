import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {workspace} from '@/lib/mentor/server';
export async function GET(req:NextRequest){
 const code=req.nextUrl.searchParams.get('code');
 if(code){
  const auth=await createClient();const {error}=await auth.auth.exchangeCodeForSession(code);
  if(!error){try{await workspace();return NextResponse.redirect(new URL('/',req.url));}catch{return NextResponse.redirect(new URL('/sign-in?error=workspace',req.url));}}
 }
 return NextResponse.redirect(new URL('/sign-in?error=link',req.url));
}

'use client';
import {useEffect,useState} from 'react';
export default function Account({compact=false}:{compact?:boolean}){
 const [user,setUser]=useState<{email:string}|null>(null),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{fetch('/api/auth').then(async r=>{if(!r.ok)throw Error();const d=await r.json();setUser(d.user);}).catch(()=>setError('Could not check sign-in. Refresh to retry.')).finally(()=>setLoading(false));},[]);
 async function signOut(){setBusy(true);setError('');try{const r=await fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'signout'})});if(!r.ok)throw Error();window.location.assign('/');}catch{setError('Could not sign out. Try again.');setBusy(false);}}
 return <div className={"account-box "+(compact?"compact-account":"")}>{loading?<span>Checking account…</span>:user?<><span className="account-email" title={user.email}>{user.email}</span><p>Your progress is saved to your account.</p><button className="secondary" disabled={busy} onClick={signOut}>{busy?'Signing out…':'Sign out'}</button></>:<><a className="primary" href="/sign-in">Sign in</a><p>Keep your goals and history across devices.</p></>}{error&&<p role="alert">{error}</p>}</div>;
}

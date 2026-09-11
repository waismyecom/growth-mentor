export const pillars = ['Health', 'Soft Skills', 'Education', 'Career'] as const;
export const domains = ['Health','Relationships','Love','Work','Money','Fun','Personal Growth'] as const;
export const horizons = ['10-year','3-year','annual','quarterly'] as const;
export type Goal = {id:string;title:string;pillar:string;term:string;domain:string|null;horizon:string|null;parent_id:string|null;baseline:number|null;target:number|null;unit:string|null;direction:string;deadline:string|null;status:string;reward:string;stake:string};
export type Entry = {goal_id_snapshot:string;goal_title:string;pillar:string;score:number;note:string};
export type Card = {id:string;week_start:string;reflection:string;scorecard_entries:Entry[]};
export type Commitment = {id:string;title:string;domain:string;weekly_target:number;daily_target:number;unit:string;archived:boolean;goal_id:string|null};
export type Log = {id:string;commitment_id:string;log_date:string;quantity:number;note:string};
export type AuditEntry = {domain:string;score:number|null;evidence_snapshot:{title:string;actual:number;target:number;unit:string}[]};
export type Audit = {id:string;week_start:string;audit_entries:AuditEntry[]};
export type Diagnostic = {id:string;domain:string;turns:{question:string;answer:string}[];hypothesis:string|null;corrective_action:string|null;deadline:string|null;completed:boolean};
export type WorkspaceData = {vision:{statement:string;target_date:string};goals:Goal[];cards:Card[];commitments:Commitment[];logs:Log[];audits:Audit[];diagnostics:Diagnostic[];interviews:Interview[]};
export function localDate(d=new Date()) {return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export function weekOf(date:string) {const d=new Date(date+'T12:00:00Z'); d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));return d.toISOString().slice(0,10);}
export function average(entries:Entry[]) {return entries.length?entries.reduce((s,e)=>s+e.score,0)/entries.length:0;}

export type Interview = {id:string;proposal:{title:string;pillar:string;domain:string;baseline:number;target:number;unit:string;direction:string;deadline:string;reason:string};feedback:string;status:string};

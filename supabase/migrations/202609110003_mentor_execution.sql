begin;
alter table public.commitments add column daily_target numeric not null default 1 check(daily_target > 0);
create table public.mentor_interviews (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  proposal jsonb not null,
  feedback text not null,
  status text not null check(status in ('revise','ready','converted')),
  created_at timestamptz not null default now()
);
alter table public.mentor_interviews enable row level security;
revoke all on public.mentor_interviews from anon,authenticated;
grant select,insert,update,delete on public.mentor_interviews to service_role;
create index mentor_interviews_workspace on public.mentor_interviews(workspace_id,created_at desc);

create or replace function public.convert_mentor_plan(p_workspace uuid,p_interview uuid,p_milestones jsonb)
returns void language plpgsql set search_path=public as $$
declare interview mentor_interviews; proposal jsonb; item jsonb; parent uuid; created uuid;
begin
  select * into strict interview from mentor_interviews where workspace_id=p_workspace and id=p_interview for update;
  if interview.status <> 'ready' then raise exception 'Complete the mentor challenge first.'; end if;
  proposal := interview.proposal;
  if jsonb_array_length(p_milestones) <> 4 then raise exception 'Four horizons are required.'; end if;
  for item in select * from jsonb_array_elements(p_milestones) loop
    insert into goals(workspace_id,parent_id,title,pillar,term,domain,horizon,baseline,target,unit,direction,deadline,reward,stake)
    values(p_workspace,parent,proposal->>'title',proposal->>'pillar',case when item->>'horizon'='quarterly' then 'short' else 'long' end,
      proposal->>'domain',item->>'horizon',(proposal->>'baseline')::numeric,(item->>'target')::numeric,proposal->>'unit',proposal->>'direction',(item->>'deadline')::date,
      coalesce(item->>'reward',''),coalesce(item->>'stake','')) returning id into created;
    parent := created;
  end loop;
  update mentor_interviews set status='converted' where id=p_interview and workspace_id=p_workspace;
end $$;

create or replace function public.save_evidence_audit(p_workspace uuid,p_week date)
returns uuid language plpgsql set search_path=public as $$
declare audit uuid;
begin
  perform 1 from workspaces where id=p_workspace for update;
  if p_week > current_date or extract(isodow from p_week)<>1 then raise exception 'Choose a valid week.'; end if;
  if not exists(select 1 from commitments where workspace_id=p_workspace and not archived) then raise exception 'Set at least one commitment first.'; end if;
  insert into weekly_audits(workspace_id,week_start) values(p_workspace,p_week)
  on conflict(workspace_id,week_start) do update set created_at=now() returning id into audit;
  delete from audit_entries where audit_id=audit and workspace_id=p_workspace;
  insert into audit_entries(workspace_id,audit_id,domain,score,evidence_snapshot)
  select p_workspace,audit,d.domain,
    round(avg(least(coalesce(e.actual,0)/c.weekly_target,1))*10)::smallint,
    coalesce(jsonb_agg(jsonb_build_object('title',c.title,'actual',coalesce(e.actual,0),'target',c.weekly_target,'unit',c.unit)) filter(where c.id is not null),'[]'::jsonb)
  from unnest(array['Health','Relationships','Love','Work','Money','Fun','Personal Growth']) d(domain)
  left join commitments c on c.workspace_id=p_workspace and c.domain=d.domain and not c.archived
  left join lateral(select sum(l.quantity) actual from activity_logs l where l.workspace_id=p_workspace and l.commitment_id=c.id and l.log_date between p_week and p_week+6) e on true
  group by d.domain;
  return audit;
end $$;
revoke all on function public.convert_mentor_plan(uuid,uuid,jsonb),public.save_evidence_audit(uuid,date) from public,anon,authenticated;
grant execute on function public.convert_mentor_plan(uuid,uuid,jsonb),public.save_evidence_audit(uuid,date) to service_role;
commit;

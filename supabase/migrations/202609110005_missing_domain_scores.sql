begin;
create or replace function public.save_evidence_audit(p_workspace uuid,p_week date)
returns uuid language plpgsql set search_path=public as $$
declare audit uuid;
begin
  perform 1 from workspaces where id=p_workspace for update;
  if p_week > (now() at time zone (select timezone from workspaces where id=p_workspace))::date or extract(isodow from p_week)<>1 then raise exception 'Choose a valid week.'; end if;
  if not exists(select 1 from commitments where workspace_id=p_workspace and not archived) then raise exception 'Set at least one commitment first.'; end if;
  insert into weekly_audits(workspace_id,week_start) values(p_workspace,p_week)
  on conflict(workspace_id,week_start) do update set created_at=now() returning id into audit;
  delete from audit_entries where audit_id=audit and workspace_id=p_workspace;
  insert into audit_entries(workspace_id,audit_id,domain,score,evidence_snapshot)
  select p_workspace,audit,d.domain,
    round(avg(least(coalesce(e.actual,0)/c.weekly_target,1)) filter (where c.id is not null)*10)::smallint,
    coalesce(jsonb_agg(jsonb_build_object('title',c.title,'actual',coalesce(e.actual,0),'target',c.weekly_target,'unit',c.unit)) filter(where c.id is not null),'[]'::jsonb)
  from unnest(array['Health','Relationships','Love','Work','Money','Fun','Personal Growth']) d(domain)
  left join commitments c on c.workspace_id=p_workspace and c.domain=d.domain and not c.archived
  left join lateral(select sum(l.quantity) actual from activity_logs l where l.workspace_id=p_workspace and l.commitment_id=c.id and l.log_date between p_week and p_week+6) e on true
  group by d.domain;
  return audit;
end $$;

update public.audit_entries set score=null where evidence_snapshot='[]'::jsonb;
commit;

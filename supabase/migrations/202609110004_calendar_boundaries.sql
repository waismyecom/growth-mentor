begin;
create or replace function public.save_scorecard(p_workspace uuid,p_week date,p_reflection text,p_entries jsonb)
returns uuid language plpgsql set search_path=public as $$
declare card uuid; item jsonb; goal goals; ids uuid[] := '{}';
begin
  perform 1 from workspaces where id=p_workspace for update;
  if jsonb_typeof(p_entries) <> 'array' or jsonb_array_length(p_entries)=0 then raise exception 'Rate at least one active goal.'; end if;
  if p_week > (now() at time zone (select timezone from workspaces where id=p_workspace))::date or extract(isodow from p_week) <> 1 then raise exception 'Choose a valid week.'; end if;
  for item in select * from jsonb_array_elements(p_entries) loop
    if (item->>'goal_id')::uuid = any(ids) then raise exception 'Duplicate goal.'; end if;
    ids := array_append(ids,(item->>'goal_id')::uuid);
    if not exists(select 1 from goals where workspace_id=p_workspace and id=(item->>'goal_id')::uuid and status='active') then raise exception 'Your goals changed. Reload before saving.'; end if;
  end loop;
  if (select count(*) from goals where workspace_id=p_workspace and status='active') <> cardinality(ids) then raise exception 'Rate every active goal.'; end if;
  insert into weekly_scorecards(workspace_id,week_start,reflection) values(p_workspace,p_week,p_reflection)
    on conflict(workspace_id,week_start) do update set reflection=excluded.reflection,updated_at=now() returning id into card;
  delete from scorecard_entries where workspace_id=p_workspace and scorecard_id=card;
  for item in select * from jsonb_array_elements(p_entries) loop
    select * into strict goal from goals where workspace_id=p_workspace and id=(item->>'goal_id')::uuid;
    insert into scorecard_entries(workspace_id,scorecard_id,goal_id_snapshot,goal_title,pillar,score,note)
      values(p_workspace,card,goal.id,goal.title,goal.pillar,(item->>'score')::smallint,coalesce(item->>'note',''));
  end loop;
  return card;
end $$;

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
    round(avg(least(coalesce(e.actual,0)/c.weekly_target,1))*10)::smallint,
    coalesce(jsonb_agg(jsonb_build_object('title',c.title,'actual',coalesce(e.actual,0),'target',c.weekly_target,'unit',c.unit)) filter(where c.id is not null),'[]'::jsonb)
  from unnest(array['Health','Relationships','Love','Work','Money','Fun','Personal Growth']) d(domain)
  left join commitments c on c.workspace_id=p_workspace and c.domain=d.domain and not c.archived
  left join lateral(select sum(l.quantity) actual from activity_logs l where l.workspace_id=p_workspace and l.commitment_id=c.id and l.log_date between p_week and p_week+6) e on true
  group by d.domain;
  return audit;
end $$;

commit;

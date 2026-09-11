begin;
create or replace function public.initialize_workspace(p_id uuid, p_timezone text)
returns void language plpgsql set search_path=public as $$
begin
  insert into workspaces(id,timezone) values(p_id,p_timezone) on conflict do nothing;
  if found then
    insert into visions(workspace_id,statement,target_date) values(p_id,'Build a healthy, financially independent life — and help 10,000 people unlock their potential.',(current_date + interval '10 years')::date);
    insert into goals(workspace_id,title,pillar,term,domain,horizon,baseline,target,unit,deadline) values
    (p_id,'Complete 36 intentional movement sessions','Health','short','Health','quarterly',0,36,'sessions',(current_date + interval '3 months')::date),
    (p_id,'Deliver 12 confident presentations','Soft Skills','short','Relationships','quarterly',0,12,'presentations',(current_date + interval '3 months')::date),
    (p_id,'Complete 4 practical learning projects','Education','short','Personal Growth','quarterly',0,4,'projects',(current_date + interval '3 months')::date),
    (p_id,'Launch a business serving 100 customers','Career','long','Work','annual',10,100,'customers',(current_date + interval '1 year')::date);
  end if;
end $$;

create or replace function public.save_scorecard(p_workspace uuid,p_week date,p_reflection text,p_entries jsonb)
returns uuid language plpgsql set search_path=public as $$
declare card uuid; item jsonb; goal goals; ids uuid[] := '{}';
begin
  perform 1 from workspaces where id=p_workspace for update;
  if jsonb_typeof(p_entries) <> 'array' or jsonb_array_length(p_entries)=0 then raise exception 'Rate at least one active goal.'; end if;
  if p_week > current_date or extract(isodow from p_week) <> 1 then raise exception 'Choose a valid week.'; end if;
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
revoke all on function public.initialize_workspace(uuid,text) from public,anon,authenticated;
revoke all on function public.save_scorecard(uuid,date,text,jsonb) from public,anon,authenticated;
grant execute on function public.initialize_workspace(uuid,text), public.save_scorecard(uuid,date,text,jsonb) to service_role;
commit;

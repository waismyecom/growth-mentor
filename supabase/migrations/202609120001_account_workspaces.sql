begin;
alter table public.workspaces add column owner_id uuid unique references auth.users(id) on delete cascade;
create or replace function public.account_workspace(p_user uuid,p_guest uuid,p_timezone text)
returns uuid language plpgsql set search_path=public as $$
declare result uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
  select id into result from workspaces where owner_id=p_user;
  if result is not null then return result; end if;
  if p_guest is not null then
    update workspaces set owner_id=p_user where id=p_guest and owner_id is null returning id into result;
  end if;
  if result is null then
    result := gen_random_uuid();
    perform initialize_workspace(result,p_timezone);
    update workspaces set owner_id=p_user where id=result;
  end if;
  return result;
end $$;
revoke all on function public.account_workspace(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.account_workspace(uuid,uuid,text) to service_role;
commit;

-- When someone accepts a family invite, add the inviter to the invitee's family list
-- so they see "who invited me" in their Family Members page.

create or replace function public.accept_family_invite(p_token text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member_id uuid;
  v_user_id uuid;
  v_inviter_id uuid;
  v_inviter_name text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return json_build_object('ok', false, 'error', 'Not signed in');
  end if;

  select fi.family_member_id, fm.user_id into v_member_id, v_inviter_id
  from public.family_invites fi
  join public.family_members fm on fm.id = fi.family_member_id
  where fi.token = p_token and fi.expires_at > now() and fm.linked_user_id is null
  limit 1;

  if v_member_id is null then
    return json_build_object('ok', false, 'error', 'Invalid or expired invite');
  end if;

  update public.family_members
  set linked_user_id = v_user_id
  where id = v_member_id;

  -- Add the inviter to the invitee's family list so they see each other
  select coalesce(nullif(trim(p.full_name), ''), 'Family member')
  into v_inviter_name
  from public.profiles p
  where p.id = v_inviter_id
  limit 1;
  if v_inviter_name is null then
    v_inviter_name := 'Family member';
  end if;

  insert into public.family_members (user_id, name, relation, linked_user_id)
  select v_user_id, v_inviter_name, 'Family', v_inviter_id
  where not exists (
    select 1 from public.family_members
    where user_id = v_user_id and linked_user_id = v_inviter_id
  );

  return json_build_object('ok', true);
end;
$$;

comment on function public.accept_family_invite(text) is 'Links the current user to a family_member record and adds the inviter to the invitee family list.';

-- Family invite flow improvements:
-- - auto-fill family_id for new members/invites
-- - pending invites can be matched by email in addition to phone

create or replace function public.set_family_id_on_family_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_family_id uuid;
begin
  if new.family_id is not null then
    return new;
  end if;

  if new.user_id is null then
    return new;
  end if;

  select id into v_family_id
  from public.families
  where owner_id = new.user_id
  order by created_at asc
  limit 1;

  if v_family_id is null then
    insert into public.families (name, owner_id)
    values ('My Family', new.user_id)
    returning id into v_family_id;
  end if;

  new.family_id := v_family_id;
  return new;
end;
$$;

drop trigger if exists set_family_id_on_family_member on public.family_members;
create trigger set_family_id_on_family_member
before insert on public.family_members
for each row
execute function public.set_family_id_on_family_member();

create or replace function public.set_family_id_on_family_invite()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.family_id is null then
    select fm.family_id into new.family_id
    from public.family_members fm
    where fm.id = new.family_member_id
    limit 1;
  end if;

  if new.invite_email is not null then
    new.invite_email := lower(trim(new.invite_email));
  end if;

  return new;
end;
$$;

drop trigger if exists set_family_id_on_family_invite on public.family_invites;
create trigger set_family_id_on_family_invite
before insert or update on public.family_invites
for each row
execute function public.set_family_id_on_family_invite();

create or replace function public.get_pending_invites_received()
returns table (
  token text,
  inviter_name text,
  member_label text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_phone text;
  v_profile_email text;
  v_jwt_email text;
begin
  select p.phone, lower(trim(p.email))
  into v_profile_phone, v_profile_email
  from public.profiles p
  where p.id = auth.uid()
  limit 1;

  v_jwt_email := lower(trim(coalesce(auth.jwt() ->> 'email', '')));

  return query
  select
    fi.token,
    coalesce(nullif(trim(p.full_name), ''), 'A family member') as inviter_name,
    (fm.name || ' (' || fm.relation || ')') as member_label,
    fi.expires_at
  from public.family_invites fi
  join public.family_members fm on fm.id = fi.family_member_id
  left join public.profiles p on p.id = fm.user_id
  where fm.linked_user_id is null
    and fi.expires_at > now()
    and (
      (v_profile_phone is not null and fm.phone = v_profile_phone)
      or
      (coalesce(fi.invite_email, '') <> '' and lower(fi.invite_email) in (coalesce(v_profile_email, ''), v_jwt_email))
    )
  order by fi.created_at desc;
end;
$$;

comment on function public.get_pending_invites_received() is 'Returns pending family invites for current user by phone or email.';


-- Pending invites received: invites where the family member's phone matches current user's profile phone.
-- Lets users see "who invited me" and accept from the Family Members screen.

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
begin
  return query
  select
    fi.token,
    coalesce(nullif(trim(p.full_name), ''), 'A family member') as inviter_name,
    (fm.name || ' (' || fm.relation || ')') as member_label,
    fi.expires_at
  from public.family_invites fi
  join public.family_members fm on fm.id = fi.family_member_id
  left join public.profiles p on p.id = fm.user_id
  where fm.phone is not null
    and fm.phone = (select phone from public.profiles where id = auth.uid() limit 1)
    and fm.linked_user_id is null
    and fi.expires_at > now()
  order by fi.created_at desc;
end;
$$;

comment on function public.get_pending_invites_received() is 'Returns pending family invites for the current user (matched by profile phone).';

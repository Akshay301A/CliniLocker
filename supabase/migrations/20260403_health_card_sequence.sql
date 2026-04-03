create sequence if not exists health_id_seq start 1;

create or replace function next_health_id()
returns text
language plpgsql
as $$
declare
  n bigint;
begin
  n := nextval('health_id_seq');
  return 'CL-' || lpad((n / 10000)::text, 4, '0') || '-' || lpad((n % 10000)::text, 4, '0');
end;
$$;

-- If there is exactly one existing card, normalize it to the first ID.
with first_card as (
  select id
  from health_cards
  order by created_at asc
  limit 1
)
update health_cards
set health_id = 'CL-0000-0001'
where id in (select id from first_card);

-- Ensure the sequence continues from 1 after the update.
select setval('health_id_seq', 1, true);

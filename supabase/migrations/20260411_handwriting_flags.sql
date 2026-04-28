-- Flag handwritten uploads so AI automation can be disabled for safety
alter table if exists reports
  add column if not exists is_handwritten boolean default false;

alter table if exists prescriptions
  add column if not exists is_handwritten boolean default false;

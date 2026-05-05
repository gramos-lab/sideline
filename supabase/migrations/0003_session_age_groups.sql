-- Sessions can target multiple age groups (e.g. a camp covering U5–U12).
-- Idempotent: only migrates if the old singular column still exists.

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'sessions' and column_name = 'age_group'
  ) then
    alter table sessions add column if not exists age_groups text[];
    update sessions
       set age_groups = array[age_group]
     where age_groups is null
       and age_group is not null;
    alter table sessions alter column age_groups set not null;
    alter table sessions drop column age_group;
  end if;
end$$;

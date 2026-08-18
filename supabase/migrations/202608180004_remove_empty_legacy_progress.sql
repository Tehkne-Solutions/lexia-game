-- Remove the unused pre-M04 progress table only when it is empty.
-- Tehkné Solutions

do $$
begin
  if to_regclass('public.progress') is not null then
    if exists (select 1 from public.progress limit 1) then
      raise exception 'Refusing to remove non-empty legacy public.progress without explicit data migration';
    end if;
    drop table public.progress;
  end if;
end
$$;

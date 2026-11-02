-- Destructiva: exportar public.tasks y revisar el respaldo antes de aplicar.
-- Aplicar DESPUÉS de desplegar la app que usa exclusivamente boards/subtasks.
-- No se usa CASCADE: si hay dependencias inesperadas, abortar para revisarlas.
begin;
drop table if exists public.tasks;
commit;

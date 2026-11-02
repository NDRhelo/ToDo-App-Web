
# ToDo App

Aplicación web para gestionar tareas personales, desarrollada con Next.js, React, TypeScript y Supabase.

## Funcionalidades

- Registro e inicio de sesión de usuarios.
- Autenticación mediante Supabase Auth.
- Crear, visualizar, completar y eliminar tareas.
- Almacenamiento de tareas en una base de datos Supabase.
- Separación de tareas por usuario mediante políticas RLS.
- Estadísticas de tareas totales, completadas y pendientes.
- Interfaz responsive con Tailwind CSS.

## Tecnologías utilizadas

- Next.js
- React
- TypeScript
- Tailwind CSS
- Supabase
- Git y GitHub

## Ejecutar el proyecto localmente

1. Instalar las dependencias:

```bash
npm install
```

2. Crear un archivo `.env.local` con las variables de entorno:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=tu_clave_publica_de_supabase
```

3. Iniciar el servidor de desarrollo:

```bash
npm run dev
```

4. Abrir http://localhost:3000 en el navegador.

## Estado del proyecto

Primera versión funcional (MVP).

## Pruebas automatizadas

```bash
npm test
```

Ejecuta la suite una vez. Para repetirla automáticamente al editar archivos:

```bash
npm run test:watch
```

Las pruebas usan Vitest y React Testing Library para interactuar con los formularios como lo haría una persona, buscando campos por sus etiquetas y pulsando botones.

- `tests/auth-screen.test.tsx`: verifica validaciones, foco en el primer error, visibilidad de contraseña, cambio entre acceso y registro, envío con Enter, bloqueo de solicitudes duplicadas, errores de autenticación/conexión y registro con o sin confirmación por correo.
- `tests/toast.test.tsx`: verifica anuncios accesibles, cierre automático y manual, y limpieza de temporizadores al salir de la pantalla.

Supabase está simulado: las pruebas no requieren `.env.local`, no crean cuentas ni envían correos. Protegen el comportamiento de la interfaz ante respuestas conocidas; no verifican la configuración real de Supabase, las políticas RLS ni la entrega de correos. Tampoco sustituyen una revisión visual en escritorio y móvil.

## Espacio de trabajo por tableros

La vista Tableros consulta `public.boards` y sus `public.subtasks` mediante el cliente actual de Supabase y la sesión autenticada. Permite crear, renombrar y eliminar tableros, agregar subtareas y completar/descompletar su estado. La migración `supabase/migrations/20261101000100_create_boards_and_subtasks.sql` define los permisos, RLS y la eliminación en cascada.

Los identificadores, el propietario y las fechas se generan en la base de datos. La interfaz cambia solo después de una respuesta confirmada; conserva el texto si falla una escritura y ofrece reintentar si falla la carga. Las cuentas sin tableros muestran un estado vacío: no se insertan ejemplos. `lib/demo-boards.ts` se utiliza exclusivamente como fixture de pruebas.

La navegación Mis tareas muestra las mismas subtasks de los tableros, en una lista con etiquetas de tablero. Las tareas se crean dentro de un tablero; ambas vistas comparten estado y estadísticas. No se consulta la tabla tasks. El progreso se calcula desde las subtareas confirmadas. Los cambios de otra pestaña se recuperan al recargar; no se utiliza Realtime.

- `lib/boards.ts`: consultas y escrituras con las columnas permitidas.
- `app/hooks/use-boards.ts`: carga, errores y operaciones pendientes.
- `tests/workspace.test.tsx`: flujos de interfaz, errores, progreso, navegación y cambio de cuenta.
- `tests/boards-api.test.ts`: payloads, consultas y comprobación de filas confirmadas.

Para probar manualmente en localhost:

1. Ejecutar `npm run dev` e iniciar sesión.
2. Crear un tablero, agregar subtareas y completar/descompletar alguna.
3. Recargar y verificar que se conservan título, subtareas y progreso.
4. Renombrar y eliminar un tablero con subtareas; confirmar que el resultado persiste al recargar.
5. Entrar con otra cuenta en una ventana privada y verificar el aislamiento.
6. Comprobar que Mis tareas sigue funcionando.

Las pruebas automatizadas simulan la API y no escriben en Supabase. La verificación real de RLS entre cuentas y de la cascada requiere estas pruebas manuales o una base de integración autorizada.


## Flujo único de tareas

Una cuenta nueva comienza sin tableros ni tareas. Primero crea un tablero
(`boards`) y después agrega sus tareas (`subtasks.board_id`). “Mis tareas”
reúne esas mismas tareas y permite completarlas; los cambios se reflejan también
en Tableros. No hay tareas independientes ni datos de ejemplo insertados.

La migración `supabase/migrations/20261102000100_remove_legacy_tasks.sql`
retira la tabla antigua `public.tasks`. **Elimina los datos de esa tabla**:
exportarlos y revisar el respaldo antes de aplicarla. No convierte las tareas
antiguas en subtasks porque no tienen un tablero asignado. Desplegar primero
esta versión de la app y después aplicar la migración desde Supabase.
La migración no se ha ejecutado desde este repositorio.

Verificación manual: entrar con una cuenta nueva, crear un tablero, agregar una
tarea y abrir “Mis tareas”. Completarla y volver a Tableros: debe conservar el
estado. Recargar y comprobar persistencia. Con otra cuenta, el espacio debe
estar vacío. Las pruebas automatizadas simulan Supabase; no verifican el
proyecto remoto.


Mis tareas abre en Pendientes y permite ver Completadas o Todas y filtrar por
tablero. Las etiquetas muestran nombre y color estable del tablero; el mismo
color se usa en su tarjeta. Los colores pueden repetirse, por eso el nombre
siempre está visible. El resumen lateral cuenta todas las tareas, independientemente
del filtro.

Se pueden eliminar tareas desde Tableros y Mis tareas con confirmación. La app
solo las retira al recibir la fila eliminada desde Supabase; si falla el borrado,
conserva la tarea y permite reintentar. Usa los permisos DELETE y RLS existentes
en subtasks; no requiere una migración nueva.

Para probar: cancelar un borrado y comprobar que la tarea sigue; confirmar otro
y comprobar que desaparece de ambas vistas y del resumen. Recargar para verificar
persistencia. Probar también los filtros y una lista sin coincidencias.

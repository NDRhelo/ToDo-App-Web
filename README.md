
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
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_publica_de_supabase
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

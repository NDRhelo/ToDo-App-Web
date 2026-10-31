
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

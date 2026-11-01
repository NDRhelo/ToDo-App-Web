"use client";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { useState, useEffect } from "react";
import { Toaster, useToast } from "./components/toast";
import { AuthScreen } from "./components/auth-screen";
type Tarea = {
  id: number;
  titulo: string;
  completada: boolean;
};

export default function Home() {
  const { toasts, notify, dismiss } = useToast();
  const [usuario, setUsuario] = useState<User | null>(null);
  const [tarea, setTarea] = useState("");
  const [listaTareas, setListaTareas] = useState<Tarea[]>([]);
  const [loadingSession, setLoadingSession] = useState(true);
  useEffect(() => {
    async function obtenerSesion() {
      const { data, error } = await supabase.auth.getSession();

      setLoadingSession(false);
      if (error) {
        console.error("Error al recuperar la sesión:", error.message);
        return;
      }

      setUsuario(data.session?.user ?? null);
    }

    obtenerSesion();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUsuario(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    let cancelado = false;

    async function cargarTareas() {
      if (!usuario) {
        setListaTareas([]);
        return;
      }

      const { data, error } = await supabase
        .from("tasks")
        .select("*");

      if (cancelado) return;

      if (error) {
        console.error("Error al cargar tareas:", error.message);
        return;
      }

      const tareasConvertidas: Tarea[] = data.map((item) => ({
        id: item.id,
        titulo: item.title,
        completada: item.completed,
      }));

      setListaTareas(tareasConvertidas);
    }

    cargarTareas();

    return () => {
      cancelado = true;
    };
  }, [usuario?.id]);
  async function agregarTarea() {
    if (tarea.trim() === "") {
      return;
    }

    if (!usuario) {
      notify("Debes iniciar sesión para agregar tareas");
      return;
    }

    const { error } = await supabase
      .from("tasks")
      .insert({
        title: tarea.trim(),
        completed: false,
        user_id: usuario.id,
      });

    if (error) {
      console.error("Error al guardar la tarea:", error.message);
      notify("No se pudo guardar la tarea");
      return;
    }

    setTarea("");
    await consultarSupabase();
  }
  async function cambiarEstado(id: number) {
    if (!usuario) return;

    const tareaSeleccionada = listaTareas.find(
      (item) => item.id === id
    );

    if (!tareaSeleccionada) return;

    const nuevoEstado = !tareaSeleccionada.completada;

    const { error } = await supabase
      .from("tasks")
      .update({ completed: nuevoEstado })
      .eq("id", id)
      .eq("user_id", usuario.id);

    if (error) {
      console.error("Error al actualizar la tarea:", error.message);
      notify("No se pudo actualizar la tarea");
      return;
    }

    setListaTareas(
      listaTareas.map((item) =>
        item.id === id
          ? { ...item, completada: nuevoEstado }
          : item
      )
    );
  }
  async function eliminarTarea(id: number) {
    if (!usuario) return;
    
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id)
      .eq("user_id", usuario.id)
      .select("id");

    if (error) {
      console.error("Error al eliminar la tarea:", error.message);
      notify("No se pudo eliminar la tarea");
      return;
    }

    await consultarSupabase();
  }
  async function consultarSupabase() {
    const { data, error } = await supabase
      .from("tasks")
      .select("*");

    if (error) {
      console.error("Error de Supabase:", error.message);
      return;
    }

    console.log("Tareas de Supabase:", data);

    const tareasConvertidas: Tarea[] = data.map((item) => ({
      id: item.id,
      titulo: item.title,
      completada: item.completed,
    }));

    setListaTareas(tareasConvertidas);
  }
  async function cerrarSesion() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      notify("Error al cerrar sesión: " + error.message);
      return;
    }

    setUsuario(null);
    setListaTareas([]);
    notify("Has cerrado sesión correctamente", "success");
  }
  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-zinc-100">
      <Toaster toasts={toasts} dismiss={dismiss} />
      {loadingSession ? (
        <main className="flex min-h-screen items-center justify-center text-sm text-zinc-400" role="status">Cargando tu espacio…</main>
      ) : !usuario ? <AuthScreen notify={notify} /> : (
      <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-6 py-12">

        <div className="flex flex-col gap-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
          <h1 className="text-4xl font-bold text-white">
            Mi ToDo App
          </h1>
          <p className="text-zinc-400">
            Organiza tus tareas y mantén el control de tus pendientes.
          </p>
          {usuario && (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-violet-400">
                  ● Sesión iniciada
                </p>

                <p className="mt-1 break-all text-sm text-zinc-400">
                  {usuario.email}
                </p>
              </div>

              <button
                className="cursor-pointer rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
                onClick={cerrarSesion}
              >
                Cerrar sesión
              </button>
            </div>
          )}
          {usuario && (
            <div className="flex flex-col gap-5">
              <div className="border-t border-zinc-700 pt-6">
                <h2 className="text-2xl font-semibold text-white">
                  Mis tareas
                </h2>
                <p className="mt-2 text-sm text-zinc-400">
                  Agrega nuevas tareas y organiza tus pendientes.
                </p>
              </div>
              <input
                type="text"
                placeholder="Nueva tarea"
                value={tarea}
                onChange={(event) => setTarea(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                    agregarTarea();
                  }
                }}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-white placeholder:text-zinc-400 outline-none focus:border-violet-500"
              />
              <button className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-3 rounded-lg cursor-pointer transition-colors"
                onClick={agregarTarea}
              >
                Agregar tarea
              </button>
              <ul className="flex flex-col gap-3">
                {listaTareas.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-zinc-700 bg-zinc-800 p-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <input
                        type="checkbox"
                        checked={item.completada}
                        onChange={() => cambiarEstado(item.id)}
                        className="h-5 w-5 shrink-0 cursor-pointer accent-violet-600"
                      />

                      <span
                        className={`break-words ${item.completada
                          ? "text-zinc-500 line-through"
                          : "text-zinc-100"
                          }`}
                      >
                        {item.titulo}
                      </span>
                    </div>

                    <button
                      className="shrink-0 cursor-pointer rounded-lg px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
                      onClick={() => eliminarTarea(item.id)}
                    >
                      Eliminar
                    </button>
                  </li>
                ))}
              </ul>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-zinc-700 bg-zinc-800 p-4 text-center">
                  <p className="text-sm text-zinc-400">Total</p>
                  <p className="mt-2 text-2xl font-bold text-white">
                    {listaTareas.length}
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-700 bg-zinc-800 p-4 text-center">
                  <p className="text-sm text-zinc-400">Completadas</p>
                  <p className="mt-2 text-2xl font-bold text-violet-400">
                    {listaTareas.filter((item) => item.completada).length}
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-700 bg-zinc-800 p-4 text-center">
                  <p className="text-sm text-zinc-400">Pendientes</p>
                  <p className="mt-2 text-2xl font-bold text-white">
                    {listaTareas.filter((item) => !item.completada).length}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main >
      )}
    </div >
  );
}

"use client";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { useState, useEffect } from "react";
import { Toaster, useToast } from "./components/toast";
import { AuthScreen } from "./components/auth-screen";
import { WorkspaceShell } from "./components/workspace/workspace-shell";
import { ExistingTasksView, type Tarea } from "./components/workspace/existing-tasks-view";
export default function Home() {
  const { toasts, notify, dismiss } = useToast();
  const [usuario, setUsuario] = useState<User | null>(null);
  const [tarea, setTarea] = useState("");
  const [listaTareas, setListaTareas] = useState<Tarea[]>([]);
  const [loadingSession, setLoadingSession] = useState(true);
  const usuarioId = usuario?.id;
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
      if (!usuarioId) {
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
  }, [usuarioId]);
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
        <WorkspaceShell key={usuario.id} userId={usuario.id} email={usuario.email} onSignOut={cerrarSesion}
          taskSummary={{ total: listaTareas.length, completed: listaTareas.filter((item) => item.completada).length }}>
          <ExistingTasksView tarea={tarea} setTarea={setTarea} listaTareas={listaTareas}
            agregarTarea={agregarTarea} cambiarEstado={cambiarEstado} eliminarTarea={eliminarTarea} />
        </WorkspaceShell>
      )}
    </div >
  );
}

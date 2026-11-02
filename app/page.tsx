"use client";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { useState, useEffect } from "react";
import { Toaster, useToast } from "./components/toast";
import { AuthScreen } from "./components/auth-screen";
import { WorkspaceShell } from "./components/workspace/workspace-shell";
export default function Home() {
  const { toasts, notify, dismiss } = useToast();
  const [usuario, setUsuario] = useState<User | null>(null);
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
  async function cerrarSesion() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      notify("Error al cerrar sesión: " + error.message);
      return;
    }

    setUsuario(null);
    notify("Has cerrado sesión correctamente", "success");
  }
  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-zinc-100">
      <Toaster toasts={toasts} dismiss={dismiss} />
      {loadingSession ? (
        <main className="flex min-h-screen items-center justify-center text-sm text-zinc-400" role="status">Cargando tu espacio…</main>
      ) : !usuario ? <AuthScreen notify={notify} /> : (
        <WorkspaceShell key={usuario.id} userId={usuario.id} email={usuario.email} onSignOut={cerrarSesion} />
      )}
    </div >
  );
}

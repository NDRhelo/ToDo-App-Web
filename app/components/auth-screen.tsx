"use client";

import { useRef, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";

type Field = "email" | "password" | "confirmation";

export function AuthScreen({ notify }: {
  notify: (message: string, variant?: "success" | "error") => void;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [confirmationSent, setConfirmationSent] = useState(false);
  const submitting = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const registering = mode === "register";

  function changeMode() {
    setMode(registering ? "login" : "register");
    setPassword("");
    setConfirmation("");
    setVisible(false);
    setErrors({});
    setConfirmationSent(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const nextErrors: Partial<Record<Field, string>> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) nextErrors.email = "Ingresa un correo electrónico válido.";
    if (!password) nextErrors.password = "Ingresa tu contraseña.";
    else if (registering && password.length < 6) nextErrors.password = "Usa al menos 6 caracteres.";
    if (registering && password !== confirmation) nextErrors.confirmation = "Las contraseñas no coinciden.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      formRef.current?.querySelector<HTMLInputElement>(`[name="${Object.keys(nextErrors)[0]}"]`)?.focus();
      return;
    }
    submitting.current = true;
    setBusy(true);
    try {
      const credentials = { email: email.trim(), password };
      if (registering) {
        const { data, error } = await supabase.auth.signUp(credentials);
        if (error) {
          notify("No se pudo crear la cuenta: " + error.message);
          return;
        }
        setPassword("");
        setConfirmation("");
        setConfirmationSent(!data.session);
        notify(data.session ? "¡Tu cuenta está lista!" : "Revisa tu correo para confirmar tu cuenta.", "success");
      } else {
        const { error } = await supabase.auth.signInWithPassword(credentials);
        if (error) {
          notify(error.code === "invalid_credentials" ? "El correo o la contraseña no son correctos." : "No se pudo iniciar sesión: " + error.message);
          return;
        }
        setPassword("");
        notify("¡Qué bueno verte de nuevo!", "success");
      }
    } catch {
      notify("No pudimos conectar. Revisa tu conexión e inténtalo de nuevo.");
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  const inputClass = "w-full rounded-xl border bg-zinc-950/60 px-4 py-3.5 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 disabled:opacity-60";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-6 sm:px-8 sm:py-12">
      <div className="grid w-full overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl lg:grid-cols-2">
        <section className="relative overflow-hidden border-b border-zinc-800 bg-zinc-900 p-7 sm:p-12 lg:border-r lg:border-b-0">
          <div aria-hidden="true" className="pointer-events-none absolute -top-40 -left-32 h-96 w-96 rounded-full bg-violet-600/15 blur-3xl" />
          <div className="relative">
            <div className="mb-10 flex items-center gap-3 lg:mb-16">
              <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-xl font-bold shadow-lg shadow-violet-950/50">✓</span>
              <span className="text-lg font-semibold tracking-tight">Mi ToDo App<span className="text-violet-400">.</span></span>
            </div>
            <p className="mb-4 text-xs font-semibold tracking-[0.2em] text-violet-400 uppercase">Menos ruido. Más enfoque.</p>
            <h1 className="max-w-sm text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">Un espacio para<br />tus <span className="text-violet-400">próximos pasos.</span></h1>
            <p className="mt-5 max-w-sm text-sm leading-7 text-zinc-400">Organiza lo que tienes en mente, avanza a tu ritmo y celebra cada tarea completada.</p>
            <div className="mt-9 hidden rounded-2xl border border-zinc-700/70 bg-zinc-950/60 p-5 shadow-xl sm:block" aria-label="Vista previa de tareas de ejemplo">
              <div className="mb-5 flex items-center justify-between">
                <div><p className="font-medium">Un día con intención</p><p className="mt-1 text-xs text-zinc-500">Cada pequeño paso cuenta</p></div>
                <span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-[10px] font-medium text-violet-300">VISTA PREVIA</span>
              </div>
              <div className="space-y-3">
                {["Planificar mi semana", "Dar forma a una nueva idea", "Hacer tiempo para mí"].map((task, index) => (
                  <div key={task} className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-3">
                    <span aria-hidden="true" className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs ${index === 0 ? "border-violet-500 bg-violet-600 text-white" : "border-zinc-600"}`}>{index === 0 ? "✓" : ""}</span>
                    <span className={`text-sm ${index === 0 ? "text-zinc-500 line-through" : "text-zinc-300"}`}>{task}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center gap-3"><div aria-hidden="true" className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800"><div className="h-full w-1/3 rounded-full bg-violet-500" /></div><span className="text-xs text-zinc-500">1 de 3 completadas</span></div>
            </div>
            <p className="mt-8 hidden text-xs text-zinc-500 sm:block">Tus pendientes, en un solo lugar.</p>
          </div>
        </section>
        <section className="flex items-center p-7 sm:p-12" aria-labelledby="auth-heading">
          <div className="mx-auto w-full max-w-sm">
            <p className="mb-3 text-xs font-medium tracking-widest text-violet-400 uppercase">{registering ? "Empieza hoy" : "Tu espacio personal"}</p>
            <h2 id="auth-heading" className="text-3xl font-semibold tracking-tight">{registering ? "Crea tu cuenta" : "Bienvenido de nuevo"}</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">{registering ? "Un poco de orden para todo lo que quieres lograr." : "Inicia sesión y continúa con lo que importa."}</p>
            {confirmationSent ? (
              <div role="status" className="mt-8 rounded-2xl border border-violet-500/30 bg-violet-500/10 p-5">
                <p className="font-medium text-violet-300">Revisa tu correo</p>
                <p className="mt-2 text-sm leading-6 break-words text-zinc-300">Enviamos los pasos de confirmación a <strong>{email.trim()}</strong>. Revisa también tu carpeta de spam y luego inicia sesión.</p>
                <button type="button" onClick={changeMode} className="mt-5 cursor-pointer text-sm font-medium text-violet-300 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-violet-400">Volver a iniciar sesión</button>
              </div>
            ) : (
              <form ref={formRef} onSubmit={submit} noValidate className="mt-8">
                <fieldset disabled={busy} className="space-y-5">
                  <legend className="sr-only">{registering ? "Datos de registro" : "Datos de acceso"}</legend>
                  <div>
                    <label htmlFor="email" className="mb-2 block text-sm font-medium text-zinc-300">Correo electrónico</label>
                    <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@correo.com" aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined} className={`${inputClass} ${errors.email ? "border-red-400/70" : "border-zinc-700"}`} />
                    {errors.email && <p id="email-error" className="mt-2 text-xs text-red-400">{errors.email}</p>}
                  </div>
                  <div>
                    <label htmlFor="password" className="mb-2 block text-sm font-medium text-zinc-300">Contraseña</label>
                    <div className="relative">
                      <input id="password" name="password" type={visible ? "text" : "password"} autoComplete={registering ? "new-password" : "current-password"} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder={registering ? "Al menos 6 caracteres" : "Tu contraseña"} aria-invalid={!!errors.password} aria-describedby={errors.password ? "password-error" : undefined} className={`${inputClass} pr-20 ${errors.password ? "border-red-400/70" : "border-zinc-700"}`} />
                      <button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={visible} className="absolute inset-y-0 right-3 cursor-pointer rounded px-1 text-xs font-medium text-zinc-400 hover:text-violet-300 focus-visible:outline-2 focus-visible:outline-violet-400">{visible ? "Ocultar" : "Mostrar"}</button>
                    </div>
                    {errors.password && <p id="password-error" className="mt-2 text-xs text-red-400">{errors.password}</p>}
                  </div>
                  {registering && <div>
                    <label htmlFor="confirmation" className="mb-2 block text-sm font-medium text-zinc-300">Confirma tu contraseña</label>
                    <input id="confirmation" name="confirmation" type={visible ? "text" : "password"} autoComplete="new-password" required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Repite tu contraseña" aria-invalid={!!errors.confirmation} aria-describedby={errors.confirmation ? "confirmation-error" : undefined} className={`${inputClass} ${errors.confirmation ? "border-red-400/70" : "border-zinc-700"}`} />
                    {errors.confirmation && <p id="confirmation-error" className="mt-2 text-xs text-red-400">{errors.confirmation}</p>}
                  </div>}
                  <button type="submit" aria-busy={busy} className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-500 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-400 disabled:cursor-wait disabled:opacity-60">
                    {busy && <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white motion-reduce:animate-none" />}
                    {busy ? (registering ? "Creando cuenta…" : "Ingresando…") : (registering ? "Crear mi cuenta" : "Iniciar sesión")}
                    {!busy && <span aria-hidden="true">→</span>}
                  </button>
                </fieldset>
                <div className="mt-7 border-t border-zinc-800 pt-6 text-center text-sm text-zinc-400">
                  {registering ? "¿Ya tienes una cuenta?" : "¿Primera vez por aquí?"}{" "}
                  <button type="button" disabled={busy} onClick={changeMode} className="cursor-pointer rounded font-medium text-violet-400 transition hover:text-violet-300 focus-visible:outline-2 focus-visible:outline-violet-400 disabled:cursor-wait disabled:opacity-60">{registering ? "Inicia sesión" : "Crea una cuenta"}</button>
                </div>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

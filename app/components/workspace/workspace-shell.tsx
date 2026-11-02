"use client";

import { useState, type ReactNode } from "react";
import { useBoards } from "@/app/hooks/use-boards";
import { BoardsView } from "./boards-view";
import styles from "./workspace.module.css";

type Summary = { total: number; completed: number };

function WorkspaceHeader({ email, onSignOut }: { email?: string; onSignOut: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  async function signOut() {
    if (busy) return;
    setBusy(true);
    try { await onSignOut(); } finally { setBusy(false); }
  }
  return <header className={styles.header}>
    <div className={styles.brand}><span aria-hidden="true" className={styles.brandMark}>☑</span>Mi ToDo App<span className="text-violet-400">.</span></div>
    <div className={styles.account}><span aria-hidden="true" className={styles.avatar}>{email?.[0]?.toUpperCase() ?? "U"}</span><span className={styles.email}>{email}</span><button type="button" onClick={signOut} disabled={busy} className={styles.secondary}>{busy ? "Cerrando sesión…" : "Cerrar sesión"}</button></div>
  </header>;
}

function WorkspaceSidebar({ view, onNavigate, boardCount, summary, unavailable }: {
  view: "boards" | "tasks"; onNavigate: (view: "boards" | "tasks") => void; boardCount: number; summary: Summary; unavailable: boolean;
}) {
  return <aside className={styles.sidebar} aria-label="Navegación y estadísticas">
    <p className={styles.eyebrow}>Mi espacio</p>
    <nav className={styles.nav} aria-label="Vistas del espacio">
      <button type="button" className={styles.navButton} aria-pressed={view === "boards"} aria-controls="workspace-content" onClick={() => onNavigate("boards")}><span aria-hidden="true" className={styles.navIcon}>▦</span>Tableros</button>
      <button type="button" className={styles.navButton} aria-pressed={view === "tasks"} aria-controls="workspace-content" onClick={() => onNavigate("tasks")}><span aria-hidden="true" className={styles.navIcon}>☷</span>Mis tareas</button>
    </nav>
    <section className={styles.summary} aria-label={view === "boards" ? "Resumen de tableros" : "Resumen de mis tareas"}>
      <p className={styles.eyebrow}>{view === "boards" ? "Resumen general" : "Mis tareas"}</p>
      <dl className={styles.stats}>
        <div className={styles.stat}><dt>{view === "boards" ? "Tableros" : "Total"}</dt><dd>{unavailable ? "—" : view === "boards" ? boardCount : summary.total}</dd></div>
        <div className={styles.stat}><dt>Pendientes</dt><dd>{unavailable ? "—" : summary.total - summary.completed}</dd></div>
        <div className={styles.stat}><dt>Completadas</dt><dd>{unavailable ? "—" : summary.completed}</dd></div>
      </dl>
    </section>
  </aside>;
}

type WorkspaceProps = { userId: string; email?: string; onSignOut: () => Promise<void>; taskSummary: Summary; children: ReactNode };

export function WorkspaceShell(props: WorkspaceProps) {
  return <Workspace key={props.userId} {...props} />;
}

function Workspace({ userId, email, onSignOut, taskSummary, children }: WorkspaceProps) {
  const [view, setView] = useState<"boards" | "tasks">("boards");
  const { boards, loading, loadError, operationError, pending, retry, ...actions } = useBoards(userId);
  const [announcement, setAnnouncement] = useState("");
  const tasks = boards.flatMap((board) => board.tasks);
  const boardSummary = { total: tasks.length, completed: tasks.filter((task) => task.completed).length };
  async function announce(operation: Promise<boolean>, message: string) {
    const success = await operation;
    if (success) setAnnouncement(message);
    return success;
  }
  return <div className={styles.workspace}>
    <a className={styles.skip} href="#workspace-content">Saltar al contenido</a>
    <WorkspaceHeader email={email} onSignOut={onSignOut} />
    <div className={styles.shell}>
      <WorkspaceSidebar view={view} onNavigate={(next) => { setView(next); setAnnouncement(next === "boards" ? "Vista de tableros" : "Vista de tus tareas guardadas"); }} boardCount={boards.length} unavailable={view === "boards" && (loading || !!loadError)} summary={view === "boards" ? boardSummary : taskSummary} />
      <main id="workspace-content" className={styles.main}>
        {view === "boards" ? <BoardsView boards={boards} loading={loading} loadError={loadError} operationError={operationError} pending={pending} onRetry={retry}
          onCreate={(title) => announce(actions.create(title), "Tablero guardado.")}
          onRename={(id, title) => announce(actions.rename(id, title), "Nombre guardado.")}
          onDelete={(id) => announce(actions.remove(id), "Tablero y subtareas eliminados.")}
          onAddTask={(id, title) => announce(actions.addTask(id, title), "Subtarea guardada.")}
          onToggle={(id, taskId) => announce(actions.toggle(id, taskId), "Progreso guardado.")} /> : <div className={styles.legacy}>{children}</div>}
        <p role="status" className="sr-only">{announcement}</p>
      </main>
    </div>
  </div>;
}

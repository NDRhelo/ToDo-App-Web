import { act, render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkspaceShell } from "@/app/components/workspace/workspace-shell";
import { ExistingTasksView } from "@/app/components/workspace/existing-tasks-view";

import * as api from "@/lib/boards";
import { demoBoards } from "@/lib/demo-boards";
import type { Board } from "@/lib/board-types";

vi.mock("@/lib/boards", () => ({
  listBoards: vi.fn(), createBoard: vi.fn(), renameBoard: vi.fn(), deleteBoard: vi.fn(), createSubtask: vi.fn(), setSubtaskCompleted: vi.fn(),
}));
let stored: Board[];
beforeEach(() => {
  vi.resetAllMocks();
  stored = structuredClone(demoBoards);
  vi.mocked(api.listBoards).mockImplementation(async () => structuredClone(stored));
  vi.mocked(api.createBoard).mockImplementation(async (title) => {
    const board: Board = { id: crypto.randomUUID(), title, accent: "violet", tasks: [] };
    stored.push(board); return structuredClone(board);
  });
  vi.mocked(api.renameBoard).mockImplementation(async (id, title) => {
    const board = stored.find((board) => board.id === id)!;
    board.title = title;
    return { id, title, accent: board.accent };
  });
  vi.mocked(api.deleteBoard).mockImplementation(async (id) => { stored = stored.filter((board) => board.id !== id); });
  vi.mocked(api.createSubtask).mockImplementation(async (id, title) => {
    const task = { id: crypto.randomUUID(), title, completed: false };
    stored.find((board) => board.id === id)!.tasks.push(task); return structuredClone(task);
  });
  vi.mocked(api.setSubtaskCompleted).mockImplementation(async (id, completed) => {
    const task = stored.flatMap((board) => board.tasks).find((task) => task.id === id)!;
    task.completed = completed; return structuredClone(task);
  });
});

async function setup() {
  const user = userEvent.setup();
  const callbacks = { agregarTarea: vi.fn().mockResolvedValue(undefined), cambiarEstado: vi.fn().mockResolvedValue(undefined), eliminarTarea: vi.fn().mockResolvedValue(undefined) };
  const onSignOut = vi.fn().mockResolvedValue(undefined);
  render(<WorkspaceShell userId="account-a" email="persona@example.com" onSignOut={onSignOut} taskSummary={{ total: 1, completed: 0 }}>
    <ExistingTasksView tarea="Tarea real" setTarea={vi.fn()} listaTareas={[{ id: 42, titulo: "Preparar informe", completada: false }]} {...callbacks} />
  </WorkspaceShell>);
  await screen.findByRole("heading", { name: "Mis tableros" });
  await waitFor(() => expect(screen.queryByText("Cargando tus tableros…")).not.toBeInTheDocument());
  return { user, callbacks, onSignOut };
}

const board = (name: string) => screen.getByRole("article", { name });
const summary = () => screen.getByRole("region", { name: "Resumen de tableros" });

describe("Espacio de trabajo", () => {
  it("carga los tableros guardados y calcula progreso y estadísticas", async () => {
    await setup();
    expect(screen.getAllByRole("article")).toHaveLength(3);
    expect(screen.getByRole("progressbar", { name: "Progreso de Semana de exámenes finales" })).toHaveAttribute("aria-valuenow", "25");
    expect(within(summary()).getByText("Pendientes").nextElementSibling).toHaveTextContent("6");
    expect(within(summary()).getByText("Completadas").nextElementSibling).toHaveTextContent("4");
    expect(api.listBoards).toHaveBeenCalledWith("account-a");
    expect(screen.queryByText(/vista de ejemplo/i)).not.toBeInTheDocument();
  });

  it("actualiza el progreso y el resumen al completar una subtarea", async () => {
    const { user, callbacks } = await setup();
    await user.click(screen.getByRole("checkbox", { name: "Repasar matemáticas" }));
    expect(screen.getByRole("progressbar", { name: "Progreso de Semana de exámenes finales" })).toHaveAttribute("aria-valuenow", "50");
    expect(within(summary()).getByText("Pendientes").nextElementSibling).toHaveTextContent("5");
    expect(callbacks.cambiarEstado).not.toHaveBeenCalled();
  });

  it("crea un tablero vacío y agrega una tarea únicamente dentro de él", async () => {
    const { user, callbacks } = await setup();
    await user.click(screen.getByRole("button", { name: "Crear tablero" }));
    const name = screen.getByRole("textbox", { name: "Nombre del tablero" });
    expect(name).toHaveFocus();
    await user.type(name, "  Viaje  ");
    await user.click(screen.getByRole("button", { name: "Crear" }));
    const travel = board("Viaje");
    expect(within(travel).getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
    await user.click(within(travel).getByRole("button", { name: "Agregar tarea" }));
    await user.type(within(travel).getByRole("textbox", { name: "Nueva tarea" }), "Reservar hotel{Enter}");
    expect(within(travel).getByRole("checkbox", { name: "Reservar hotel" })).not.toBeChecked();
    expect(within(board("Compras")).queryByText("Reservar hotel")).not.toBeInTheDocument();
    expect(callbacks.agregarTarea).not.toHaveBeenCalled();
  });

  it("rechaza títulos con solo espacios y permite cancelar con Escape", async () => {
    const { user } = await setup();
    const create = screen.getByRole("button", { name: "Crear tablero" });
    await user.click(create);
    await user.type(screen.getByRole("textbox", { name: "Nombre del tablero" }), "   {Enter}");
    expect(screen.getAllByRole("article")).toHaveLength(3);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("textbox", { name: "Nombre del tablero" })).not.toBeInTheDocument();
    expect(create).toHaveFocus();
    expect(create).toHaveAttribute("aria-expanded", "false");
  });

  it("conserva los cambios guardados al navegar y mantiene las acciones de tareas reales", async () => {
    const { user, callbacks } = await setup();
    await user.click(screen.getByRole("checkbox", { name: "Repasar matemáticas" }));
    await user.click(screen.getByRole("button", { name: "Mis tareas" }));
    expect(screen.getByRole("heading", { name: "Mis tareas" })).toBeVisible();
    expect(screen.getByRole("region", { name: "Resumen de mis tareas" })).toHaveTextContent("Total1");
    await user.click(screen.getByRole("button", { name: "Agregar tarea" }));
    await user.click(screen.getByRole("checkbox", { name: "Completar Preparar informe" }));
    await user.click(screen.getByRole("button", { name: "Eliminar" }));
    expect(callbacks.agregarTarea).toHaveBeenCalledTimes(1);
    expect(callbacks.cambiarEstado).toHaveBeenCalledWith(42);
    expect(callbacks.eliminarTarea).toHaveBeenCalledWith(42);
    await user.click(screen.getByRole("button", { name: "Tableros" }));
    expect(screen.getByRole("checkbox", { name: "Repasar matemáticas" })).toBeChecked();
  });

  it("ejecuta el cierre de sesión existente", async () => {
    const { user, onSignOut } = await setup();
    await user.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });
  it("renombra un tablero sin perder subtareas ni progreso y valida nombres vacíos", async () => {
    const { user } = await setup();
    await user.click(screen.getByLabelText("Opciones de Compras"));
    await user.click(within(board("Compras")).getByRole("button", { name: "Cambiar nombre" }));
    const input = screen.getByRole("textbox", { name: "Nombre del tablero" });
    expect(input).toHaveFocus();
    await user.clear(input);
    await user.type(input, "   ");
    await user.click(screen.getByRole("button", { name: "Guardar nombre" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Escribe un nombre");
    await user.clear(input);
    await user.type(input, "  Compras del mes  {Enter}");
    expect(screen.queryByRole("article", { name: "Compras" })).not.toBeInTheDocument();
    expect(within(board("Compras del mes")).getAllByRole("checkbox")).toHaveLength(3);
    expect(within(board("Compras del mes")).getByRole("progressbar")).toHaveAttribute("aria-valuenow", "67");
    expect(screen.getByLabelText("Opciones de Compras del mes")).toHaveFocus();
  });

  it("permite cancelar una eliminación y al confirmar elimina subtareas y actualiza estadísticas", async () => {
    const { user, callbacks } = await setup();
    await user.click(screen.getByLabelText("Opciones de Compras"));
    await user.click(within(board("Compras")).getByRole("button", { name: "Eliminar tablero" }));
    const confirmation = screen.getByRole("group", { name: "¿Eliminar «Compras»?" });
    expect(confirmation).toHaveTextContent("3 subtareas");
    expect(within(confirmation).getByRole("button", { name: "Cancelar" })).toHaveFocus();
    await user.click(within(confirmation).getByRole("button", { name: "Cancelar" }));
    expect(board("Compras")).toBeVisible();
    await user.click(screen.getByLabelText("Opciones de Compras"));
    await user.click(within(board("Compras")).getByRole("button", { name: "Eliminar tablero" }));
    await user.click(screen.getByRole("button", { name: "Confirmar eliminación" }));
    expect(screen.queryByRole("article", { name: "Compras" })).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "Café para la semana" })).not.toBeInTheDocument();
    expect(within(summary()).getByText("Tableros").nextElementSibling).toHaveTextContent("2");
    expect(within(summary()).getByText("Pendientes").nextElementSibling).toHaveTextContent("5");
    expect(within(summary()).getByText("Completadas").nextElementSibling).toHaveTextContent("2");
    expect(callbacks.eliminarTarea).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Crear tablero" })).toHaveFocus();
  });

  it("elimina un tablero vacío sin pedir confirmación", async () => {
    const { user } = await setup();
    await user.click(screen.getByRole("button", { name: "Crear tablero" }));
    await user.type(screen.getByRole("textbox", { name: "Nombre del tablero" }), "Vacío{Enter}");
    await user.click(screen.getByLabelText("Opciones de Vacío"));
    await user.click(within(board("Vacío")).getByRole("button", { name: "Eliminar tablero" }));
    expect(screen.queryByRole("article", { name: "Vacío" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Confirmar eliminación" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(3);
  });

  it("cancela el cambio de nombre con Escape y muestra un estado vacío al eliminar todos los tableros", async () => {
    const { user } = await setup();
    await user.click(screen.getByLabelText("Opciones de Compras"));
    await user.click(within(board("Compras")).getByRole("button", { name: "Cambiar nombre" }));
    await user.clear(screen.getByRole("textbox", { name: "Nombre del tablero" }));
    await user.keyboard("{Escape}");
    expect(board("Compras")).toBeVisible();
    expect(screen.queryByRole("textbox", { name: "Nombre del tablero" })).not.toBeInTheDocument();
    for (const name of ["Compras", "Proyecto personal", "Semana de exámenes finales"]) {
      await user.click(screen.getByLabelText(`Opciones de ${name}`));
      await user.click(within(board(name)).getByRole("button", { name: "Eliminar tablero" }));
      await user.click(screen.getByRole("button", { name: "Confirmar eliminación" }));
    }
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
    expect(screen.getByText("Tu espacio está listo. Crea un tablero para empezar.")).toBeVisible();
    expect(within(summary()).getAllByText("0")).toHaveLength(3);
  });

  it("muestra carga sin estadísticas falsas y una cuenta vacía sin insertar ejemplos", async () => {
    let resolve!: (boards: Board[]) => void;
    vi.mocked(api.listBoards).mockReturnValue(new Promise((done) => { resolve = done; }));
    render(<WorkspaceShell userId="empty" onSignOut={vi.fn()} taskSummary={{ total: 0, completed: 0 }}>Mis tareas</WorkspaceShell>);
    expect(screen.getByText("Cargando tus tableros…")).toBeVisible();
    expect(within(summary()).getAllByText("—")).toHaveLength(3);
    expect(screen.queryByText(/Tu espacio está listo/)).not.toBeInTheDocument();
    await act(async () => resolve([]));
    expect(screen.getByText(/Tu espacio está listo/)).toBeVisible();
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
    expect(api.createBoard).not.toHaveBeenCalled();
  });

  it("permite reintentar una carga fallida", async () => {
    vi.mocked(api.listBoards).mockRejectedValueOnce(new Error("Offline"));
    await setup();
    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos cargar");
    expect(within(summary()).getAllByText("—")).toHaveLength(3);
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByRole("article", { name: "Compras" })).toBeVisible();
  });

  it("espera la confirmación de creación y bloquea envíos duplicados", async () => {
    const { user } = await setup();
    let resolve!: (board: Board) => void;
    vi.mocked(api.createBoard).mockReturnValue(new Promise((done) => { resolve = done; }));
    await user.click(screen.getByRole("button", { name: "Crear tablero" }));
    await user.type(screen.getByRole("textbox", { name: "Nombre del tablero" }), "Viaje{Enter}");
    expect(screen.queryByRole("article", { name: "Viaje" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardando…" })).toBeDisabled();
    await user.keyboard("{Enter}");
    expect(api.createBoard).toHaveBeenCalledTimes(1);
    await act(async () => resolve({ id: "saved", title: "Viaje", accent: "violet", tasks: [] }));
    expect(board("Viaje")).toBeVisible();
  });

  it("conserva el texto y permite reintentar cuando falla crear un tablero", async () => {
    const { user } = await setup();
    vi.mocked(api.createBoard).mockRejectedValueOnce(new Error("Offline"));
    await user.click(screen.getByRole("button", { name: "Crear tablero" }));
    await user.type(screen.getByRole("textbox", { name: "Nombre del tablero" }), "Viaje{Enter}");
    expect(screen.getByRole("alert")).toHaveTextContent("No se pudo crear");
    expect(screen.getByRole("textbox", { name: "Nombre del tablero" })).toHaveValue("Viaje");
    expect(screen.queryByRole("article", { name: "Viaje" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Crear" }));
    expect(board("Viaje")).toBeVisible();
  });

  it("conserva la subtarea escrita si el guardado falla", async () => {
    const { user } = await setup();
    vi.mocked(api.createSubtask).mockRejectedValueOnce(new Error("Offline"));
    await user.click(within(board("Compras")).getByRole("button", { name: "Agregar tarea" }));
    await user.type(screen.getByRole("textbox", { name: "Nueva tarea" }), "Pan{Enter}");
    expect(screen.getByRole("textbox", { name: "Nueva tarea" })).toHaveValue("Pan");
    expect(screen.queryByRole("checkbox", { name: "Pan" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Agregar" }));
    expect(screen.getByRole("checkbox", { name: "Pan" })).toBeVisible();
  });

  it("no cambia checkbox ni progreso antes de confirmar y permite descompletar", async () => {
    const { user } = await setup();
    let reject!: (error: Error) => void;
    vi.mocked(api.setSubtaskCompleted).mockReturnValueOnce(new Promise((_, fail) => { reject = fail; }));
    const checkbox = screen.getByRole("checkbox", { name: "Repasar matemáticas" });
    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
    expect(checkbox).toBeDisabled();
    expect(screen.getByRole("progressbar", { name: "Progreso de Semana de exámenes finales" })).toHaveAttribute("aria-valuenow", "25");
    await act(async () => reject(new Error("Offline")));
    expect(checkbox).not.toBeChecked();
    expect(checkbox).toBeEnabled();
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
    expect(api.setSubtaskCompleted).toHaveBeenLastCalledWith("math", false);
  });

  it("no cierra renombrado ni cambia el título si Supabase rechaza la escritura", async () => {
    const { user } = await setup();
    vi.mocked(api.renameBoard).mockRejectedValueOnce(new Error("Denied"));
    await user.click(screen.getByLabelText("Opciones de Compras"));
    await user.click(within(board("Compras")).getByRole("button", { name: "Cambiar nombre" }));
    const input = screen.getByRole("textbox", { name: "Nombre del tablero" });
    await user.clear(input);
    await user.type(input, "Nuevo{Enter}");
    expect(input).toHaveValue("Nuevo");
    expect(board("Compras")).toBeVisible();
    expect(screen.getByRole("alert")).toHaveTextContent("No se pudo cambiar");
  });

  it("conserva el tablero y sus estadísticas mientras elimina y si falla", async () => {
    const { user } = await setup();
    let reject!: (error: Error) => void;
    vi.mocked(api.deleteBoard).mockReturnValueOnce(new Promise((_, fail) => { reject = fail; }));
    await user.click(screen.getByLabelText("Opciones de Compras"));
    await user.click(within(board("Compras")).getByRole("button", { name: "Eliminar tablero" }));
    await user.click(screen.getByRole("button", { name: "Confirmar eliminación" }));
    expect(board("Compras")).toBeVisible();
    expect(screen.getByRole("button", { name: "Eliminando…" })).toBeDisabled();
    expect(within(summary()).getByText("Completadas").nextElementSibling).toHaveTextContent("4");
    await act(async () => reject(new Error("Offline")));
    expect(board("Compras")).toBeVisible();
    expect(screen.getByRole("button", { name: "Confirmar eliminación" })).toBeEnabled();
  });

  it("descarta una respuesta pendiente cuando cambia la cuenta", async () => {
    let resolve!: (boards: Board[]) => void;
    vi.mocked(api.listBoards).mockReturnValueOnce(new Promise((done) => { resolve = done; })).mockResolvedValueOnce([]);
    const props = { onSignOut: vi.fn(), taskSummary: { total: 0, completed: 0 }, children: "Mis tareas" };
    const { rerender } = render(<WorkspaceShell userId="a" {...props} />);
    rerender(<WorkspaceShell userId="b" {...props} />);
    await screen.findByText(/Tu espacio está listo/);
    await act(async () => resolve(structuredClone(demoBoards)));
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
    expect(api.listBoards).toHaveBeenLastCalledWith("b");
  });

  it("vuelve a consultar los cambios guardados al remontar el espacio de trabajo", async () => {
    const props = { userId: "a", onSignOut: vi.fn(), taskSummary: { total: 0, completed: 0 }, children: "Mis tareas" };
    const first = render(<WorkspaceShell {...props} />);
    await screen.findByRole("article", { name: "Compras" });
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Crear tablero" }));
    await user.type(screen.getByRole("textbox", { name: "Nombre del tablero" }), "Persistente{Enter}");
    expect(board("Persistente")).toBeVisible();
    first.unmount();
    render(<WorkspaceShell {...props} />);
    expect(await screen.findByRole("article", { name: "Persistente" })).toBeVisible();
    expect(api.listBoards).toHaveBeenCalledTimes(2);
  });

  it("no aplica una escritura de la cuenta anterior en la nueva sesión", async () => {
    let resolve!: (board: Board) => void;
    vi.mocked(api.createBoard).mockReturnValueOnce(new Promise((done) => { resolve = done; }));
    const props = { onSignOut: vi.fn(), taskSummary: { total: 0, completed: 0 }, children: "Mis tareas" };
    const { rerender } = render(<WorkspaceShell userId="a" {...props} />);
    await screen.findByRole("article", { name: "Compras" });
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Crear tablero" }));
    await user.type(screen.getByRole("textbox", { name: "Nombre del tablero" }), "Privado{Enter}");
    vi.mocked(api.listBoards).mockResolvedValueOnce([]);
    rerender(<WorkspaceShell userId="b" {...props} />);
    await screen.findByText(/Tu espacio está listo/);
    await act(async () => resolve({ id: "late", title: "Privado", accent: "violet", tasks: [] }));
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
    expect(screen.queryByText("Tablero guardado.")).not.toBeInTheDocument();
  });

});

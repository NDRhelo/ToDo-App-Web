import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Home from "@/app/page";
import * as api from "@/lib/boards";
import type { Board } from "@/lib/board-types";
vi.mock("@/lib/boards", () => ({ listBoards: vi.fn() }));

type Session = { user: { id: string; email: string } } | null;
const mocks = vi.hoisted(() => ({ getSession: vi.fn(), onAuthStateChange: vi.fn(), unsubscribe: vi.fn(), from: vi.fn(), select: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ supabase: { auth: { getSession: mocks.getSession, onAuthStateChange: mocks.onAuthStateChange }, from: mocks.from } }));
vi.mock("@/app/components/auth-screen", () => ({ AuthScreen: () => <p>Formulario de acceso</p> }));
let listener: (event: string, session: Session) => void;
const account = (id: string): Session => ({ user: { id, email: `${id}@example.com` } });
const row = (title: string): Board => ({ id: title, title, accent: "violet", tasks: [] });

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });
  mocks.onAuthStateChange.mockImplementation((callback) => {
    listener = callback;
    return { data: { subscription: { unsubscribe: mocks.unsubscribe } } };
  });
  mocks.from.mockReturnValue({ select: mocks.select });
  vi.mocked(api.listBoards).mockResolvedValue([]);
});

async function emit(session: Session, event = "SIGNED_IN") {
  await act(async () => listener(event, session));
}

describe("Carga de tareas según la cuenta autenticada", () => {
  it("carga al iniciar sesión y no repite la consulta al renovar la misma cuenta", async () => {
    vi.mocked(api.listBoards).mockResolvedValue([row("Tarea guardada")]);
    render(<Home />);
    await screen.findByText("Formulario de acceso");
    expect(api.listBoards).not.toHaveBeenCalled();
    await emit(account("a"));
    expect(await screen.findByText("Tarea guardada")).toBeVisible();
    expect(api.listBoards).toHaveBeenCalledTimes(1);
    expect(mocks.from).not.toHaveBeenCalled();
    await emit(account("a"), "TOKEN_REFRESHED");
    await emit(account("a"), "SIGNED_IN");
    expect(api.listBoards).toHaveBeenCalledTimes(1);
    await emit(null, "SIGNED_OUT");
    expect(screen.getByText("Formulario de acceso")).toBeVisible();
    expect(api.listBoards).toHaveBeenCalledTimes(1);
  });

  it("descarta una consulta pendiente de la cuenta anterior", async () => {
    let finish!: (result: Board[]) => void;
    vi.mocked(api.listBoards).mockReturnValueOnce(new Promise((resolve) => { finish = resolve; }))
      .mockResolvedValueOnce([row("Tarea de B")]);
    render(<Home />);
    await screen.findByText("Formulario de acceso");
    await emit(account("a"));
    await emit(account("b"));
    expect(await screen.findByText("Tarea de B")).toBeVisible();
    await act(async () => finish([row("Tarea de A")]));
    expect(screen.queryByText("Tarea de A")).not.toBeInTheDocument();
    expect(screen.getByText("Tarea de B")).toBeVisible();
    expect(api.listBoards).toHaveBeenCalledTimes(2);
  });

  it("descarta respuestas después de salir y vuelve a cargar al ingresar de nuevo", async () => {
    let finish!: (result: Board[]) => void;
    vi.mocked(api.listBoards).mockReturnValueOnce(new Promise((resolve) => { finish = resolve; }))
      .mockResolvedValueOnce([row("Consulta nueva")]);
    const { unmount } = render(<Home />);
    await screen.findByText("Formulario de acceso");
    await emit(account("a"));
    await emit(null, "SIGNED_OUT");
    await act(async () => finish([row("Consulta antigua")]));
    expect(screen.getByText("Formulario de acceso")).toBeVisible();
    await emit(account("a"));
    expect(await screen.findByText("Consulta nueva")).toBeVisible();
    expect(screen.queryByText("Consulta antigua")).not.toBeInTheDocument();
    await waitFor(() => expect(api.listBoards).toHaveBeenCalledTimes(2));
    unmount();
    expect(mocks.unsubscribe).toHaveBeenCalledTimes(1);
  });
});

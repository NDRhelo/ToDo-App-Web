import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Toaster, useToast } from "@/app/components/toast";

function Notifications() {
  const { toasts, notify, dismiss } = useToast();
  return <>
    <button onClick={() => notify("Guardado", "success")}>Confirmar</button>
    <button onClick={() => notify("Falló la conexión")}>Error</button>
    <Toaster toasts={toasts} dismiss={dismiss} />
  </>;
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("Notificaciones toast", () => {
  it("anuncia confirmaciones y errores con roles accesibles y los cierra a tiempo", () => {
    render(<Notifications />);
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    fireEvent.click(screen.getByRole("button", { name: "Error" }));
    expect(screen.getByRole("status")).toHaveTextContent("Guardado");
    expect(screen.getByRole("alert")).toHaveTextContent("Falló la conexión");
    act(() => vi.advanceTimersByTime(6000));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeVisible();
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("cierra manualmente solo la notificación elegida y cancela su temporizador", () => {
    render(<Notifications />);
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    fireEvent.click(screen.getByRole("button", { name: "Error" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Cerrar notificación" })[0]);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeVisible();
    expect(vi.getTimerCount()).toBe(1);
  });

  it("limpia los temporizadores al desmontar el componente", () => {
    const { unmount } = render(<Notifications />);
    fireEvent.click(screen.getByRole("button", { name: "Error" }));
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});

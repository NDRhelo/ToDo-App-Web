import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthScreen } from "@/app/components/auth-screen";

const auth = vi.hoisted(() => ({ signUp: vi.fn(), signInWithPassword: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ supabase: { auth } }));

const notify = vi.fn();
const email = () => screen.getByLabelText("Correo electrónico");
const password = () => screen.getByLabelText("Contraseña");

async function fillCredentials(user: ReturnType<typeof userEvent.setup>, secret = "secreto123") {
  await user.type(email(), "persona@example.com");
  await user.type(password(), secret);
}

beforeEach(() => vi.resetAllMocks());

describe("Acceso y registro", () => {
  it("bloquea campos vacíos y dirige el foco al primer error", async () => {
    const user = userEvent.setup();
    render(<AuthScreen notify={notify} />);
    await user.click(screen.getByRole("button", { name: /Iniciar sesión/ }));
    expect(email()).toHaveFocus();
    expect(email()).toHaveAccessibleDescription("Ingresa un correo electrónico válido.");
    expect(password()).toHaveAccessibleDescription("Ingresa tu contraseña.");
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it("rechaza un correo con formato inválido sin consultar Supabase", async () => {
    const user = userEvent.setup();
    render(<AuthScreen notify={notify} />);
    await user.type(email(), "correo-invalido");
    await user.type(password(), "secreto123");
    await user.click(screen.getByRole("button", { name: /Iniciar sesión/ }));
    expect(email()).toHaveAttribute("aria-invalid", "true");
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it("valida longitud y coincidencia de contraseñas durante el registro", async () => {
    const user = userEvent.setup();
    render(<AuthScreen notify={notify} />);
    await user.click(screen.getByRole("button", { name: "Crea una cuenta" }));
    await fillCredentials(user, "123");
    await user.type(screen.getByLabelText("Confirma tu contraseña"), "otra");
    await user.click(screen.getByRole("button", { name: /Crear mi cuenta/ }));
    expect(password()).toHaveAccessibleDescription("Usa al menos 6 caracteres.");
    expect(screen.getByLabelText("Confirma tu contraseña")).toHaveAccessibleDescription("Las contraseñas no coinciden.");
    expect(auth.signUp).not.toHaveBeenCalled();
  });

  it("permite mostrar y ocultar la contraseña y la borra al cambiar de formulario", async () => {
    const user = userEvent.setup();
    render(<AuthScreen notify={notify} />);
    await user.type(password(), "privada");
    await user.click(screen.getByRole("button", { name: "Mostrar contraseña" }));
    expect(password()).toHaveAttribute("type", "text");
    await user.click(screen.getByRole("button", { name: "Ocultar contraseña" }));
    expect(password()).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: "Crea una cuenta" }));
    expect(password()).toHaveValue("");
    expect(screen.getByLabelText("Confirma tu contraseña")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Inicia sesión" }));
    expect(screen.queryByLabelText("Confirma tu contraseña")).not.toBeInTheDocument();
  });

  it("envía el login con Enter y limpia la contraseña al completar", async () => {
    auth.signInWithPassword.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<AuthScreen notify={notify} />);
    await fillCredentials(user);
    await user.keyboard("{Enter}");
    expect(auth.signInWithPassword).toHaveBeenCalledExactlyOnceWith({ email: "persona@example.com", password: "secreto123" });
    expect(password()).toHaveValue("");
    expect(notify).toHaveBeenCalledWith("¡Qué bueno verte de nuevo!", "success");
  });

  it("evita envíos duplicados mientras espera la respuesta", async () => {
    let finish!: (value: { error: null }) => void;
    auth.signInWithPassword.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    const user = userEvent.setup();
    render(<AuthScreen notify={notify} />);
    await fillCredentials(user);
    const button = screen.getByRole("button", { name: /Iniciar sesión/ });
    await user.click(button);
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent("Ingresando…");
    expect(screen.getByRole("button", { name: "Crea una cuenta" })).toBeDisabled();
    fireEvent.submit(button.closest("form")!);
    expect(auth.signInWithPassword).toHaveBeenCalledTimes(1);
    await act(async () => finish({ error: null }));
    expect(button).toBeEnabled();
  });

  it("informa credenciales incorrectas y permite reintentar", async () => {
    auth.signInWithPassword.mockResolvedValue({ error: { code: "invalid_credentials" } });
    const user = userEvent.setup();
    render(<AuthScreen notify={notify} />);
    await fillCredentials(user);
    await user.click(screen.getByRole("button", { name: /Iniciar sesión/ }));
    expect(notify).toHaveBeenCalledWith("El correo o la contraseña no son correctos.");
    expect(screen.getByRole("button", { name: /Iniciar sesión/ })).toBeEnabled();
  });

  it("recupera el formulario ante un fallo de conexión", async () => {
    auth.signInWithPassword.mockRejectedValue(new Error("Network error"));
    const user = userEvent.setup();
    render(<AuthScreen notify={notify} />);
    await fillCredentials(user);
    await user.click(screen.getByRole("button", { name: /Iniciar sesión/ }));
    expect(notify).toHaveBeenCalledWith("No pudimos conectar. Revisa tu conexión e inténtalo de nuevo.");
    expect(screen.getByRole("button", { name: /Iniciar sesión/ })).toBeEnabled();
  });

  it("muestra la confirmación por correo y permite volver al login", async () => {
    auth.signUp.mockResolvedValue({ data: { session: null }, error: null });
    const user = userEvent.setup();
    render(<AuthScreen notify={notify} />);
    await user.click(screen.getByRole("button", { name: "Crea una cuenta" }));
    await fillCredentials(user);
    await user.type(screen.getByLabelText("Confirma tu contraseña"), "secreto123");
    await user.click(screen.getByRole("button", { name: /Crear mi cuenta/ }));
    expect(auth.signUp).toHaveBeenCalledExactlyOnceWith({ email: "persona@example.com", password: "secreto123" });
    expect(screen.getByRole("status")).toHaveTextContent("persona@example.com");
    await user.click(screen.getByRole("button", { name: "Volver a iniciar sesión" }));
    expect(password()).toHaveValue("");
    expect(email()).toHaveValue("persona@example.com");
  });

  it("no solicita confirmación por correo si Supabase ya devuelve una sesión", async () => {
    auth.signUp.mockResolvedValue({ data: { session: { access_token: "test-only" } }, error: null });
    const user = userEvent.setup();
    render(<AuthScreen notify={notify} />);
    await user.click(screen.getByRole("button", { name: "Crea una cuenta" }));
    await fillCredentials(user);
    await user.type(screen.getByLabelText("Confirma tu contraseña"), "secreto123");
    await user.click(screen.getByRole("button", { name: /Crear mi cuenta/ }));
    expect(notify).toHaveBeenCalledWith("¡Tu cuenta está lista!", "success");
    expect(screen.queryByText("Revisa tu correo")).not.toBeInTheDocument();
  });

  it("conserva el formulario cuando Supabase rechaza el registro", async () => {
    auth.signUp.mockResolvedValue({ error: { message: "Registro no disponible" } });
    const user = userEvent.setup();
    render(<AuthScreen notify={notify} />);
    await user.click(screen.getByRole("button", { name: "Crea una cuenta" }));
    await fillCredentials(user);
    await user.type(screen.getByLabelText("Confirma tu contraseña"), "secreto123");
    await user.click(screen.getByRole("button", { name: /Crear mi cuenta/ }));
    expect(notify).toHaveBeenCalledWith("No se pudo crear la cuenta: Registro no disponible");
    expect(screen.getByRole("button", { name: /Crear mi cuenta/ })).toBeEnabled();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});

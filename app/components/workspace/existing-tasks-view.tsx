import type { Dispatch, SetStateAction } from "react";

export type Tarea = { id: number; titulo: string; completada: boolean };

export function ExistingTasksView({ tarea, setTarea, listaTareas, agregarTarea, cambiarEstado, eliminarTarea }: {
  tarea: string; setTarea: Dispatch<SetStateAction<string>>; listaTareas: Tarea[];
  agregarTarea: () => Promise<void>; cambiarEstado: (id: number) => Promise<void>; eliminarTarea: (id: number) => Promise<void>;
}) {
  return (
            <div className="flex flex-col gap-5">
              <div className="pb-2">
                <h1 className="text-3xl font-semibold tracking-tight text-white">
                  Mis tareas
                </h1>
                <p className="mt-2 text-sm text-zinc-400">
                  Agrega nuevas tareas y organiza tus pendientes.
                </p>
              </div>
              <label htmlFor="existing-new-task" className="sr-only">Nueva tarea</label>
              <input
                id="existing-new-task"
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
                        aria-label={`Completar ${item.titulo}`}
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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
  );
}

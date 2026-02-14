import type { DatabaseAdapter } from "@myapp/lib/db/adapter"

// SharedWorker - una instancia compartida entre todas las pestañas
let worker: SharedWorker | null = null

// Callbacks para notificar cambios a otras pestañas
const changeListeners: Set<() => void> = new Set()

function getWorker(): SharedWorker {
  if (typeof window === "undefined") {
    throw new Error("SharedWorker solo disponible en el navegador")
  }

  if (!worker) {
    // Cargar worker desde /public
    worker = new SharedWorker("/worker.js", { name: "sqlite-worker" })

    worker.port.onmessage = (event) => {
      const data = event.data

      // Notificación de cambios de otra pestaña
      if (data.type === "db-changed") {
        changeListeners.forEach((listener) => listener())
        return
      }

      // Respuesta a un query
      const { success, result, error, id } = data
      const request = pending.get(id)

      if (request) {
        pending.delete(id)
        if (success) {
          request.resolve(result)
        } else {
          request.reject(new Error(error))
        }
      }
    }

    worker.port.start()
  }

  return worker
}

// Pending requests map
const pending = new Map<
  string,
  {
    resolve: (value: unknown) => void
    reject: (reason: unknown) => void
  }
>()

export class WebDatabaseAdapter implements DatabaseAdapter {
  execute<T = unknown>(query: string, params: unknown[] = []): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const id = crypto.randomUUID()
      pending.set(id, {
        resolve: (value) => resolve(value as T),
        reject,
      })
      getWorker().port.postMessage({ query, params, id })
    })
  }
}

// API para escuchar cambios de otras pestañas
export function onDatabaseChange(callback: () => void): () => void {
  changeListeners.add(callback)
  return () => changeListeners.delete(callback)
}

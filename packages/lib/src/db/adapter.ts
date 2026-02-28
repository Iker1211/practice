import type { Database } from './types'

export type Adapter = {
  from(table: string): any
  select(query: string): any
}

export const adapter = {
  getDatabase(): Database {
    return {} as Database
  },
}

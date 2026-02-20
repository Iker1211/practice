import type { DatabaseAdapter } from "./adapter"

export class IdeaRepository {
  #db: DatabaseAdapter
  constructor(db: DatabaseAdapter) {
    this.#db = db
  }

  async create(title: string) {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    await this.#db.execute(
      `INSERT INTO ideas (id, title, created_at, updated_at, version)
       VALUES (?, ?, ?, ?, 1)`,
      [id, title, now, now],
    )

    return id
  }

  async getAll() {
    return this.#db.execute(
      `SELECT * FROM ideas
       WHERE deleted_at IS NULL
       ORDER BY created_at DESC`,
    )
  }

  async update(id: string, title: string) {
    const now = new Date().toISOString()

    await this.#db.execute(
      `UPDATE ideas
       SET title = ?,
           updated_at = ?,
           version = version + 1
       WHERE id = ?
       AND deleted_at IS NULL`,
      [title, now, id],
    )
  }

  async delete(id: string) {
    const now = new Date().toISOString()

    await this.#db.execute(
      `UPDATE ideas
       SET deleted_at = ?,
           version = version + 1
       WHERE id = ?`,
      [now, id],
    )
  }
}

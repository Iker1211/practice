export interface DatabaseAdapter {
  execute<T = any>(
    query: string,
    params?: any[]
  ): Promise<T>
}

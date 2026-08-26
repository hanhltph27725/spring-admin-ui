import type { Page } from '../types'

const BASE = '/api'

export class ApiError extends Error {
  status: number
  fieldErrors?: Record<string, string>
  constructor(message: string, status: number, fieldErrors?: Record<string, string>) {
    super(message)
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

async function handle<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T
  const text = await res.text()
  const body = text ? JSON.parse(text) : undefined
  if (!res.ok) {
    const message = body?.message || body?.error || `Request failed (${res.status})`
    throw new ApiError(message, res.status, body?.fieldErrors)
  }
  return body as T
}

export interface PageParams {
  page?: number
  size?: number
  sort?: string
}

export function createResource<T extends { id: number }>(path: string) {
  const url = `${BASE}/${path}`
  return {
    list(params: PageParams = {}): Promise<Page<T>> {
      const q = new URLSearchParams()
      if (params.page != null) q.set('page', String(params.page))
      if (params.size != null) q.set('size', String(params.size))
      if (params.sort) q.set('sort', params.sort)
      return fetch(`${url}?${q.toString()}`).then((r) => handle<Page<T>>(r))
    },
    get(id: number): Promise<T> {
      return fetch(`${url}/${id}`).then((r) => handle<T>(r))
    },
    create(data: Partial<T>): Promise<T> {
      return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => handle<T>(r))
    },
    update(id: number, data: Partial<T>): Promise<T> {
      return fetch(`${url}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => handle<T>(r))
    },
    remove(id: number): Promise<void> {
      return fetch(`${url}/${id}`, { method: 'DELETE' }).then((r) => handle<void>(r))
    },
    count(): Promise<number> {
      return fetch(`${url}/count`).then((r) => handle<number>(r))
    },
  }
}

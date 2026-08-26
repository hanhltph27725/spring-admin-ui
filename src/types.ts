export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
}

export interface BaseEntity {
  id: number
  createdAt?: string
  updatedAt?: string
  createdBy?: string
  updatedBy?: string
  version?: number
}

export interface User extends BaseEntity {
  username: string
  email: string
  password?: string
  firstName: string
  lastName: string
  active: boolean
  bio?: string
}

export interface Product extends BaseEntity {
  name: string
  sku: string
  description?: string
  price: number
  stockQuantity: number
  category?: string
  brand?: string
  active: boolean
  rating: number
}

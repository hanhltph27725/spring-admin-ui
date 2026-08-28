import { createResource } from './api'
import type { Product, ServiceSchema, User } from '../types'

export const usersApi = createResource<User>('users')
export const productsApi = createResource<Product>('products')
export const serviceSchemasApi = createResource<ServiceSchema>('service-schemas')
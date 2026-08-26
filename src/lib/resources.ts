import { createResource } from './api'
import type { Product, User } from '../types'

export const usersApi = createResource<User>('users')
export const productsApi = createResource<Product>('products')

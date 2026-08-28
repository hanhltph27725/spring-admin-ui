import { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader'
import Pagination from '../components/Pagination'
import Modal from '../components/Modal'
import Field from '../components/Field'
import ConfirmDialog from '../components/ConfirmDialog'
import StatusBadge from '../components/StatusBadge'
import EmptyState from '../components/EmptyState'
import { TableSkeleton } from '../components/Skeleton'
import { useToast } from '../components/Toast'
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconSearch,
  IconBox,
  IconArrowUpDown,
  IconChevronDown,
} from '../components/icons'
import { productsApi } from '../lib/resources'
import { ApiError } from '../lib/api'
import { cn } from '../lib/cn'
import type { Product } from '../types'

const PAGE_SIZE = 10

type SortKey = 'name' | 'price' | 'stockQuantity' | 'createdAt'

const emptyForm = {
  name: '',
  sku: '',
  description: '',
  price: '',
  stockQuantity: '',
  category: '',
  brand: '',
  rating: '0',
  active: true,
}

export default function Products() {
  const toast = useToast()
  const [rows, setRows] = useState<Product[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({
    key: 'createdAt',
    dir: 'desc',
  })
  const [search, setSearch] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(
    (signal?: { cancelled: boolean }) => {
      setLoading(true)
      return productsApi
        .list({ page, size: PAGE_SIZE, sort: `${sort.key},${sort.dir}` })
        .then((res) => {
          if (signal?.cancelled) return
          setRows(res.content)
          setTotalPages(res.totalPages)
          setTotalElements(res.totalElements)
        })
        .catch((e) => {
          if (!signal?.cancelled) toast('error', e.message)
        })
        .finally(() => {
          if (!signal?.cancelled) setLoading(false)
        })
    },
    [page, sort, toast],
  )

  useEffect(() => {
    const signal = { cancelled: false }
    load(signal)
    return () => {
      signal.cancelled = true
    }
  }, [load])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((p) =>
      [p.name, p.sku, p.category, p.brand].some((v) => v?.toLowerCase().includes(q)),
    )
  }, [rows, search])

  function toggleSort(key: SortKey) {
    setSort((s) =>
      s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' },
    )
    setPage(0)
  }

  function openCreate() {
    setEditing(null)
    setForm({ ...emptyForm })
    setErrors({})
    setModalOpen(true)
  }

  function openEdit(p: Product) {
    setEditing(p)
    setForm({
      name: p.name,
      sku: p.sku,
      description: p.description ?? '',
      price: String(p.price),
      stockQuantity: String(p.stockQuantity),
      category: p.category ?? '',
      brand: p.brand ?? '',
      rating: String(p.rating),
      active: p.active,
    })
    setErrors({})
    setModalOpen(true)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setErrors({})
    try {
      const payload: Partial<Product> = {
        name: form.name,
        sku: form.sku,
        description: form.description || undefined,
        price: Number(form.price),
        stockQuantity: Number(form.stockQuantity),
        category: form.category || undefined,
        brand: form.brand || undefined,
        rating: Number(form.rating),
        active: form.active,
      }
      if (editing) {
        await productsApi.update(editing.id, payload)
        toast('success', 'Product updated')
      } else {
        await productsApi.create(payload)
        toast('success', 'Product created')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) {
        setErrors(err.fieldErrors)
      } else {
        toast('error', (err as Error).message)
      }
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await productsApi.remove(deleteTarget.id)
      toast('success', 'Product deleted')
      setDeleteTarget(null)
      if (rows.length === 1 && page > 0) setPage(page - 1)
      else load()
    } catch (err) {
      toast('error', (err as Error).message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Manage your catalog"
        actions={
          <button className="btn-primary" onClick={openCreate}>
            <IconPlus className="h-4 w-4" /> New Product
          </button>
        }
      />

      <div className="card overflow-hidden">
        <div className="border-b border-border p-4">
          <div className="relative max-w-sm">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="input pl-9"
              placeholder="Search this page…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<IconBox className="h-6 w-6" />}
            title="No products found"
            message={
              search ? 'Try a different search term.' : 'Add your first product to get started.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Th sort={sort} col="name" onClick={() => toggleSort('name')}>
                    Product
                  </Th>
                  <th className="px-4 py-3">Category</th>
                  <Th sort={sort} col="price" onClick={() => toggleSort('price')}>
                    Price
                  </Th>
                  <Th sort={sort} col="stockQuantity" onClick={() => toggleSort('stockQuantity')}>
                    Stock
                  </Th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visible.map((p) => (
                  <tr key={p.id} className="group transition-colors hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.sku}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.category || <span className="text-muted-foreground/50">—</span>}
                    </td>
                    <td className="px-4 py-3 font-medium">${Number(p.price).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`badge ${
                          p.stockQuantity === 0
                            ? 'border-destructive/20 bg-destructive/10 text-destructive'
                            : p.stockQuantity < 10
                              ? 'border-warning/20 bg-warning/10 text-warning'
                              : 'border-border bg-muted text-muted-foreground'
                        }`}
                      >
                        {p.stockQuantity} in stock
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge active={p.active} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          className="btn-ghost h-8 w-8 rounded-md p-0"
                          onClick={() => openEdit(p)}
                          title="Edit"
                        >
                          <IconEdit className="h-4 w-4" />
                        </button>
                        <button
                          className="btn-ghost h-8 w-8 rounded-md p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setDeleteTarget(p)}
                          title="Delete"
                        >
                          <IconTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && totalElements > 0 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            totalElements={totalElements}
            size={PAGE_SIZE}
            onPageChange={setPage}
          />
        )}
      </div>

      <Modal
        open={modalOpen}
        title={editing ? 'Edit Product' : 'New Product'}
        onClose={() => setModalOpen(false)}
        size="lg"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button className="btn-primary" form="product-form" type="submit" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Product'}
            </button>
          </>
        }
      >
        <form id="product-form" onSubmit={submit} className="space-y-4">
          <Field label="Name" required error={errors.name}>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="SKU" required error={errors.sku}>
              <input
                className="input"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
              />
            </Field>
            <Field label="Category" error={errors.category}>
              <input
                className="input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Price" required error={errors.price}>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </Field>
            <Field label="Stock" required error={errors.stockQuantity}>
              <input
                type="number"
                min="0"
                className="input"
                value={form.stockQuantity}
                onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
              />
            </Field>
            <Field label="Rating" error={errors.rating}>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                className="input"
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Brand" error={errors.brand}>
            <input
              className="input"
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
            />
          </Field>
          <Field label="Description" error={errors.description}>
            <textarea
              className="input min-h-[90px] resize-y"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            Active
          </label>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

function Th({
  children,
  onClick,
  sort,
  col,
}: {
  children: React.ReactNode
  onClick: () => void
  sort: { key: SortKey; dir: 'asc' | 'desc' }
  col: SortKey
}) {
  const active = sort.key === col
  return (
    <th className="px-4 py-3">
      <button
        className={cn(
          'group inline-flex items-center gap-1 transition-colors hover:text-foreground',
          active && 'text-foreground',
        )}
        onClick={onClick}
      >
        {children}
        {active ? (
          <IconChevronDown
            className={cn('h-3.5 w-3.5 transition-transform', sort.dir === 'asc' && 'rotate-180')}
          />
        ) : (
          <IconArrowUpDown className="h-3.5 w-3.5 opacity-40 transition-opacity group-hover:opacity-70" />
        )}
      </button>
    </th>
  )
}

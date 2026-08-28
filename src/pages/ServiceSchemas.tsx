import { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader'
import Pagination from '../components/Pagination'
import Modal from '../components/Modal'
import Field from '../components/Field'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import { TableSkeleton } from '../components/Skeleton'
import { useToast } from '../components/Toast'
import {
  IconPlus,
  IconTrash,
  IconSearch,
  IconBox,
  IconRefresh,
  IconDownload,
  IconArrowUpDown,
  IconChevronDown,
} from '../components/icons'
import { serviceSchemasApi } from '../lib/resources'
import { ApiError, downloadZip, syncServiceSchemas } from '../lib/api'
import { cn } from '../lib/cn'
import type { ServiceSchema } from '../types'

const PAGE_SIZE = 10

type SortKey = 'code' | 'entityName' | 'serviceId' | 'createdAt'

const emptyForm = {
  code: '',
  entityName: '',
  serviceId: '',
}

export default function ServiceSchemas() {
  const toast = useToast()
  const [rows, setRows] = useState<ServiceSchema[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({
    key: 'createdAt',
    dir: 'desc',
  })
  const [search, setSearch] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<ServiceSchema | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(
    (signal?: { cancelled: boolean }) => {
      setLoading(true)
      return serviceSchemasApi
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
    return rows.filter((s) =>
      [s.code, s.entityName, s.serviceId].some((v) => v?.toLowerCase().includes(q)),
    )
  }, [rows, search])

  function toggleSort(key: SortKey) {
    setSort((s) =>
      s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' },
    )
    setPage(0)
  }

  async function sync() {
    setSyncing(true)
    try {
      const result = await syncServiceSchemas()
      toast('success', `Synced ${result.length} schemas`)
      if (page !== 0) setPage(0)
      else load()
    } catch (err) {
      toast('error', (err as Error).message)
    } finally {
      setSyncing(false)
    }
  }

  async function download(kind: 'backend' | 'frontend', s: ServiceSchema) {
    setDownloading(`${kind}:${s.id}`)
    try {
      await downloadZip(kind, s.entityName)
    } catch (err) {
      toast('error', (err as Error).message)
    } finally {
      setDownloading(null)
    }
  }

  function openCreate() {
    setForm({ ...emptyForm })
    setErrors({})
    setModalOpen(true)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setErrors({})
    try {
      await serviceSchemasApi.create({
        code: form.code,
        entityName: form.entityName,
        serviceId: form.serviceId,
      })
      toast('success', 'Schema created')
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
      await serviceSchemasApi.remove(deleteTarget.id)
      toast('success', 'Schema deleted')
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
        title="Service Schemas"
        subtitle="Sync entities and download generated code"
        actions={
          <>
            <button className="btn-secondary" onClick={sync} disabled={syncing}>
              <IconRefresh className={cn('h-4 w-4', syncing && 'animate-spin')} />
              {syncing ? 'Syncing…' : 'Sync'}
            </button>
            <button className="btn-primary" onClick={openCreate}>
              <IconPlus className="h-4 w-4" /> New Schema
            </button>
          </>
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
          <TableSkeleton rows={8} cols={5} />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<IconBox className="h-6 w-6" />}
            title="No service schemas found"
            message={search ? 'Try a different search term.' : 'Click Sync to scan entities.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Th sort={sort} col="code" onClick={() => toggleSort('code')}>
                    Code
                  </Th>
                  <Th sort={sort} col="entityName" onClick={() => toggleSort('entityName')}>
                    Entity Name
                  </Th>
                  <Th sort={sort} col="serviceId" onClick={() => toggleSort('serviceId')}>
                    Service ID
                  </Th>
                  <Th sort={sort} col="createdAt" onClick={() => toggleSort('createdAt')}>
                    Created
                  </Th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visible.map((s) => (
                  <tr key={s.id} className="group transition-colors hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium">{s.code}</td>
                    <td className="px-4 py-3">{s.entityName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.serviceId}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {s.createdAt ? (
                        new Date(s.createdAt).toLocaleDateString()
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          className="btn-ghost h-8 rounded-md px-2"
                          onClick={() => download('backend', s)}
                          disabled={downloading === `backend:${s.id}`}
                          title="Download Backend"
                        >
                          <IconDownload className="h-4 w-4" /> BE
                        </button>
                        <button
                          className="btn-ghost h-8 rounded-md px-2"
                          onClick={() => download('frontend', s)}
                          disabled={downloading === `frontend:${s.id}`}
                          title="Download Frontend"
                        >
                          <IconDownload className="h-4 w-4" /> FE
                        </button>
                        <button
                          className="btn-ghost h-8 w-8 rounded-md p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setDeleteTarget(s)}
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
        title="New Schema"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button className="btn-primary" form="schema-form" type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Create Schema'}
            </button>
          </>
        }
      >
        <form id="schema-form" onSubmit={submit} className="space-y-4">
          <Field label="Code" required error={errors.code}>
            <input
              className="input"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
          </Field>
          <Field label="Entity Name" required error={errors.entityName}>
            <input
              className="input"
              value={form.entityName}
              onChange={(e) => setForm({ ...form, entityName: e.target.value })}
            />
          </Field>
          <Field label="Service ID" required error={errors.serviceId}>
            <input
              className="input"
              value={form.serviceId}
              onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
            />
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Schema"
        message={`Are you sure you want to delete "${deleteTarget?.code}"? This action cannot be undone.`}
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
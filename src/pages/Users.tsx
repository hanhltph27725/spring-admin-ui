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
  IconUsers,
  IconArrowUpDown,
  IconChevronDown,
} from '../components/icons'
import { usersApi } from '../lib/resources'
import { ApiError } from '../lib/api'
import { cn } from '../lib/cn'
import type { User } from '../types'

const PAGE_SIZE = 10

type SortKey = 'username' | 'email' | 'createdAt'

const emptyForm = {
  username: '',
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  bio: '',
  active: true,
}

export default function Users() {
  const toast = useToast()
  const [rows, setRows] = useState<User[]>([])
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
  const [editing, setEditing] = useState<User | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(
    (signal?: { cancelled: boolean }) => {
      setLoading(true)
      return usersApi
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
    return rows.filter((u) =>
      [u.username, u.email, u.firstName, u.lastName].some((v) => v?.toLowerCase().includes(q)),
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

  function openEdit(u: User) {
    setEditing(u)
    setForm({
      username: u.username,
      email: u.email,
      password: '',
      firstName: u.firstName,
      lastName: u.lastName,
      bio: u.bio ?? '',
      active: u.active,
    })
    setErrors({})
    setModalOpen(true)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setErrors({})
    try {
      const payload: Partial<User> = {
        username: form.username,
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        bio: form.bio || undefined,
        active: form.active,
      }
      if (form.password) payload.password = form.password

      if (editing) {
        await usersApi.update(editing.id, payload)
        toast('success', 'User updated')
      } else {
        await usersApi.create(payload)
        toast('success', 'User created')
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
      await usersApi.remove(deleteTarget.id)
      toast('success', 'User deleted')
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
        title="Users"
        subtitle="Manage user accounts"
        actions={
          <button className="btn-primary" onClick={openCreate}>
            <IconPlus className="h-4 w-4" /> New User
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
          <TableSkeleton rows={8} cols={4} />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<IconUsers className="h-6 w-6" />}
            title="No users found"
            message={
              search ? 'Try a different search term.' : 'Create your first user to get started.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Th sort={sort} col="username" onClick={() => toggleSort('username')}>
                    User
                  </Th>
                  <Th sort={sort} col="email" onClick={() => toggleSort('email')}>
                    Email
                  </Th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visible.map((u) => (
                  <tr key={u.id} className="group transition-colors hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {u.firstName?.[0]}
                          {u.lastName?.[0]}
                        </div>
                        <div>
                          <div className="font-medium">
                            {u.firstName} {u.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground">@{u.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3">
                      <StatusBadge active={u.active} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                        <button
                          className="btn-ghost h-8 w-8 rounded-md p-0"
                          onClick={() => openEdit(u)}
                          title="Edit"
                        >
                          <IconEdit className="h-4 w-4" />
                        </button>
                        <button
                          className="btn-ghost h-8 w-8 rounded-md p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setDeleteTarget(u)}
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
        title={editing ? 'Edit User' : 'New User'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button className="btn-primary" form="user-form" type="submit" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create User'}
            </button>
          </>
        }
      >
        <form id="user-form" onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="First Name" required error={errors.firstName}>
              <input
                className="input"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              />
            </Field>
            <Field label="Last Name" required error={errors.lastName}>
              <input
                className="input"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Username" required error={errors.username}>
            <input
              className="input"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </Field>
          <Field label="Email" required error={errors.email}>
            <input
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          <Field
            label={editing ? 'Password (leave blank to keep)' : 'Password'}
            required={!editing}
            error={errors.password}
          >
            <input
              type="password"
              className="input"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </Field>
          <Field label="Bio" error={errors.bio}>
            <textarea
              className="input min-h-[80px] resize-y"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
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
        title="Delete User"
        message={`Are you sure you want to delete ${deleteTarget?.firstName} ${deleteTarget?.lastName}? This action cannot be undone.`}
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

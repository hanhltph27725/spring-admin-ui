import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import AreaChart, { Sparkline } from '../components/AreaChart'
import { Skeleton } from '../components/Skeleton'
import { cn } from '../lib/cn'
import { IconUsers, IconBox, IconTrendingUp, IconTrendingDown, IconStar } from '../components/icons'
import { usersApi, productsApi } from '../lib/resources'
import type { Product, User } from '../types'

// Deterministic pseudo-trend so the chart looks alive without extra backend endpoints.
function trend(seed: number, points = 24) {
  const out: number[] = []
  let v = 40 + (seed % 20)
  for (let i = 0; i < points; i++) {
    v += Math.sin(i * 0.6 + seed) * 6 + ((i * seed) % 5) - 1.5
    out.push(Math.max(4, Math.round(v)))
  }
  return out
}

export default function Dashboard() {
  const [userCount, setUserCount] = useState<number | null>(null)
  const [productCount, setProductCount] = useState<number | null>(null)
  const [recentUsers, setRecentUsers] = useState<User[]>([])
  const [recentProducts, setRecentProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.allSettled([
      usersApi.count().then((n) => !cancelled && setUserCount(n)),
      productsApi.count().then((n) => !cancelled && setProductCount(n)),
      usersApi
        .list({ page: 0, size: 5, sort: 'createdAt,desc' })
        .then((p) => !cancelled && setRecentUsers(p.content)),
      productsApi
        .list({ page: 0, size: 5, sort: 'createdAt,desc' })
        .then((p) => !cancelled && setRecentProducts(p.content)),
    ]).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const userTrend = useMemo(() => trend(7), [])
  const productTrend = useMemo(() => trend(13), [])
  const revenueTrend = useMemo(() => trend(21), [])

  const inventoryValue = useMemo(
    () => recentProducts.reduce((s, p) => s + Number(p.price) * p.stockQuantity, 0),
    [recentProducts],
  )
  const avgRating = useMemo(() => {
    if (recentProducts.length === 0) return 0
    return recentProducts.reduce((s, p) => s + Number(p.rating), 0) / recentProducts.length
  }, [recentProducts])

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Welcome back — here's what's happening." />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          to="/users"
          label="Total Users"
          value={userCount}
          loading={loading}
          delta={12.5}
          icon={<IconUsers className="h-5 w-5" />}
          spark={userTrend}
          sparkClass="text-primary"
        />
        <StatCard
          to="/products"
          label="Total Products"
          value={productCount}
          loading={loading}
          delta={4.2}
          icon={<IconBox className="h-5 w-5" />}
          spark={productTrend}
          sparkClass="text-success"
        />
        <StatCard
          label="Recent Inventory"
          value={loading ? null : inventoryValue}
          loading={loading}
          format={(n) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          delta={-2.1}
          icon={<IconTrendingUp className="h-5 w-5" />}
          spark={revenueTrend}
          sparkClass="text-warning"
        />
        <StatCard
          label="Recent Avg. Rating"
          value={loading ? null : avgRating}
          loading={loading}
          format={(n) => n.toFixed(1)}
          delta={0.8}
          icon={<IconStar className="h-5 w-5" />}
          spark={trend(3)}
          sparkClass="text-primary"
        />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Activity</h3>
              <p className="text-xs text-muted-foreground">Last 24 data points</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <Legend className="bg-primary" label="Users" />
              <Legend className="bg-success" label="Products" />
            </div>
          </div>
          <AreaChart data={userTrend} height={200} />
        </div>

        <div className="card p-5">
          <h3 className="mb-4 text-sm font-semibold">Quick Stats</h3>
          <div className="space-y-4">
            <MiniStat label="Active users" value={userCount} loading={loading} spark={trend(5)} />
            <MiniStat label="In stock" value={productCount} loading={loading} spark={trend(9)} />
            <MiniStat
              label="Low stock items"
              value={loading ? null : recentProducts.filter((p) => p.stockQuantity < 10).length}
              loading={loading}
              spark={trend(2)}
              tint="text-warning"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentCard title="Recent Users" viewAll="/users">
          {loading ? (
            <SkeletonRows />
          ) : recentUsers.length === 0 ? (
            <EmptyRow text="No users yet" />
          ) : (
            recentUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {u.firstName?.[0]}
                    {u.lastName?.[0]}
                  </div>
                  <div>
                    <div className="text-sm font-medium">
                      {u.firstName} {u.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">@{u.username}</span>
              </div>
            ))
          )}
        </RecentCard>

        <RecentCard title="Recent Products" viewAll="/products">
          {loading ? (
            <SkeletonRows />
          ) : recentProducts.length === 0 ? (
            <EmptyRow text="No products yet" />
          ) : (
            recentProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <div className="text-sm font-medium">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.sku}</div>
                </div>
                <span className="text-sm font-semibold">${Number(p.price).toFixed(2)}</span>
              </div>
            ))
          )}
        </RecentCard>
      </div>
    </div>
  )
}

function StatCard({
  to,
  label,
  value,
  loading,
  delta,
  icon,
  spark,
  sparkClass,
  format = (n) => n.toLocaleString(),
}: {
  to?: string
  label: string
  value: number | null
  loading?: boolean
  delta?: number
  icon: ReactNode
  spark: number[]
  sparkClass?: string
  format?: (n: number) => string
}) {
  const up = (delta ?? 0) >= 0
  const inner = (
    <>
      <div className="flex items-center justify-between">
        <div
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg bg-muted',
            sparkClass ?? 'text-muted-foreground',
          )}
        >
          {icon}
        </div>
        {delta != null && (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
              up ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive',
            )}
          >
            {up ? (
              <IconTrendingUp className="h-3.5 w-3.5" />
            ) : (
              <IconTrendingDown className="h-3.5 w-3.5" />
            )}
            {Math.abs(delta)}%
          </span>
        )}
      </div>
      <div className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-[26px] font-semibold leading-none tracking-tight">
        {loading || value === null ? <Skeleton className="mt-1 h-7 w-24" /> : format(value)}
      </div>
      <div className="mt-4 h-8">
        <Sparkline data={spark} className={sparkClass} />
      </div>
    </>
  )

  return to ? (
    <Link to={to} className="stat-card">
      {inner}
    </Link>
  ) : (
    <div className="stat-card">{inner}</div>
  )
}

function MiniStat({
  label,
  value,
  loading,
  spark,
  tint = 'text-primary',
}: {
  label: string
  value: number | null
  loading?: boolean
  spark: number[]
  tint?: string
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-lg font-semibold">
          {loading || value === null ? <Skeleton className="h-5 w-12" /> : value.toLocaleString()}
        </div>
      </div>
      <div className="w-24">
        <Sparkline data={spark} className={tint} />
      </div>
    </div>
  )
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-muted-foreground">
      <span className={cn('h-2 w-2 rounded-full', className)} />
      {label}
    </span>
  )
}

function RecentCard({
  title,
  viewAll,
  children,
}: {
  title: string
  viewAll: string
  children: ReactNode
}) {
  return (
    <div className="card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Link to={viewAll} className="text-xs font-medium text-primary hover:underline">
          View all
        </Link>
      </div>
      <div className="divide-y divide-border">{children}</div>
    </div>
  )
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-5 py-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      ))}
    </>
  )
}

function EmptyRow({ text }: { text: string }) {
  return <div className="px-5 py-8 text-center text-sm text-muted-foreground">{text}</div>
}

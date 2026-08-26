import { NavLink } from 'react-router-dom'
import { IconDashboard, IconUsers, IconBox } from './icons'
import { cn } from '../lib/cn'

const nav = [
  { to: '/', label: 'Dashboard', icon: IconDashboard, end: true },
  { to: '/users', label: 'Users', icon: IconUsers },
  { to: '/products', label: 'Products', icon: IconBox },
]

export default function Sidebar({ collapsed }: { collapsed: boolean }) {
  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col border-r border-border bg-card transition-[width] duration-200',
        collapsed ? 'w-[68px]' : 'w-64',
      )}
    >
      <div
        className={cn('flex h-16 items-center gap-2.5 px-4', collapsed && 'justify-center px-0')}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-sm ring-1 ring-inset ring-white/10">
          <span className="text-lg font-bold">S</span>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="truncate text-sm font-semibold leading-tight">Spring Admin</div>
            <div className="truncate text-xs text-muted-foreground">Console</div>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {!collapsed && (
          <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Menu
          </div>
        )}
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
                collapsed && 'justify-center px-0',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && !collapsed && (
                  <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
                )}
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
            AD
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">Admin</div>
              <div className="truncate text-xs text-muted-foreground">admin@local</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

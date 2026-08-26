import { useLocation } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'
import DropdownMenu from './DropdownMenu'
import { IconPanelLeft, IconSearch, IconBell, IconSettings, IconLogout, IconUsers } from './icons'

const titles: Record<string, string> = {
  '': 'Dashboard',
  users: 'Users',
  products: 'Products',
}

export default function Topbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { pathname } = useLocation()
  const segment = pathname.split('/').filter(Boolean)[0] ?? ''
  const current = titles[segment] ?? 'Dashboard'

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md">
      <button
        onClick={onToggleSidebar}
        className="btn h-9 w-9 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        title="Toggle sidebar"
      >
        <IconPanelLeft className="h-5 w-5" />
      </button>

      <nav className="hidden items-center gap-1.5 text-sm sm:flex" aria-label="Breadcrumb">
        <span className="text-muted-foreground">Admin</span>
        <span className="text-muted-foreground/50">/</span>
        <span className="font-medium text-foreground">{current}</span>
      </nav>

      <div className="relative mx-auto hidden w-full max-w-md md:block">
        <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input className="input h-9 pl-9 pr-16" placeholder="Search…" aria-label="Global search" />
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 select-none rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground lg:inline-block">
          ⌘K
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <button
          className="btn relative h-9 w-9 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          title="Notifications"
        >
          <IconBell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
        </button>

        <ThemeToggle />

        <DropdownMenu
          trigger={
            <button className="ml-1 flex h-9 items-center gap-2 rounded-md pl-1 pr-2 hover:bg-accent">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                AD
              </span>
              <span className="hidden text-sm font-medium sm:inline">Admin</span>
            </button>
          }
        >
          {(close) => (
            <>
              <div className="px-2.5 py-2">
                <div className="text-sm font-medium">Admin</div>
                <div className="text-xs text-muted-foreground">admin@local</div>
              </div>
              <div className="my-1 h-px bg-border" />
              <button className="menu-item" onClick={close}>
                <IconUsers className="h-4 w-4" /> Profile
              </button>
              <button className="menu-item" onClick={close}>
                <IconSettings className="h-4 w-4" /> Settings
              </button>
              <div className="my-1 h-px bg-border" />
              <button
                className="menu-item text-destructive hover:bg-destructive/10"
                onClick={close}
              >
                <IconLogout className="h-4 w-4" /> Log out
              </button>
            </>
          )}
        </DropdownMenu>
      </div>
    </header>
  )
}

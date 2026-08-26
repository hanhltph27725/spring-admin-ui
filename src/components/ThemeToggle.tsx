import DropdownMenu from './DropdownMenu'
import { useTheme } from '../lib/theme'
import { IconSun, IconMoon, IconMonitor, IconCheck } from './icons'
import { cn } from '../lib/cn'

const options = [
  { value: 'light', label: 'Light', icon: IconSun },
  { value: 'dark', label: 'Dark', icon: IconMoon },
  { value: 'system', label: 'System', icon: IconMonitor },
] as const

export default function ThemeToggle() {
  const { theme, resolved, setTheme } = useTheme()

  return (
    <DropdownMenu
      trigger={
        <button
          className="btn h-9 w-9 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          title="Theme"
        >
          {resolved === 'dark' ? <IconMoon className="h-5 w-5" /> : <IconSun className="h-5 w-5" />}
        </button>
      }
    >
      {(close) => (
        <>
          {options.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              className="menu-item justify-between"
              onClick={() => {
                setTheme(value)
                close()
              }}
            >
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {label}
              </span>
              {theme === value && <IconCheck className={cn('h-4 w-4 text-primary')} />}
            </button>
          ))}
        </>
      )}
    </DropdownMenu>
  )
}

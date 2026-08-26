import { cn } from '../lib/cn'

export default function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        'badge',
        active
          ? 'border-success/20 bg-success/10 text-success'
          : 'border-border bg-muted text-muted-foreground',
      )}
    >
      <span
        className={cn(
          'mr-1.5 h-1.5 w-1.5 rounded-full',
          active ? 'bg-success' : 'bg-muted-foreground',
        )}
      />
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

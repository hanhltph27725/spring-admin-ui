import { IconChevronLeft, IconChevronRight } from './icons'

interface PaginationProps {
  page: number
  totalPages: number
  totalElements: number
  size: number
  onPageChange: (page: number) => void
}

export default function Pagination({
  page,
  totalPages,
  totalElements,
  size,
  onPageChange,
}: PaginationProps) {
  const from = totalElements === 0 ? 0 : page * size + 1
  const to = Math.min((page + 1) * size, totalElements)

  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
      <p className="text-muted-foreground">
        Showing <span className="font-medium text-foreground">{from}</span>–
        <span className="font-medium text-foreground">{to}</span> of{' '}
        <span className="font-medium text-foreground">{totalElements}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          className="btn-secondary btn-sm px-2"
          disabled={page <= 0}
          onClick={() => onPageChange(page - 1)}
        >
          <IconChevronLeft className="h-4 w-4" />
        </button>
        <span className="px-3 text-muted-foreground">
          Page {totalPages === 0 ? 0 : page + 1} of {totalPages}
        </span>
        <button
          className="btn-secondary btn-sm px-2"
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
        >
          <IconChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

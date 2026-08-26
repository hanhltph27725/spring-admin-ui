import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { IconCheck, IconAlert, IconX } from './icons'
import { cn } from '../lib/cn'

type ToastKind = 'success' | 'error'
interface Toast {
  id: number
  kind: ToastKind
  message: string
}

const ToastContext = createContext<(kind: ToastKind, message: string) => void>(() => {})

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = Date.now() + Math.random()
      setToasts((t) => [...t, { id, kind, message }])
      setTimeout(() => dismiss(id), 3800)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed bottom-6 right-6 z-[60] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex animate-slide-up items-start gap-3 rounded-lg border border-border bg-card p-3.5 shadow-lg"
          >
            <span
              className={cn(
                'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white',
                t.kind === 'success' ? 'bg-success' : 'bg-destructive',
              )}
            >
              {t.kind === 'success' ? (
                <IconCheck className="h-3.5 w-3.5" />
              ) : (
                <IconAlert className="h-3.5 w-3.5" />
              )}
            </span>
            <p className="flex-1 text-sm text-foreground">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <IconX className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

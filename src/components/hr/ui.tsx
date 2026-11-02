// Shared building blocks for the HR workspace. Teal #007078 is the action
// colour, purple #582C5F the accent; everything else stays neutral.
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import toast from "react-hot-toast"
import { AlertTriangle, ChevronLeft, ChevronRight, Inbox, Loader2, X } from "lucide-react"
import { HrApiError } from "../../services/hr/client"

export const TEAL = "#007078"
export const PURPLE = "#582C5F"

// ── data ────────────────────────────────────────────────────────────────────

export function useHr<T>(load: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<HrApiError | null>(null)
  const [loading, setLoading] = useState(true)
  const seq = useRef(0)

  const reload = useCallback(async () => {
    const id = ++seq.current
    setLoading(true)
    try {
      const result = await load()
      if (id === seq.current) {
        setData(result)
        setError(null)
      }
    } catch (e) {
      if (id === seq.current) setError(e instanceof HrApiError ? e : new HrApiError(0, String(e)))
    } finally {
      if (id === seq.current) setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    reload()
  }, [reload])

  return { data, error, loading, reload, setData }
}

export const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e))

/** [busyKey, run]: run(key, fn, success?) shows a toast either way and
 *  returns the result, or undefined when it failed. */
export function useRun() {
  const [busy, setBusy] = useState<string | null>(null)
  const run = useCallback(async <T,>(key: string, fn: () => Promise<T>, success?: string | ((r: T) => string)) => {
    setBusy(key)
    try {
      const result = await fn()
      if (success) toast.success(typeof success === "function" ? success(result) : success)
      return result
    } catch (e) {
      toast.error(errorText(e))
      return undefined
    } finally {
      setBusy(null)
    }
  }, [])
  return [busy, run] as const
}

export const money = (v?: string | number | null) =>
  v === null || v === undefined || v === "" ? "—" : `₹${Number(v).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`

export const minutes = (m?: number | null) => (!m ? "0m" : `${Math.floor(m / 60)}h ${m % 60}m`)

// ── formatting ──────────────────────────────────────────────────────────────

export function fmtDate(v?: string | null) {
  if (!v) return "—"
  const d = new Date(v.length === 10 ? `${v}T00:00:00` : v)
  return isNaN(d.getTime()) ? v : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
}

export function fmtDateTime(v?: string | null) {
  if (!v) return "—"
  const d = new Date(v)
  return isNaN(d.getTime())
    ? v
    : d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
}

export function fmtTime(v?: string | null) {
  if (!v) return "—"
  const d = new Date(v)
  return isNaN(d.getTime()) ? v : d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
}

export function ago(v?: string | null) {
  if (!v) return "never"
  const s = Math.round((Date.now() - new Date(v).getTime()) / 1000)
  if (s < 60) return "just now"
  if (s < 3600) return `${Math.floor(s / 60)} min ago`
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`
  return `${Math.floor(s / 86400)} d ago`
}

export const humanize = (s?: string | null) => (s ? s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()) : "—")

// ── layout ──────────────────────────────────────────────────────────────────

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Panel({ title, actions, children, className = "" }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`bg-white border border-slate-200 rounded-[8px] ${className}`}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          {actions}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  )
}

export function Kpi({ label, value, hint, tone = "neutral", onClick }: {
  label: string
  value: ReactNode
  hint?: string
  tone?: "neutral" | "good" | "warn" | "bad" | "accent"
  onClick?: () => void
}) {
  const bar = { neutral: "bg-slate-300", good: "bg-[#007078]", warn: "bg-amber-500", bad: "bg-rose-600", accent: "bg-[#582C5F]" }[tone]
  const Tag = onClick ? "button" : "div"
  return (
    <Tag
      onClick={onClick}
      className={`relative text-left bg-white border border-slate-200 rounded-[8px] px-4 py-3 overflow-hidden ${onClick ? "hover:border-slate-300 cursor-pointer" : ""}`}
    >
      <span className={`absolute left-0 top-0 bottom-0 w-1 ${bar}`} />
      <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-semibold text-slate-900 mt-1 tabular-nums">{value}</div>
      {hint && <div className="text-[11px] text-slate-500 mt-0.5">{hint}</div>}
    </Tag>
  )
}

const BADGE: Record<string, string> = {
  active: "bg-teal-50 text-[#007078] border-teal-200",
  online: "bg-teal-50 text-[#007078] border-teal-200",
  success: "bg-teal-50 text-[#007078] border-teal-200",
  verified: "bg-teal-50 text-[#007078] border-teal-200",
  in: "bg-teal-50 text-[#007078] border-teal-200",
  draft: "bg-slate-50 text-slate-600 border-slate-200",
  unknown: "bg-slate-50 text-slate-600 border-slate-200",
  out: "bg-slate-50 text-slate-700 border-slate-200",
  pending: "bg-amber-50 text-amber-800 border-amber-200",
  partial: "bg-amber-50 text-amber-800 border-amber-200",
  suspended: "bg-amber-50 text-amber-800 border-amber-200",
  not_arrived: "bg-amber-50 text-amber-800 border-amber-200",
  offline: "bg-rose-50 text-rose-700 border-rose-200",
  failed: "bg-rose-50 text-rose-700 border-rose-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
  terminated: "bg-rose-50 text-rose-700 border-rose-200",
  archived: "bg-slate-100 text-slate-500 border-slate-200",
  simulator: "bg-purple-50 text-[#582C5F] border-purple-200",
}

const BADGE_LABEL: Record<string, string> = { in: "Checked in", out: "Checked out", not_arrived: "Not arrived" }

export function StatusBadge({ value, label }: { value: string; label?: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-[6px] border text-[11px] font-medium whitespace-nowrap ${BADGE[value] ?? BADGE.draft}`}>
      {label ?? BADGE_LABEL[value] ?? humanize(value)}
    </span>
  )
}

// ── states ──────────────────────────────────────────────────────────────────

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500" role="status">
      <Loader2 className="w-4 h-4 animate-spin" /> {label}
    </div>
  )
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center" role="alert">
      <AlertTriangle className="w-5 h-5 text-rose-600" />
      <p className="text-sm text-slate-700">{errorText(error)}</p>
      {onRetry && (
        <button onClick={onRetry} className="text-xs font-medium text-[#007078] hover:underline">
          Try again
        </button>
      )}
    </div>
  )
}

export function Empty({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <Inbox className="w-5 h-5 text-slate-400" />
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {hint && <p className="text-xs text-slate-500 max-w-md">{hint}</p>}
      {action}
    </div>
  )
}

// ── controls ────────────────────────────────────────────────────────────────

export function Btn({ children, variant = "secondary", busy, className = "", ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost"
  busy?: boolean
}) {
  const styles = {
    primary: "bg-[#007078] text-white hover:bg-[#005c63] border-transparent",
    secondary: "bg-white text-slate-700 border-slate-300 hover:bg-slate-50",
    danger: "bg-white text-rose-700 border-rose-300 hover:bg-rose-50",
    ghost: "bg-transparent text-slate-600 border-transparent hover:bg-slate-100",
  }[variant]
  return (
    <button
      {...rest}
      disabled={rest.disabled || busy}
      className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[6px] border transition disabled:opacity-50 disabled:cursor-not-allowed ${styles} ${className}`}
    >
      {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {children}
    </button>
  )
}

export function Field({ label, error, hint, required, children }: { label: string; error?: string; hint?: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-700 mb-1">
        {label}
        {required && <span className="text-rose-600"> *</span>}
      </span>
      {children}
      {error ? <span className="block text-[11px] text-rose-600 mt-1">{error}</span> : hint ? <span className="block text-[11px] text-slate-500 mt-1">{hint}</span> : null}
    </label>
  )
}

const fieldBase =
  "px-2.5 py-1.5 text-sm bg-white border border-slate-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#007078]/30 focus:border-[#007078] disabled:bg-slate-50"
export const inputCls = `w-full ${fieldBase}`
/** Inline filter controls: size to content so a row of them stays one row. */
export const filterCls = `w-auto max-w-[220px] ${fieldBase}`

export function Drawer({ open, title, onClose, children, footer, wide }: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-slate-900/30" onClick={onClose} />
      <div className={`relative h-full w-full ${wide ? "max-w-3xl" : "max-w-lg"} bg-white shadow-xl flex flex-col`}>
        <header className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="p-1 rounded hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <footer className="px-5 py-3 border-t border-slate-200 flex justify-end gap-2">{footer}</footer>}
      </div>
    </div>
  )
}

export function Pager({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  return (
    <div className="flex items-center justify-between text-xs text-slate-500 pt-3">
      <span>
        {total === 0 ? "No records" : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}`}
      </span>
      <div className="flex items-center gap-1">
        <Btn variant="ghost" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
          <ChevronLeft className="w-3.5 h-3.5" />
        </Btn>
        <span className="px-1">
          {page} / {pages}
        </span>
        <Btn variant="ghost" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page">
          <ChevronRight className="w-3.5 h-3.5" />
        </Btn>
      </div>
    </div>
  )
}

export function Table({ head, children }: { head: ReactNode[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto -mx-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
            {head.map((h, i) => (
              <th key={i} className="px-4 py-2 font-medium whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  )
}

export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { id: T; label: string; count?: number }[] }) {
  return (
    <div className="flex gap-1 border-b border-slate-200 mb-4 overflow-x-auto" role="tablist">
      {items.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={`px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 -mb-px ${
            value === t.id ? "border-[#007078] text-[#007078]" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          {t.label}
          {t.count !== undefined && <span className="ml-1.5 text-slate-400">{t.count}</span>}
        </button>
      ))}
    </div>
  )
}

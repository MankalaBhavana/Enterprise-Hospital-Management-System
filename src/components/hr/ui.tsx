// Shared building blocks for the HR workspace following the enterprise hospital design system.
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import toast from "react-hot-toast"
import { AlertTriangle, ChevronLeft, ChevronRight, Inbox, Loader2, X } from "lucide-react"
import { HrApiError } from "../../services/hr/client"

export const TEAL = "#1B4FD8" // Standard Hospital Blue
export const PURPLE = "#4F46E5"

// ── data ────────────────────────────────────────────────────────────────────

export function useHr<T>(load: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<HrApiError | null>(null)
  const [loading, setLoading] = useState(true)
  const seq = useRef(0)

  const reload = useCallback(async () => {
    const id = ++seq.current
    if (!data) setLoading(true)
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
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div>
        <h2 className="text-base md:text-lg font-bold text-slate-900 tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 font-medium mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Panel({ title, actions, children, className = "" }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`bg-white border border-slate-200 rounded-xl shadow-2xs ${className}`}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-2 px-5 py-3 border-b border-slate-100">
          <h3 className="text-xs md:text-sm font-bold text-slate-900 tracking-tight">{title}</h3>
          {actions}
        </header>
      )}
      <div className="p-4 md:p-5">{children}</div>
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
  const bar = { neutral: "bg-slate-300", good: "bg-emerald-500", warn: "bg-amber-500", bad: "bg-rose-500", accent: "bg-blue-600" }[tone]
  const Tag = onClick ? "button" : "div"
  return (
    <Tag
      onClick={onClick}
      className={`relative text-left bg-white border border-slate-200 rounded-xl p-4 shadow-2xs overflow-hidden transition-all ${onClick ? "hover:border-blue-300 hover:shadow-xs cursor-pointer" : ""}`}
    >
      <span className={`absolute left-0 top-0 bottom-0 w-1 ${bar}`} />
      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</div>
      <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{value}</div>
      {hint && <div className="text-xs text-slate-500 mt-0.5">{hint}</div>}
    </Tag>
  )
}

const BADGE: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  online: "bg-emerald-50 text-emerald-700 border-emerald-200",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  verified: "bg-emerald-50 text-emerald-700 border-emerald-200",
  in: "bg-emerald-50 text-emerald-700 border-emerald-200",
  draft: "bg-slate-50 text-slate-600 border-slate-200",
  unknown: "bg-slate-50 text-slate-600 border-slate-200",
  out: "bg-slate-100 text-slate-700 border-slate-300",
  pending: "bg-amber-50 text-amber-800 border-amber-200",
  partial: "bg-amber-50 text-amber-800 border-amber-200",
  suspended: "bg-amber-50 text-amber-800 border-amber-200",
  not_arrived: "bg-amber-50 text-amber-800 border-amber-200",
  offline: "bg-rose-50 text-rose-700 border-rose-200",
  failed: "bg-rose-50 text-rose-700 border-rose-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
  terminated: "bg-rose-50 text-rose-700 border-rose-200",
  archived: "bg-slate-100 text-slate-500 border-slate-200",
  simulator: "bg-purple-50 text-purple-700 border-purple-200",
}

const BADGE_LABEL: Record<string, string> = { in: "Checked in", out: "Checked out", not_arrived: "Not arrived" }

export function StatusBadge({ value, label }: { value: string; label?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold whitespace-nowrap ${BADGE[value] ?? BADGE.draft}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 shrink-0" />
      {label ?? BADGE_LABEL[value] ?? humanize(value)}
    </span>
  )
}

// ── states ──────────────────────────────────────────────────────────────────

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-xs font-semibold text-slate-500" role="status">
      <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> {label}
    </div>
  )
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center" role="alert">
      <AlertTriangle className="w-5 h-5 text-rose-600" />
      <p className="text-xs font-medium text-slate-700">{errorText(error)}</p>
      {onRetry && (
        <button onClick={onRetry} className="text-xs font-semibold text-blue-600 hover:underline">
          Try again
        </button>
      )}
    </div>
  )
}

export function Empty({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <Inbox className="w-6 h-6 text-slate-400" />
      <p className="text-xs font-bold text-slate-800">{title}</p>
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
    primary: "bg-blue-600 text-white hover:bg-blue-700 border-transparent shadow-xs font-semibold",
    secondary: "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-2xs font-medium",
    danger: "bg-white text-rose-700 border-rose-200 hover:bg-rose-50 shadow-2xs font-medium",
    ghost: "bg-transparent text-slate-600 border-transparent hover:bg-slate-100 hover:text-slate-900 font-medium",
  }[variant]
  return (
    <button
      {...rest}
      disabled={rest.disabled || busy}
      className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${styles} ${className}`}
    >
      {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {children}
    </button>
  )
}

export function Field({ label, error, hint, required, children }: { label: string; error?: string; hint?: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-slate-700 mb-1">
        {label}
        {required && <span className="text-rose-600"> *</span>}
      </span>
      {children}
      {error ? <span className="block text-[11px] text-rose-600 mt-1">{error}</span> : hint ? <span className="block text-[11px] text-slate-500 mt-1">{hint}</span> : null}
    </label>
  )
}

const fieldBase =
  "px-3 py-1.5 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400 font-sans transition-colors"
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
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-2xs" onClick={onClose} />
      <div className={`relative h-full w-full ${wide ? "max-w-3xl" : "max-w-lg"} bg-white shadow-2xl flex flex-col`}>
        <header className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">{children}</div>
        {footer && <footer className="px-5 py-3.5 border-t border-slate-200 flex justify-end gap-2 bg-slate-50/50">{footer}</footer>}
      </div>
    </div>
  )
}

export function Pager({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  return (
    <div className="flex items-center justify-between text-xs text-slate-500 pt-3">
      <span className="font-medium">
        {total === 0 ? "No records" : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}`}
      </span>
      <div className="flex items-center gap-1">
        <Btn variant="ghost" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
          <ChevronLeft className="w-3.5 h-3.5" />
        </Btn>
        <span className="px-2 font-semibold text-slate-700">
          {page} / {pages}
        </span>
        <Btn variant="ghost" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page">
          <ChevronRight className="w-3.5 h-3.5" />
        </Btn>
      </div>
    </div>
  )
}

export type TableHeadItem = ReactNode | { label: ReactNode; align?: "left" | "right" | "center" }

export function Table({ head, children }: { head: TableHeadItem[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
      <table className="w-full text-[12.5px] border-collapse">
        <thead>
          <tr className="bg-slate-50/90 border-b border-slate-200">
            {head.map((h, i) => {
              let label: ReactNode = ""
              let align: "left" | "right" | "center" = "left"

              if (h && typeof h === "object" && "label" in (h as any)) {
                label = (h as any).label
                align = (h as any).align || "left"
              } else {
                label = h as ReactNode
                if (typeof h === "string") {
                  const s = h.trim().toLowerCase()
                  if (
                    s === "" ||
                    s === "actions" ||
                    s === "action" ||
                    s === "amount" ||
                    s === "net" ||
                    s === "gross" ||
                    s === "salary" ||
                    s === "hours" ||
                    s === "overtime" ||
                    s === "balance" ||
                    s === "days" ||
                    s === "rate" ||
                    s === "cost"
                  ) {
                    align = "right"
                  }
                }
              }

              const alignCls = align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"

              return (
                <th key={i} className={`px-4 py-2.5 font-bold text-[11px] uppercase tracking-wider text-slate-500 whitespace-nowrap ${alignCls}`}>
                  {label}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  )
}

export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { id: T; label: string; count?: number }[] }) {
  return (
    <div className="flex items-center gap-1 border-b border-slate-200 mb-4 overflow-x-auto" role="tablist">
      {items.map((t) => {
        const active = value === t.id
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={`px-3.5 py-2 text-xs font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors cursor-pointer ${
              active ? "border-blue-600 text-blue-600 font-bold" : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            {t.label}
            {t.count !== undefined && (
              <span
                className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold tabular-nums ${
                  active ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500"
                }`}
              >
                {t.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ── identity ────────────────────────────────────────────────────────────────

const AVATAR_TONES = ["bg-teal-100 text-teal-800", "bg-purple-100 text-purple-800", "bg-sky-100 text-sky-800",
  "bg-amber-100 text-amber-800", "bg-rose-100 text-rose-800", "bg-emerald-100 text-emerald-800", "bg-indigo-100 text-indigo-800"]

/** Initials avatar; the colour is stable per person (hash of the name). */
export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const parts = name.trim().split(/\s+/)
  const initials = (parts[0]?.[0] ?? "?") + (parts.length > 1 ? parts[parts.length - 1][0] : "")
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  const dim = { sm: "w-7 h-7 text-[11px]", md: "w-9 h-9 text-xs", lg: "w-14 h-14 text-lg" }[size]
  return <span className={`${dim} ${AVATAR_TONES[h % AVATAR_TONES.length]} rounded-full inline-flex items-center justify-center font-semibold shrink-0`}>{initials.toUpperCase()}</span>
}

export function CountBadge({ n, tone = "neutral" }: { n?: number; tone?: "neutral" | "warn" | "bad" }) {
  if (!n) return null
  const cls = { neutral: "bg-slate-200 text-slate-700", warn: "bg-amber-100 text-amber-800", bad: "bg-rose-100 text-rose-700" }[tone]
  return <span className={`ml-auto min-w-[20px] px-1.5 py-0.5 rounded-full text-[10px] font-semibold text-center tabular-nums ${cls}`}>{n > 99 ? "99+" : n}</span>
}

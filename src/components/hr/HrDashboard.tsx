import { useState } from "react"
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { ShieldAlert } from "lucide-react"
import { hr } from "../../services/hr/client"
import { EMPLOYEE_CATEGORIES, categoryLabel, type Dashboard } from "../../services/hr/types"
import { Empty, ErrorState, Kpi, Loading, PageHeader, Panel, TEAL, ago, fmtDate, fmtDateTime, humanize, filterCls, inputCls, useHr } from "./ui"
import useOrgRefs from "./useOrgRefs"

export type DashboardNav = { section: "employees" | "attendance"; filters?: Record<string, string>; employeeId?: string }

export default function HrDashboard({ onNavigate }: { onNavigate: (to: DashboardNav) => void }) {
  const refs = useOrgRefs()
  const [f, setF] = useState({ branch_id: "", department_id: "", employee_category: "" })
  const d = useHr(() => hr.get<Dashboard>("/api/v1/hr/dashboard", f), [f])

  return (
    <div>
      <PageHeader
        title="HR dashboard"
        subtitle={d.data ? `Live from HR records · ${fmtDate(d.data.as_of)}` : "Live from HR records"}
        actions={
          <>
            <select className={filterCls} value={f.branch_id} onChange={(e) => setF({ ...f, branch_id: e.target.value })} aria-label="Branch">
              <option value="">All branches</option>
              {refs.data?.branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <select className={filterCls} value={f.department_id} onChange={(e) => setF({ ...f, department_id: e.target.value })} aria-label="Department">
              <option value="">All departments</option>
              {refs.data?.departments.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
            <select className={filterCls} value={f.employee_category} onChange={(e) => setF({ ...f, employee_category: e.target.value })} aria-label="Category">
              <option value="">All categories</option>
              {EMPLOYEE_CATEGORIES.map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          </>
        }
      />
      {d.loading && !d.data ? (
        <Loading />
      ) : d.error ? (
        <ErrorState error={d.error} onRetry={d.reload} />
      ) : d.data ? (
        <Body d={d.data} onNavigate={onNavigate} scope={f} />
      ) : null}
    </div>
  )
}

function Body({ d, onNavigate, scope }: { d: Dashboard; onNavigate: (to: DashboardNav) => void; scope: Record<string, string> }) {
  const e = d.employees
  const a = d.attendance_today
  const devicesOffline = a.devices.offline ?? 0
  if (e.total === 0)
    return (
      <Panel>
        <Empty title="No employees recorded yet" hint="Set up departments under Organization, then add or import employees. Every figure here is computed from those records." />
      </Panel>
    )
  const deptData = e.by_department.slice(0, 12).map((x) => ({ name: x.department, value: x.count }))
  const catData = Object.entries(e.by_category)
    .sort((x, y) => y[1] - x[1])
    .map(([k, v]) => ({ name: categoryLabel(k), value: v }))
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        <Kpi label="Total employees" value={e.total} onClick={() => onNavigate({ section: "employees", filters: { ...scope, status: "" } })} />
        <Kpi label="Active" value={e.active} tone="good" onClick={() => onNavigate({ section: "employees", filters: { ...scope, status: "active" } })} />
        <Kpi label="Inactive" value={e.inactive} hint={Object.entries(e.by_status).filter(([k]) => k !== "active").map(([k, v]) => `${v} ${k}`).join(", ") || undefined} />
        <Kpi label="Present now" value={a.in} tone="good" onClick={() => onNavigate({ section: "attendance" })} />
        <Kpi label="Not arrived" value={a.not_arrived} tone="warn" onClick={() => onNavigate({ section: "attendance" })} />
        <Kpi label="Unmapped punches" value={a.unmapped_punches} tone={a.unmapped_punches ? "bad" : "neutral"} hint="Today" />
        <Kpi label="Devices offline" value={devicesOffline} tone={devicesOffline ? "bad" : "neutral"} hint={`Last sync ${ago(a.last_sync_at)}`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="Active staff by department">
          {deptData.length ? <HBar data={deptData} /> : <Empty title="No department assignments" />}
        </Panel>
        <Panel title="Active staff by category">
          {catData.length ? <HBar data={catData} /> : <Empty title="No active staff" />}
        </Panel>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Panel title="Branch headcount">
          <ul className="divide-y divide-slate-100">
            {e.by_branch.map((b) => (
              <li key={b.branch} className="flex justify-between py-1.5 text-sm">
                <span className="text-slate-700">{b.branch}</span>
                <span className="tabular-nums text-slate-900">{b.count}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel
          title={
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-600" /> Credentials expiring within 60 days
            </span>
          }
        >
          {d.credentials.pending_verification > 0 && (
            <p className="text-xs text-amber-800 mb-2">{d.credentials.pending_verification} credentials are awaiting verification.</p>
          )}
          {d.credentials.expiring.length === 0 ? (
            <p className="text-sm text-slate-500">None.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {d.credentials.expiring.map((c) => (
                <li key={`${c.employee_id}-${c.number}`}>
                  <button className="w-full text-left py-1.5 text-sm hover:bg-slate-50" onClick={() => onNavigate({ section: "employees", employeeId: c.employee_id })}>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-800">{c.employee_name}</span>
                      <span className={`text-xs tabular-nums ${c.days_left < 0 ? "text-rose-700 font-medium" : c.days_left < 15 ? "text-amber-700" : "text-slate-500"}`}>
                        {c.days_left < 0 ? `expired ${-c.days_left} d ago` : `${c.days_left} d left`}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {humanize(c.credential_type)} {c.number} · {fmtDate(c.expires_on)}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Recent HR activity">
          {d.recent_activity.length === 0 ? (
            <p className="text-sm text-slate-500">Nothing yet.</p>
          ) : (
            <ul className="space-y-2">
              {d.recent_activity.map((r, i) => (
                <li key={i}>
                  <button className="text-left w-full hover:bg-slate-50 rounded-[6px] px-1" onClick={() => onNavigate({ section: "employees", employeeId: r.employee_id })}>
                    <div className="text-sm text-slate-800">
                      <span className="font-medium">{r.employee_name}</span> — {r.summary}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {fmtDateTime(r.occurred_at)} · {r.actor}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
      <p className="text-[11px] text-slate-500">
        Leave, payroll, recruitment and training figures join this dashboard as those areas are rebuilt; until then they are not shown rather than shown as zero.
      </p>
    </div>
  )
}

function HBar({ data }: { data: { name: string; value: number }[] }) {
  return (
    <div style={{ height: Math.max(120, data.length * 30 + 20) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 0 }} barCategoryGap={6}>
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12, fill: "#334155" }} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: "#f1f5f9" }} formatter={(v) => [`${v} staff`, "Headcount"]} contentStyle={{ fontSize: 12, borderRadius: 6 }} />
          <Bar dataKey="value" fill={TEAL} radius={[0, 4, 4, 0]} maxBarSize={18} label={{ position: "right", fontSize: 11, fill: "#334155" }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

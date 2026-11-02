// The "HR & Staff" module: one sidebar entry, sections inside it.
//
// Sections listed here run on the FastAPI hr-api. Areas not yet rebuilt
// (shifts, leave, payroll, ...) stay on the previous HR screen, reachable as
// "Previous HR screens", until their phase replaces them -- nothing is
// removed before its replacement works.
import { useEffect, useState, type ReactNode } from "react"
import { Building2, Clock, History, LayoutDashboard, Users } from "lucide-react"
import { hr } from "../../services/hr/client"
import HrDashboard, { type DashboardNav } from "./HrDashboard"
import EmployeesSection from "./EmployeesSection"
import OrganizationSection from "./OrganizationSection"
import AttendanceSection from "./AttendanceSection"
import { ErrorState, Loading } from "./ui"

type Section = "dashboard" | "employees" | "organization" | "attendance" | "legacy"
type Session = { permissions: string[]; user_type?: string }

export default function HrWorkspace({ legacy }: { legacy: ReactNode }) {
  const [section, setSection] = useState<Section>("dashboard")
  const [nav, setNav] = useState<DashboardNav | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [authError, setAuthError] = useState<unknown>(null)

  // What the user may do comes from the same backend session the API enforces;
  // the UI only hides controls the server would refuse anyway.
  useEffect(() => {
    hr.get<{ user: Session | null }>("/api/auth/session")
      .then((r) => (r.user ? setSession(r.user) : setAuthError(new Error("You are not signed in to the HR service. Sign out and sign in again."))))
      .catch(setAuthError)
  }, [])

  const can = (p: string) => session?.user_type === "admin" || !!session?.permissions?.includes(p)
  const go = (to: DashboardNav) => {
    setNav(to)
    setSection(to.section)
  }

  const items: { id: Section; label: string; Icon: typeof Users }[] = [
    { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
    { id: "employees", label: "Employees", Icon: Users },
    { id: "organization", label: "Organization", Icon: Building2 },
    { id: "attendance", label: "Attendance", Icon: Clock },
    { id: "legacy", label: "Previous HR screens", Icon: History },
  ]

  return (
    <div className="flex flex-col lg:flex-row gap-4 min-h-full">
      <nav className="lg:w-52 shrink-0 flex lg:flex-col gap-1 overflow-x-auto" aria-label="HR sections">
        {items.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => {
              setNav(null)
              setSection(id)
            }}
            aria-current={section === id ? "page" : undefined}
            className={`flex items-center gap-2 px-3 py-2 rounded-[6px] text-sm whitespace-nowrap text-left ${
              section === id ? "bg-[#007078]/10 text-[#007078] font-medium" : "text-slate-600 hover:bg-slate-100"
            } ${id === "legacy" ? "lg:mt-4 lg:border-t lg:border-slate-200 lg:pt-3 text-slate-500" : ""}`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </nav>
      <div className="flex-1 min-w-0">
        {section === "legacy" ? (
          <div>
            <p className="text-xs text-slate-600 bg-amber-50 border border-amber-200 rounded-[6px] px-3 py-2 mb-3">
              Shifts, rosters, leave, payroll and compliance still run on the previous HR system until they are rebuilt. Employees, organization and attendance are managed in the new sections — records here are not synchronised with them.
            </p>
            {legacy}
          </div>
        ) : authError ? (
          <ErrorState error={authError} />
        ) : !session ? (
          <Loading />
        ) : (
          <>
            {section === "dashboard" && <HrDashboard onNavigate={go} />}
            {section === "employees" && (
              <EmployeesSection
                key={JSON.stringify(nav)}
                canEdit={can("employees.profile.write")}
                initialFilters={nav?.section === "employees" ? nav.filters : undefined}
                openEmployeeId={nav?.section === "employees" ? nav.employeeId : null}
                onCloseEmployee={() => setNav(null)}
              />
            )}
            {section === "organization" && <OrganizationSection canEdit={can("hr.departments.write")} />}
            {section === "attendance" && <AttendanceSection canManage={can("hr.attendance.write")} />}
          </>
        )}
      </div>
    </div>
  )
}

// Dedicated Enterprise HR & Workforce Management Workspace.
// Controlled via the main application sidebar navigation.
// Standardized on the enterprise hospital design system.
import { useEffect, useState, type ReactNode } from "react"
import { hr } from "../../services/hr/client"
import HrDashboard, { type DashboardNav } from "./HrDashboard"
import EmployeesSection from "./EmployeesSection"
import OrganizationSection from "./OrganizationSection"
import AttendanceSection from "./AttendanceSection"
import ShiftsSection from "./ShiftsSection"
import StaffingSection from "./StaffingSection"
import LeaveSection from "./LeaveSection"
import ApprovalsSection from "./ApprovalsSection"
import PayrollSection from "./PayrollSection"
import RecruitmentSection from "./RecruitmentSection"
import TrainingSection from "./TrainingSection"
import PerformanceSection from "./PerformanceSection"
import ComplianceSection from "./ComplianceSection"
import GrievancesSection from "./GrievancesSection"
import ReportsSection, { Announcements } from "./ReportsSection"
import { ErrorState } from "./ui"
import useOrgRefs from "./useOrgRefs"

export type HrSection =
  | "dashboard"
  | "employees"
  | "organization"
  | "attendance"
  | "shifts"
  | "staffing"
  | "leave"
  | "approvals"
  | "payroll"
  | "recruitment"
  | "training"
  | "performance"
  | "compliance"
  | "grievances"
  | "reports"
  | "announcements"

type Session = { permissions: string[]; user_type?: string }

const FALLBACK_ADMIN_SESSION: Session = {
  user_type: "admin",
  permissions: [
    "employees.profile.write",
    "hr.departments.write",
    "hr.attendance.write",
    "hr.shifts.write",
    "hr.leaves.write",
    "hr.payroll.write",
    "hr.recruitment.write",
    "hr.training.write",
    "hr.performance.write",
    "hr.grievances.manage",
    "hr.reports.read",
  ],
}

let cachedSession: Session | null = null

const SECTION_TITLES: Record<HrSection, { title: string; subtitle: string }> = {
  dashboard: {
    title: "Executive HR & Workforce Dashboard",
    subtitle: "Real-time workforce KPIs, staffing metrics, presence overview and action items.",
  },
  employees: {
    title: "Employees Master Directory",
    subtitle: "Complete hospital employee profiles, contracts, credentials, and departmental allocations.",
  },
  organization: {
    title: "Organization Structure",
    subtitle: "Hospital units, clinical departments, designations, and administrative reporting hierarchy.",
  },
  attendance: {
    title: "Attendance & Biometric Operations",
    subtitle: "Live eSSL/ZKTeco biometric punches, daily logs, overtime, and shift reconciliation.",
  },
  shifts: {
    title: "Shifts & Duty Rosters",
    subtitle: "Shift definitions, roster scheduling, rotation policies, and shift swaps.",
  },
  staffing: {
    title: "Staffing Requirements & Coverage",
    subtitle: "Nurse-to-patient ratios, minimum department coverage, and clinical allocations.",
  },
  leave: {
    title: "Leave & Absence Management",
    subtitle: "Leave policies, paid balances, accrual runs, and leave applications.",
  },
  approvals: {
    title: "Approvals Inbox",
    subtitle: "Centralized supervisor approvals for leaves, overtime, duty swaps, and claims.",
  },
  payroll: {
    title: "Payroll & Compensation",
    subtitle: "Monthly payroll runs, salary structures, statutory EPF/ESI, and payslips.",
  },
  recruitment: {
    title: "Recruitment & Talent Acquisition",
    subtitle: "Department vacancies, candidate pipeline, interviews, and onboarding.",
  },
  training: {
    title: "Training & Development",
    subtitle: "Clinical competencies, mandatory NABH certifications, and CME programs.",
  },
  performance: {
    title: "Performance & Appraisals",
    subtitle: "Evaluation cycles, clinical KPIs, peer reviews, and performance scores.",
  },
  compliance: {
    title: "Compliance & Medical Licenses",
    subtitle: "Medical Council registrations, nursing licenses, BLS/ACLS certificates, and expiry audits.",
  },
  grievances: {
    title: "Grievances & Discipline",
    subtitle: "Internal complaints committee, workplace grievance tickets, and resolution tracking.",
  },
  reports: {
    title: "HR Reports & Workforce Analytics",
    subtitle: "Attrition trends, headcounts, payroll summaries, and statutory compliance returns.",
  },
  announcements: {
    title: "Hospital Announcements & HR Feed",
    subtitle: "Official circulars, duty notices, and policy broadcast messages.",
  },
}

export default function HrWorkspace({
  section = "dashboard",
  initialSection = "dashboard",
  onNavigateSection,
  legacy,
}: {
  section?: HrSection
  initialSection?: HrSection
  onNavigateSection?: (section: HrSection) => void
  legacy?: ReactNode
}) {
  const [internalSection, setInternalSection] = useState<HrSection>(section || initialSection)
  const [nav, setNav] = useState<DashboardNav | null>(null)
  const [session, setSession] = useState<Session>(() => cachedSession || FALLBACK_ADMIN_SESSION)
  const [authError, setAuthError] = useState<unknown>(null)
  const [showLegacy, setShowLegacy] = useState(false)

  // Pre-warm organizational references so child dropdowns/filters render immediately
  useOrgRefs()

  // Directly evaluate active section: 0ms render lag on sidebar navigation
  const activeSection = section || internalSection

  useEffect(() => {
    if (section) setInternalSection(section)
  }, [section])

  // Fetch session in background without blocking initial rendering
  useEffect(() => {
    let alive = true
    if (!cachedSession) {
      hr.get<{ user: Session | null }>("/api/auth/session")
        .then((r) => {
          if (!alive) return
          if (r.user) {
            cachedSession = r.user
            setSession(r.user)
          }
        })
        .catch(() => {
          // Stay with fallback admin session
        })
    }
    return () => {
      alive = false
    }
  }, [])

  const isAdmin = session?.user_type === "admin"
  const can = (p: string) => isAdmin || !session?.permissions?.length || !!session?.permissions?.includes(p)

  const go = (to: DashboardNav) => {
    setNav(to)
    const target = to.section as HrSection
    setInternalSection(target)
    onNavigateSection?.(target)
  }

  const handleTabChange = (sec: HrSection) => {
    setInternalSection(sec)
    setNav(null)
    onNavigateSection?.(sec)
  }

  const currentMeta = SECTION_TITLES[activeSection] || {
    title: "HR & Staff Management",
    subtitle: "Enterprise human resources, staffing, and biometric operations.",
  }

  if (showLegacy && legacy) {
    return (
      <div className="flex flex-col h-full bg-[#F0F2F5]">
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center justify-between text-xs text-amber-800">
          <span>Viewing classic HRMS view</span>
          <button
            onClick={() => setShowLegacy(false)}
            className="font-bold underline text-[#1B4FD8] hover:text-[#1E40AF] cursor-pointer"
          >
            ← Back to Enterprise HR Workspace
          </button>
        </div>
        <div className="flex-1 overflow-auto">{legacy}</div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#F0F2F5] text-gray-900 font-sans">
      {/* ── Enterprise Standard Header Top Bar ── */}
      <div className="bg-white border-b border-[#DDE2EC] px-6 py-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-gray-900">
              {currentMeta.title}
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-blue-100 text-[#1B4FD8]">
              ● HR & Staff
            </span>
          </div>
          <p className="text-[11.5px] text-[#64748B]">
            {currentMeta.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {legacy && (
            <button
              onClick={() => setShowLegacy(true)}
              className="px-2.5 py-1 text-[11px] font-medium text-gray-600 border border-[#DDE2EC] rounded bg-white hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Classic View
            </button>
          )}
        </div>
      </div>

      {/* ── Quick Sub-Module Navigation Pills ── */}
      <div className="bg-white border-b border-[#DDE2EC] px-6 py-1.5 flex items-center gap-1 overflow-x-auto shrink-0 scrollbar-none text-[12px]">
        {(
          [
            { id: "dashboard", label: "Dashboard" },
            { id: "employees", label: "Employees" },
            { id: "attendance", label: "Attendance & eSSL" },
            { id: "shifts", label: "Shifts & Rosters" },
            { id: "staffing", label: "Staffing" },
            { id: "leave", label: "Leaves" },
            { id: "approvals", label: "Approvals" },
            { id: "payroll", label: "Payroll" },
            { id: "recruitment", label: "Recruitment" },
            { id: "organization", label: "Organization" },
            { id: "training", label: "Training" },
            { id: "performance", label: "Performance" },
            { id: "compliance", label: "Compliance" },
            { id: "grievances", label: "Grievances" },
            { id: "reports", label: "Reports" },
            { id: "announcements", label: "Announcements" },
          ] as { id: HrSection; label: string }[]
        ).map((item) => (
          <button
            key={item.id}
            onClick={() => handleTabChange(item.id)}
            className={`px-3 py-1 rounded text-[11.5px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeSection === item.id
                ? "bg-[#1B4FD8] text-white font-semibold"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* ── Main Workspace Body ── */}
      <div className="flex-1 bg-[#F0F2F5] overflow-y-auto p-5 space-y-4">
        {authError ? (
          <ErrorState error={authError} />
        ) : (
          <>
            {activeSection === "dashboard" && <HrDashboard onNavigate={go} />}
            {activeSection === "employees" && (
              <EmployeesSection
                key={JSON.stringify(nav)}
                canEdit={can("employees.profile.write")}
                can={can}
                initialFilters={nav?.section === "employees" ? nav.filters : undefined}
                openEmployeeId={nav?.section === "employees" ? nav.employeeId : null}
                onCloseEmployee={() => setNav(null)}
              />
            )}
            {activeSection === "organization" && <OrganizationSection canEdit={can("hr.departments.write")} />}
            {activeSection === "attendance" && <AttendanceSection canManage={can("hr.attendance.write")} />}
            {activeSection === "shifts" && <ShiftsSection canEdit={can("hr.shifts.write")} />}
            {activeSection === "staffing" && <StaffingSection canEdit={can("hr.shifts.write")} />}
            {activeSection === "leave" && <LeaveSection canEdit={can("hr.leaves.write")} />}
            {activeSection === "approvals" && <ApprovalsSection isAdmin={isAdmin} />}
            {activeSection === "payroll" && can("hr.payroll.write") && <PayrollSection />}
            {activeSection === "recruitment" && (
              <RecruitmentSection
                canManage={can("hr.recruitment.write")}
                canActivate={can("hr.recruitment.write") && can("employees.profile.write")}
              />
            )}
            {activeSection === "training" && <TrainingSection canManage={can("hr.training.write")} />}
            {activeSection === "performance" && <PerformanceSection canManage={can("hr.performance.write")} />}
            {activeSection === "compliance" && <ComplianceSection canManage={can("employees.profile.write")} />}
            {activeSection === "grievances" && <GrievancesSection canManage={can("hr.grievances.manage")} />}
            {activeSection === "reports" && <ReportsSection />}
            {activeSection === "announcements" && <Announcements canEdit={can("employees.profile.write")} />}
          </>
        )}
      </div>
    </div>
  )
}

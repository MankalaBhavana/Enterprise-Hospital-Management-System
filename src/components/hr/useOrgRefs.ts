import { hr } from "../../services/hr/client"
import type { Branch, Department, Designation, Hospital } from "../../services/hr/types"
import { useHr } from "./ui"

export type OrgRefs = { hospitals: Hospital[]; branches: Branch[]; departments: Department[]; designations: Designation[] }

/** Lookup lists used by filters and forms across the HR workspace. */
export default function useOrgRefs(version = 0) {
  return useHr<OrgRefs>(async () => {
    const [hospitals, branches, departments, designations] = await Promise.all([
      hr.get<Hospital[]>("/api/v1/hr/hospitals"),
      hr.get<Branch[]>("/api/v1/hr/branches"),
      hr.get<Department[]>("/api/v1/hr/departments"),
      hr.get<Designation[]>("/api/v1/hr/designations"),
    ])
    return { hospitals, branches, departments, designations }
  }, [version])
}

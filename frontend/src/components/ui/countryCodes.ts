export interface CountryCode {
  name: string
  dialCode: string
  code: string // ISO 2-letter
  flag: string
}

export const DEFAULT_COUNTRY_CODE = "+91" // India (+91) is default as requested

export const COUNTRY_CODES: CountryCode[] = [
  { name: "India", dialCode: "+91", code: "IN", flag: "🇮🇳" },
  { name: "United States", dialCode: "+1", code: "US", flag: "🇺🇸" },
  { name: "United Kingdom", dialCode: "+44", code: "GB", flag: "🇬🇧" },
  { name: "United Arab Emirates", dialCode: "+971", code: "AE", flag: "🇦🇪" },
  { name: "Saudi Arabia", dialCode: "+966", code: "SA", flag: "🇸🇦" },
  { name: "Singapore", dialCode: "+65", code: "SG", flag: "🇸🇬" },
  { name: "Australia", dialCode: "+61", code: "AU", flag: "🇦🇺" },
  { name: "Canada", dialCode: "+1", code: "CA", flag: "🇨🇦" },
  { name: "Qatar", dialCode: "+974", code: "QA", flag: "🇶🇦" },
  { name: "Kuwait", dialCode: "+965", code: "KW", flag: "🇰🇼" },
  { name: "Oman", dialCode: "+968", code: "OM", flag: "🇴🇲" },
  { name: "Bahrain", dialCode: "+973", code: "BH", flag: "🇧🇭" },
  { name: "Malaysia", dialCode: "+60", code: "MY", flag: "🇲🇾" },
  { name: "Germany", dialCode: "+49", code: "DE", flag: "🇩🇪" },
  { name: "France", dialCode: "+33", code: "FR", flag: "🇫🇷" },
  { name: "Bangladesh", dialCode: "+880", code: "BD", flag: "🇧🇩" },
  { name: "Nepal", dialCode: "+977", code: "NP", flag: "🇳🇵" },
  { name: "Sri Lanka", dialCode: "+94", code: "LK", flag: "🇱🇰" },
  { name: "Pakistan", dialCode: "+92", code: "PK", flag: "🇵🇰" },
  { name: "Philippines", dialCode: "+63", code: "PH", flag: "🇵🇭" },
  { name: "Indonesia", dialCode: "+62", code: "ID", flag: "🇮🇩" },
  { name: "Thailand", dialCode: "+66", code: "TH", flag: "🇹🇭" },
  { name: "Japan", dialCode: "+81", code: "JP", flag: "🇯🇵" },
  { name: "China", dialCode: "+86", code: "CN", flag: "🇨🇳" },
  { name: "South Africa", dialCode: "+27", code: "ZA", flag: "🇿🇦" },
  { name: "New Zealand", dialCode: "+64", code: "NZ", flag: "🇳🇿" },
  { name: "Ireland", dialCode: "+353", code: "IE", flag: "🇮🇪" },
  { name: "Switzerland", dialCode: "+41", code: "CH", flag: "🇨🇭" },
  { name: "Italy", dialCode: "+39", code: "IT", flag: "🇮🇹" },
  { name: "Spain", dialCode: "+34", code: "ES", flag: "🇪🇸" },
  { name: "Netherlands", dialCode: "+31", code: "NL", flag: "🇳🇱" },
  { name: "Sweden", dialCode: "+46", code: "SE", flag: "🇸🇪" },
  { name: "Norway", dialCode: "+47", code: "NO", flag: "🇳🇴" },
  { name: "Denmark", dialCode: "+45", code: "DK", flag: "🇩🇰" },
  { name: "Russia", dialCode: "+7", code: "RU", flag: "🇷🇺" },
  { name: "Brazil", dialCode: "+55", code: "BR", flag: "🇧🇷" },
  { name: "Mexico", dialCode: "+52", code: "MX", flag: "🇲🇽" },
  { name: "Nigeria", dialCode: "+234", code: "NG", flag: "🇳🇬" },
  { name: "Kenya", dialCode: "+254", code: "KE", flag: "🇰🇪" },
  { name: "Egypt", dialCode: "+20", code: "EG", flag: "🇪🇬" },
  { name: "South Korea", dialCode: "+82", code: "KR", flag: "🇰🇷" },
  { name: "Hong Kong", dialCode: "+852", code: "HK", flag: "🇭🇰" },
  { name: "Turkey", dialCode: "+90", code: "TR", flag: "🇹🇷" },
  { name: "Israel", dialCode: "+972", code: "IL", flag: "🇮🇱" },
  { name: "Vietnam", dialCode: "+84", code: "VN", flag: "🇻🇳" }
]

/**
 * Splits an arbitrary phone string into country dialCode and national number.
 * If no known country dialCode is detected, defaults to India (+91).
 */
export function splitPhoneNumber(
  fullPhone: string | undefined | null,
  fallbackCode: string = DEFAULT_COUNTRY_CODE
): { countryCode: string; nationalNumber: string } {
  if (!fullPhone) {
    return { countryCode: fallbackCode, nationalNumber: "" }
  }

  const trimmed = fullPhone.trim()

  // If starts with +, try matching against known dialCodes (longest match first)
  if (trimmed.startsWith("+")) {
    // Sort dial codes descending by length to match e.g. +971 before +9
    const sortedCodes = [...COUNTRY_CODES].sort(
      (a, b) => b.dialCode.length - a.dialCode.length
    )
    for (const c of sortedCodes) {
      if (trimmed.startsWith(c.dialCode)) {
        const national = trimmed.slice(c.dialCode.length).trim()
        return { countryCode: c.dialCode, nationalNumber: national }
      }
    }
    // Fallback: extract up to first space or 4 characters as country code
    const parts = trimmed.split(" ")
    if (parts.length > 1) {
      return { countryCode: parts[0], nationalNumber: parts.slice(1).join(" ") }
    }
  }

  // If no + prefix, assume it is national number with default country code
  return { countryCode: fallbackCode, nationalNumber: trimmed }
}

/**
 * Formats country dialCode and national number into a clean standardized string.
 */
export function combinePhoneNumber(
  countryCode: string,
  nationalNumber: string
): string {
  const cleanNational = nationalNumber.trim()
  if (!cleanNational) return ""
  const code = countryCode.trim() || DEFAULT_COUNTRY_CODE
  return `${code} ${cleanNational}`
}

import * as React from "react"
import { cn } from "../../lib/cn"
import {
  COUNTRY_CODES,
  DEFAULT_COUNTRY_CODE,
  splitPhoneNumber,
  combinePhoneNumber,
  CountryCode,
} from "./countryCodes"

export interface PhoneInputProps {
  value?: string
  countryCode?: string
  onCountryCodeChange?: (countryCode: string) => void
  onChange?: (
    value: string,
    meta?: { countryCode: string; nationalNumber: string; country?: CountryCode }
  ) => void
  format?: "combined" | "national"
  placeholder?: string
  disabled?: boolean
  required?: boolean
  id?: string
  name?: string
  maxLength?: number
  className?: string
  inputClassName?: string
  selectClassName?: string
  autoFocus?: boolean
  size?: "sm" | "md" | "lg"
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value = "",
  countryCode: controlledCode,
  onCountryCodeChange,
  onChange,
  format = "combined",
  placeholder,
  disabled = false,
  required = false,
  id,
  name,
  maxLength,
  className,
  inputClassName,
  selectClassName,
  autoFocus = false,
  size = "md",
}) => {
  // Parse incoming value into countryCode and nationalNumber
  const parsed = React.useMemo(() => {
    return splitPhoneNumber(value, controlledCode || DEFAULT_COUNTRY_CODE)
  }, [value, controlledCode])

  const [internalCode, setInternalCode] = React.useState<string>(
    controlledCode || parsed.countryCode || DEFAULT_COUNTRY_CODE
  )

  // Keep internal code in sync if controlled or if parsed code changed from a prefixed value
  React.useEffect(() => {
    if (controlledCode) {
      setInternalCode(controlledCode)
    } else if (parsed.countryCode) {
      setInternalCode(parsed.countryCode)
    }
  }, [controlledCode, parsed.countryCode])

  const activeCode = controlledCode || internalCode || DEFAULT_COUNTRY_CODE
  const activeCountry = React.useMemo(() => {
    return (
      COUNTRY_CODES.find((c) => c.dialCode === activeCode) ||
      COUNTRY_CODES.find((c) => c.dialCode === DEFAULT_COUNTRY_CODE) ||
      COUNTRY_CODES[0]
    )
  }, [activeCode])

  const handleCodeChange = (newCode: string) => {
    setInternalCode(newCode)
    if (onCountryCodeChange) {
      onCountryCodeChange(newCode)
    }
    const country = COUNTRY_CODES.find((c) => c.dialCode === newCode)
    if (onChange) {
      const outValue =
        format === "combined"
          ? combinePhoneNumber(newCode, parsed.nationalNumber)
          : parsed.nationalNumber
      onChange(outValue, {
        countryCode: newCode,
        nationalNumber: parsed.nationalNumber,
        country,
      })
    }
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value

    // If user pasted a number that starts with +, extract country code automatically
    if (raw.trim().startsWith("+")) {
      const autoParsed = splitPhoneNumber(raw, activeCode)
      setInternalCode(autoParsed.countryCode)
      if (onCountryCodeChange) {
        onCountryCodeChange(autoParsed.countryCode)
      }
      raw = autoParsed.nationalNumber
    }

    // Keep numbers, spaces, and hyphens clean
    const cleaned = raw.replace(/[^\d\s-]/g, "")

    const country = COUNTRY_CODES.find((c) => c.dialCode === activeCode)
    if (onChange) {
      const outValue =
        format === "combined"
          ? combinePhoneNumber(activeCode, cleaned)
          : cleaned
      onChange(outValue, {
        countryCode: activeCode,
        nationalNumber: cleaned,
        country,
      })
    }
  }

  // Size styling classes
  const sizeClasses = {
    sm: "h-7 text-[11px]",
    md: "h-9 text-[12px]",
    lg: "h-10 text-[13px]",
  }[size]

  return (
    <div
      className={cn(
        "inline-flex items-center w-full rounded border border-[#CBD5E1] bg-white transition-all shadow-2xs",
        "focus-within:border-[#1B4FD8] focus-within:ring-2 focus-within:ring-[#1B4FD8]/20 focus-within:outline-none",
        disabled && "opacity-60 bg-gray-100 cursor-not-allowed",
        className
      )}
    >
      {/* Country Code Dropdown Badge */}
      <div
        className={cn(
          "relative flex items-center bg-slate-50 border-r border-[#CBD5E1] text-slate-700 px-2 py-0 shrink-0 select-none hover:bg-slate-100 transition-colors cursor-pointer",
          sizeClasses,
          selectClassName
        )}
        title="Select Country Dial Code (Default: India +91)"
      >
        <span className="mr-1 text-sm leading-none" role="img" aria-label={activeCountry.name}>
          {activeCountry.flag}
        </span>
        <span className="font-semibold text-slate-800 font-mono text-[11px]">
          {activeCode}
        </span>
        <svg
          className="w-2.5 h-2.5 ml-1 text-slate-400 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            d="M19 9l-7 7-7-7"
          />
        </svg>

        {/* Native Select overlaid seamlessly for perfect accessibility & mobile pickers */}
        <select
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
          value={activeCode}
          onChange={(e) => handleCodeChange(e.target.value)}
          disabled={disabled}
          title="Select Country Code"
        >
          {COUNTRY_CODES.map((c) => (
            <option key={`${c.code}-${c.dialCode}`} value={c.dialCode}>
              {c.flag} {c.name} ({c.dialCode})
            </option>
          ))}
        </select>
      </div>

      {/* National Number Input */}
      <input
        type="tel"
        inputMode="numeric"
        value={parsed.nationalNumber}
        onChange={handleNumberChange}
        placeholder={
          placeholder ||
          (activeCode === "+91" ? "98765 43210" : "Enter phone number")
        }
        disabled={disabled}
        required={required}
        id={id}
        name={name}
        maxLength={maxLength || (activeCode === "+91" ? 14 : 18)}
        autoFocus={autoFocus}
        className={cn(
          "w-full h-full px-2.5 py-1 text-slate-900 bg-transparent placeholder-slate-400 focus:outline-none",
          sizeClasses,
          inputClassName
        )}
      />
    </div>
  )
}

export default PhoneInput

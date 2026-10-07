/**
 * Tab bar icons — vector paths pulled from Figma (drank file, node 1661-6940
 * "tab-bar"), not hand-drawn. `stroke="currentColor"` replaces the per-state
 * hardcoded colors Figma exported (e.g. #A6A69E inactive / #FFFBF5 active) so
 * TabBar can drive color from CSS instead of needing separate icon assets
 * per state.
 */
import type { SVGProps } from "react"

type IconProps = SVGProps<SVGSVGElement>

function Icon({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {children}
    </svg>
  )
}

export function FeedIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path
        d="M13.7504 17.084H2.916V6.24965M7.08306 2.916H17.084V12.9169H7.08306V2.916Z"
        stroke="currentColor"
        strokeWidth="1.58"
        strokeLinecap="round"
      />
    </Icon>
  )
}

export function CalendarIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path
        d="M2.916 9.16659H17.084M6.90075 2.916V6.24965M13.0992 2.916V6.24965M2.916 5.41624H17.084V17.084H2.916V5.41624Z"
        stroke="currentColor"
        strokeWidth="1.58"
        strokeLinecap="round"
      />
    </Icon>
  )
}

export function CardsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path
        d="M5.952 2.916H17.084M2.916 5.84731H17.084V17.084H2.916V5.84731Z"
        stroke="currentColor"
        strokeWidth="1.58"
        strokeLinecap="round"
      />
    </Icon>
  )
}

/** Center shuffle button — two crossing arrows. Hand-drawn to match the
 * other tab icons' stroke weight, not pulled from Figma. */
export function ShuffleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path
        d="M2.916 5.833H5.6c1.2 0 2.2.6 2.9 1.6l3 4.5c.7 1 1.7 1.6 2.9 1.6h2.684M14.5 3.5l2.584 2.333L14.5 8.167M2.916 14.167H5.6c1.2 0 2.2-.6 2.9-1.6M11.5 7.433c.7-1 1.7-1.6 2.9-1.6M14.5 11.833l2.584 2.334L14.5 16.5"
        stroke="currentColor"
        strokeWidth="1.58"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Icon>
  )
}

export function UsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path
        d="M2.916 17.084C2.916 14.0837 6.12741 12.4169 10 12.4169C13.8726 12.4169 17.084 14.0837 17.084 17.084M10 9.58329C11.002 9.58329 11.963 9.23207 12.6715 8.60689C13.3801 7.98171 13.7781 7.13379 13.7781 6.24965C13.7781 5.36551 13.3801 4.51758 12.6715 3.8924C11.963 3.26722 11.002 2.916 10 2.916C8.99798 2.916 8.03699 3.26722 7.32846 3.8924C6.61992 4.51758 6.22187 5.36551 6.22187 6.24965C6.22187 7.13379 6.61992 7.98171 7.32846 8.60689C8.03699 9.23207 8.99798 9.58329 10 9.58329Z"
        stroke="currentColor"
        strokeWidth="1.58"
        strokeLinecap="round"
      />
    </Icon>
  )
}

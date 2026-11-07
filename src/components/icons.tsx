import type { ReactNode, SVGProps } from 'react'

/** Icons drawn from the SVGs in design-reference/html. All are decorative. */
type IconProps = Omit<SVGProps<SVGSVGElement>, 'children'> & {
  size?: number
  strokeWidth?: number
}

function Icon({
  size = 24,
  strokeWidth = 2,
  children,
  ...rest
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  )
}

/** The HeatGuard logo mark. Pass `withBulb={false}` for the bottom nav version. */
export function ThermometerIcon({ withBulb = true, ...props }: IconProps & { withBulb?: boolean }) {
  return (
    <Icon {...props}>
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
      {withBulb && <circle cx="11.5" cy="17.5" r="1.5" />}
    </Icon>
  )
}

/** Two sound waves on the risk card, one on the labelled "Listen" buttons. */
export function SpeakerIcon({ waves = 2, ...props }: IconProps & { waves?: 1 | 2 }) {
  return (
    <Icon {...props}>
      <path d="M11 5L6 9H2v6h4l5 4z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      {waves === 2 && <path d="M19 5a10 10 0 0 1 0 14" />}
    </Icon>
  )
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M15 18l-6-6 6-6" />
    </Icon>
  )
}

export function WarningIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </Icon>
  )
}

/** Stopwatch on Home (with the top bar), plain clock on What to do. */
export function ClockIcon({ stopwatch = false, ...props }: IconProps & { stopwatch?: boolean }) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2.5 2.5" />
      {stopwatch && <path d="M9 2h6" />}
    </Icon>
  )
}

export function DropIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" />
    </Icon>
  )
}

export function CoolIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 2v20" />
      <path d="M4.9 6.9l14.2 10.2" />
      <path d="M4.9 17.1L19.1 6.9" />
    </Icon>
  )
}

export function LighterWorkIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 18h16" />
      <path d="M7 14l3-3 3 3 4-4" />
    </Icon>
  )
}

export function CalendarIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
    </Icon>
  )
}

export function DustIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 8h11a3 3 0 1 0-3-3" />
      <path d="M3 12h15a3 3 0 1 1-3 3" />
      <path d="M3 16h7" />
    </Icon>
  )
}

export function StormIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M17 16a4 4 0 0 0-1-7.9A6 6 0 0 0 4.3 10 3.5 3.5 0 0 0 5 17" />
      <path d="M12 13l-2 4h4l-2 4" />
    </Icon>
  )
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 12l5 5L20 7" />
    </Icon>
  )
}

export function HeartIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z" />
    </Icon>
  )
}

export function LockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </Icon>
  )
}

export function NoSignalIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2 2l20 20" />
      <path d="M8.5 16.5a5 5 0 0 1 7 0" />
      <path d="M5 12.5a10 10 0 0 1 5.2-2.8" />
      <path d="M12 20h.01" />
    </Icon>
  )
}

/** Wearable band, crossed out. */
export function BandOffIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="7" y="3" width="10" height="18" rx="3" />
      <path d="M4 8l16 8" />
    </Icon>
  )
}

export function BatteryLowIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2" y="7" width="18" height="10" rx="2" />
      <path d="M22 11v2" />
      <path d="M5 10v4" />
    </Icon>
  )
}

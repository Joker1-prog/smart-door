function Icon({ children, className = 'h-5 w-5', ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

export function DoorIcon(props) {
  return (
    <Icon {...props}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 3v18" opacity="0.4" />
      <path d="M16 12h0.01" strokeWidth="2.6" />
    </Icon>
  )
}

export function LockIcon(props) {
  return (
    <Icon {...props}>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      <path d="M12 15v2" />
    </Icon>
  )
}

export function RadarIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <path d="M12 12 18.5 5.5" />
    </Icon>
  )
}

export function MotionIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="5" r="2" />
      <path d="M9 21v-5l-2-2 1.5-4.5L12 11l3.5-2L17 14l-2 2v5" />
      <path d="M4 9a9 9 0 0 1 2-3M20 9a9 9 0 0 0-2-3" opacity="0.6" />
    </Icon>
  )
}

export function BellIcon(props) {
  return (
    <Icon {...props}>
      <path d="M18 8a6 6 0 0 0-12 0c0 6-3 7-3 7h18s-3-1-3-7" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </Icon>
  )
}

export function WifiIcon(props) {
  return (
    <Icon {...props}>
      <path d="M2 8.5a16 16 0 0 1 20 0" />
      <path d="M5 12a11 11 0 0 1 14 0" />
      <path d="M8.5 15.5a6 6 0 0 1 7 0" />
      <path d="M12 19h0.01" strokeWidth="2.6" />
    </Icon>
  )
}

export function VolumeIcon(props) {
  return (
    <Icon {...props}>
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" opacity="0.6" />
    </Icon>
  )
}

export function ClockIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </Icon>
  )
}

export function CheckIcon(props) {
  return (
    <Icon {...props}>
      <path d="m4 12 5 5L20 6" />
    </Icon>
  )
}

export function ShieldIcon(props) {
  return (
    <Icon {...props}>
      <path d="M12 3 4.5 6v6c0 5 3.2 8.2 7.5 9 4.3-0.8 7.5-4 7.5-9V6L12 3Z" />
      <path d="m9 12 2 2 4-4" />
    </Icon>
  )
}

export function AlertIcon(props) {
  return (
    <Icon {...props}>
      <path d="M12 4 2.8 20h18.4L12 4Z" />
      <path d="M12 10v4M12 17h0.01" />
    </Icon>
  )
}

export function RefreshIcon(props) {
  return (
    <Icon {...props}>
      <path d="M20 11a8 8 0 1 0-2.3 6.7" />
      <path d="M20 5v6h-6" />
    </Icon>
  )
}

export function SendIcon(props) {
  return (
    <Icon {...props}>
      <path d="m3 11 18-8-8 18-2-8-8-2Z" />
      <path d="m11 13 10-10" />
    </Icon>
  )
}

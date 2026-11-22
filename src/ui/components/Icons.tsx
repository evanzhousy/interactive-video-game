import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...rest }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="square"
      strokeLinejoin="miter"
      style={{ flexShrink: 0 }}
      {...rest}
    >
      {children}
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon strokeWidth="2.1" {...props}>
      <path d="M3 8.5 6.5 12 13 4.5" />
    </Icon>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Icon strokeWidth="1.8" {...props}>
      <path d="M3.5 6 8 10.5 12.5 6" />
    </Icon>
  );
}

export function ClearIcon(props: IconProps) {
  return (
    <Icon strokeWidth="1.8" {...props}>
      <path d="M4 4 12 12M12 4 4 12" />
    </Icon>
  );
}

export function ArchiveIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2 3.5h12v3H2zM3 6.5v6h10v-6M6.5 9.5h3" />
    </Icon>
  );
}

export function FlameFuelIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 3h7v10h-7zM10.5 5.5H13v5h-2.5M6 6.5v3" />
    </Icon>
  );
}

export function BoltPowerIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 1.5 3.5 9H8l-1 5.5L12.5 7H8z" />
    </Icon>
  );
}

export function StrobeTargetIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2.5" y="2.5" width="11" height="11" />
      <path d="M8 1v3M8 12v3M1 8h3M12 8h3" />
      <rect x="6.5" y="6.5" width="3" height="3" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function ThermalWaveIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2 3.5h12M2 8h12M2 12.5h12M5 1.5v13M11 1.5v13" />
    </Icon>
  );
}

export function MicSignalIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 11V8M6.3 12.5V5.5M9.6 12.5V3.5M13 12.5V7" />
    </Icon>
  );
}

export function SnowHazardIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 1.5v13M2.4 4.75l11.2 6.5M13.6 4.75l-11.2 6.5" />
    </Icon>
  );
}

export function LockSealIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="7" width="10" height="7" />
      <path d="M5 7V4.5a3 3 0 0 1 6 0V7" />
      <path d="M8 10v1.5" />
    </Icon>
  );
}

export function SubHullIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M1.5 9.5h13l-2 3.5h-9zM4.5 9.5V6h5v3.5M7 3v3" />
    </Icon>
  );
}

export function HazardTriangleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 2 14.5 13.5h-13zM8 6.5v3.5" />
      <rect x="7.2" y="11" width="1.6" height="1.5" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function SlidersConsoleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2.5 4h11M2.5 8h11M2.5 12h11M5.5 2.5v3M10.5 6.5v3M6.5 10.5v3" />
    </Icon>
  );
}

export function StarCommendIcon({
  filled = false,
  ...props
}: IconProps & { filled?: boolean }) {
  return (
    <Icon {...props}>
      <polygon
        points="8,1.5 9.8,6.2 14.5,8 9.8,9.8 8,14.5 6.2,9.8 1.5,8 6.2,6.2"
        fill={filled ? "currentColor" : "none"}
      />
    </Icon>
  );
}

export function ClipboardDataIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 2.5h8v11.5H4zM6 1.5h4v2H6zM6 7h4M6 10h4" />
    </Icon>
  );
}

export function HeartPulseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M1 8.5h3l1.8-4.5 2.4 7.5L10.5 5l1.5 3.5h3" />
    </Icon>
  );
}

export function MotionPauseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4" y="3" width="2.8" height="10" fill="currentColor" stroke="none" />
      <rect x="9.2" y="3" width="2.8" height="10" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function MotionPlayIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <polygon points="4.5,3 13,8 4.5,13" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function StoryBranchIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="3.5" cy="8" r="1.7" />
      <circle cx="12.5" cy="4" r="1.7" />
      <circle cx="12.5" cy="12" r="1.7" />
      <path d="M5.2 8h2.6c1 0 1.4-4 3-4M7.8 8c1 0 1.4 4 3 4" />
    </Icon>
  );
}

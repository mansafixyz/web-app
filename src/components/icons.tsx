import Image from "next/image";
import { cn } from "@/lib/utils";

interface IconProps {
  className?: string;
  size?: number;
  color?: string;
}

export function MansaFiLogo({ className, size = 22 }: IconProps) {
  return (
    <Image
      src="/images/logo.png"
      alt="MansaFi"
      width={size}
      height={size}
      className={className}
    />
  );
}

export function MansaFiMark({ className, size = 20 }: IconProps) {
  return (
    <Image
      src="/images/logo.png"
      alt="MansaFi logo"
      width={size}
      height={size}
      className={className}
    />
  );
}

export function ArrowRightIcon({ className, size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      className={className}
    >
      <path
        d="M3 8h10M9 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronRightIcon({ className, size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      className={className}
    >
      <path
        d="M6 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ExternalLinkIcon({ className, size = 12 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      className={className}
    >
      <path
        d="M2 10L10 2M10 2H5M10 2v5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MenuIcon({ className, size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      className={className}
    >
      <path
        d="M2 4h12M2 8h12M2 12h12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function XIcon({ className, size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      className={className}
    >
      <path
        d="M3 3l10 10M13 3L3 13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PulseDot({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-block w-2 h-2 rounded-full bg-emerald-400", className)}
      style={{ animation: "pulse-dot 2s ease-in-out infinite" }}
    />
  );
}

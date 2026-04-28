import { SVGProps } from "react";

type IconName = "check" | "star" | "book" | "flame";

function CardIcon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & {
  name: IconName;
}) {
  if (name === "check") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
        <circle cx="12" cy="12" r="9" />
        <path d="m8.5 12.5 2.3 2.3 4.7-5.3" />
      </svg>
    );
  }

  if (name === "star") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="m12 3 2.75 5.57 6.15.89-4.45 4.33 1.05 6.13L12 17l-5.5 2.92 1.05-6.13L3.1 9.46l6.15-.89L12 3Z" />
      </svg>
    );
  }

  if (name === "book") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5V5.5Z" />
        <path d="M6.5 3v16" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M12 3c2.3 2.7 3.8 4.9 3.8 7a3.8 3.8 0 1 1-7.6 0C8.2 7.9 9.7 5.7 12 3Z" />
      <path d="M8 14.5A5 5 0 0 0 18 16c0-2.7-1.8-4.4-3-5.8" />
    </svg>
  );
}

export function StatCard({
  value,
  label,
  description,
  icon,
}: {
  value: string;
  label: string;
  description: string;
  icon: IconName;
}) {
  return (
    <div className="rounded-[24px] border border-[#ece6da] bg-white p-5 shadow-[0_14px_35px_rgba(51,45,35,0.05)]">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#edf5ef] text-[#256145]">
        <CardIcon name={icon} className="h-5 w-5" />
      </div>
      <div className="mt-5 text-[2rem] font-semibold leading-none text-[#1d2b22]">{value}</div>
      <div className="mt-2 text-sm font-semibold text-[#2a372f]">{label}</div>
      <div className="mt-1 text-xs text-[#7a877f]">{description}</div>
    </div>
  );
}

interface BullIconProps {
  className?: string;
}

export const BullIcon = ({ className = "w-6 h-6" }: BullIconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Bull head outline */}
    <ellipse cx="12" cy="14" rx="6" ry="7" />
    {/* Left horn */}
    <path d="M6 9 C4 6, 2 4, 1 2" />
    {/* Right horn */}
    <path d="M18 9 C20 6, 22 4, 23 2" />
    {/* Left eye */}
    <circle cx="9" cy="12" r="1" fill="currentColor" stroke="none" />
    {/* Right eye */}
    <circle cx="15" cy="12" r="1" fill="currentColor" stroke="none" />
    {/* Nose ring */}
    <circle cx="12" cy="17" r="2" />
    {/* Nostrils */}
    <circle cx="10.5" cy="16" r="0.5" fill="currentColor" stroke="none" />
    <circle cx="13.5" cy="16" r="0.5" fill="currentColor" stroke="none" />
  </svg>
);

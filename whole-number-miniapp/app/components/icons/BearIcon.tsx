interface BearIconProps {
  className?: string;
}

export const BearIcon = ({ className = "w-6 h-6" }: BearIconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Bear head outline */}
    <circle cx="12" cy="13" r="7" />
    {/* Left ear */}
    <circle cx="6" cy="6" r="2.5" />
    {/* Right ear */}
    <circle cx="18" cy="6" r="2.5" />
    {/* Left eye */}
    <circle cx="9" cy="11" r="1" fill="currentColor" stroke="none" />
    {/* Right eye */}
    <circle cx="15" cy="11" r="1" fill="currentColor" stroke="none" />
    {/* Nose */}
    <ellipse cx="12" cy="15" rx="2" ry="1.5" />
  </svg>
);

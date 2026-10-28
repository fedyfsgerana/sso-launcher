export function RingsArt({
  className = "hero-rings",
}: Readonly<{ className?: string }>) {
  return (
    <svg
      className={className}
      viewBox="0 0 240 180"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <g stroke="currentColor" strokeOpacity="0.06" strokeWidth="5">
        <circle cx="96" cy="76" r="50" />
        <circle cx="148" cy="112" r="48" />
      </g>
      <g stroke="currentColor" strokeOpacity="0.05" strokeWidth="1">
        <circle cx="96" cy="76" r="76" />
        <circle cx="148" cy="112" r="74" />
      </g>
    </svg>
  );
}

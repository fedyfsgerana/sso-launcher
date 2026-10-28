type ProgressProps = Readonly<{
  value: number;
  max?: number;
  label?: string;
}>;

export function Progress({ value, max = 100, label }: ProgressProps) {
  const normalizedValue = Math.min(Math.max(value, 0), max);
  const percentage = (normalizedValue / max) * 100;

  return (
    <div className="progress">
      {label && (
        <div className="progress-header">
          <span>{label}</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}

      <div
        className="progress-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={normalizedValue}
      >
        <div className="progress-value" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

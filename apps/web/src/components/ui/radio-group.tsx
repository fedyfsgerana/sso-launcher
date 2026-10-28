type RadioOption = {
  label: string;
  value: string;
  description?: string;
};

type RadioGroupProps = Readonly<{
  name: string;
  value: string;
  options: RadioOption[];
  onChange: (value: string) => void;
}>;

export function RadioGroup({
  name,
  value,
  options,
  onChange,
}: RadioGroupProps) {
  return (
    <div className="radio-group">
      {options.map((option) => (
        <label key={option.value} className="radio-option">
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />

          <span className="radio-control" aria-hidden="true" />

          <span className="radio-content">
            <strong>{option.label}</strong>
            {option.description && <small>{option.description}</small>}
          </span>
        </label>
      ))}
    </div>
  );
}

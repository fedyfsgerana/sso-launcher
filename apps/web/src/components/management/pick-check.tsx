import { Check } from "lucide-react";
import { Icon } from "@/components/ui/icon";

type PickCheckProps = Readonly<{
  checked: boolean;
  label: string;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
}>;

export function PickCheck({
  checked,
  label,
  indeterminate = false,
  onChange,
}: PickCheckProps) {
  return (
    <label className="cbx">
      <input
        type="checkbox"
        aria-label={label}
        checked={checked}
        ref={(element) => {
          if (element) {
            element.indeterminate = indeterminate && !checked;
          }
        }}
        onChange={(event) => onChange(event.target.checked)}
      />
      <i>
        <Icon icon={Check} size={13} />
      </i>
    </label>
  );
}

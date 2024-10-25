import Input from "./Input";
import Select from "./Select";
import { DurationObject, DurationUnits } from "../../../types/api";
import { useMemo } from "react";

interface DurationInputProps {
  value?: DurationObject;
  onChange?: (v: DurationObject) => void;
}

const DurationInput: React.FC<DurationInputProps> = ({ value, onChange }) => {
  const duration = useMemo(() => Object.values(value ?? {})[0] ?? 1, [value]);
  const unit = useMemo(() => Object.keys(value ?? {})[0] ?? "days", [value]);

  return (
    <div className="grid grid-cols-2 gap-2">
      <Input
        type="number"
        min={0}
        value={duration}
        onChange={(e) =>
          onChange?.({
            [unit]: Number(e.target.value),
          })
        }
      />
      <Select
        options={DurationUnits.map((u) => ({ key: u, label: u }))}
        value={unit}
        onChange={(e) =>
          onChange?.({
            [e.target.value as keyof DurationObject]: duration,
          })
        }
      />
    </div>
  );
};

export default DurationInput;

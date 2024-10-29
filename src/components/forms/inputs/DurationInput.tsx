import Input from "./Input";
import Select from "./Select";
import { DurationObject, DurationUnits } from "../../../types/api";
import { useMemo } from "react";

type DurationKey = (typeof DurationUnits)[number];

interface DurationInputProps {
  value?: DurationObject;
  onChange?: (v: DurationObject) => void;
  allowedUnits?: Array<(typeof DurationUnits)[number]>;
}

const DurationInput: React.FC<DurationInputProps> = ({
  value,
  onChange,
  allowedUnits,
}) => {
  const duration = useMemo(() => Object.values(value ?? {})[0] ?? 1, [value]);
  const unit = useMemo(
    () => (Object.keys(value ?? {})[0] ?? "days") as DurationKey,
    [value]
  );

  return (
    <div className="grid grid-cols-2 gap-2">
      <Input
        type="number"
        min={0}
        value={duration}
        onChange={(e) =>
          onChange?.({
            [unit]: Number(e.target.value),
          } as DurationObject)
        }
      />
      <Select
        options={DurationUnits.filter(
          (k) => !allowedUnits || allowedUnits.includes(k)
        ).map((u) => ({ key: u, label: u }))}
        value={unit}
        onChange={(e) =>
          onChange?.({
            [e.target.value]: duration,
          } as DurationObject)
        }
      />
    </div>
  );
};

export default DurationInput;

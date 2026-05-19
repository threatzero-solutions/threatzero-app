/**
 * Interactive variant of StatusBadge. Reads as the same chip as the
 * static badge, with a small caret to signal it opens. Click → small
 * popover listing the other statuses as same-tone badges; pick one to
 * fire `onChange`. Mid-mutation the caret turns into a spinner and
 * the button is disabled.
 *
 * When `disabled` is true (typical for users without WRITE permission)
 * it falls back to rendering a static StatusBadge — same visual
 * footprint, no caret, no popover.
 *
 * Status-change is the highest-frequency edit on these pages; this
 * collapses "find Actions menu → pick Mark As X" into a single chip
 * click, mirroring the Linear / Asana / Notion pattern.
 */
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { CaretDown, Check, CircleNotch } from "@phosphor-icons/react";
import StatusBadge, {
  statusBadgeBaseClass,
  statusBadgeToneStyles,
  StatusBadgeTone,
} from "./StatusBadge";

export interface StatusOption<T extends string> {
  value: T;
  label: string;
  tone: StatusBadgeTone;
}

interface StatusBadgePickerProps<T extends string> {
  value: T;
  options: StatusOption<T>[];
  onChange: (next: T) => void;
  disabled?: boolean;
  loading?: boolean;
}

function StatusBadgePicker<T extends string>({
  value,
  options,
  onChange,
  disabled,
  loading,
}: StatusBadgePickerProps<T>) {
  const current =
    options.find((o) => o.value === value) ??
    ({ value, label: value, tone: "muted" } as StatusOption<T>);

  if (disabled) {
    return <StatusBadge label={current.label} tone={current.tone} />;
  }

  return (
    <Menu as="div" className="relative inline-block">
      <MenuButton
        disabled={loading}
        className={[
          statusBadgeBaseClass,
          statusBadgeToneStyles[current.tone],
          "gap-1.5 transition-all",
          "hover:brightness-95 focus-visible:outline-none focus-visible:ring-primary-400",
          "data-open:brightness-95",
          loading ? "cursor-wait opacity-80" : "cursor-pointer",
        ].join(" ")}
      >
        <span>{current.label}</span>
        {loading ? (
          <CircleNotch
            size={10}
            weight="bold"
            className="animate-spin opacity-80"
            aria-hidden="true"
          />
        ) : (
          <CaretDown
            size={10}
            weight="bold"
            className="opacity-70 transition-transform group-data-open:rotate-180"
            aria-hidden="true"
          />
        )}
      </MenuButton>

      <MenuItems
        anchor={{ to: "bottom start", gap: 6 }}
        transition
        portal
        className={[
          "z-30 min-w-[10rem] origin-top-left rounded-lg bg-white p-1 shadow-lg ring-1 ring-warm-200",
          "focus:outline-none",
          "transition duration-150 ease-out data-closed:opacity-0 data-closed:scale-95",
          "data-leave:duration-100 data-leave:ease-in",
        ].join(" ")}
      >
        {options.map((opt) => {
          const isCurrent = opt.value === value;
          return (
            <MenuItem key={opt.value}>
              {({ focus }) => (
                <button
                  type="button"
                  onClick={() => !isCurrent && onChange(opt.value)}
                  disabled={isCurrent}
                  className={[
                    "flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5",
                    "text-left transition-colors",
                    focus && !isCurrent ? "bg-warm-100" : "",
                    isCurrent ? "cursor-default" : "cursor-pointer",
                  ].join(" ")}
                >
                  <StatusBadge label={opt.label} tone={opt.tone} />
                  {isCurrent && (
                    <Check
                      size={14}
                      weight="bold"
                      className="text-secondary-400 shrink-0"
                      aria-hidden="true"
                    />
                  )}
                </button>
              )}
            </MenuItem>
          );
        })}
      </MenuItems>
    </Menu>
  );
}

export default StatusBadgePicker;

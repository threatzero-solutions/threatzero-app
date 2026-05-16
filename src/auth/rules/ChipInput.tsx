import { XMarkIcon } from "@heroicons/react/20/solid";
import { AnimatePresence, motion } from "motion/react";
import { KeyboardEvent, useRef, useState } from "react";

export interface ChipInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  ariaLabel?: string;
}

/**
 * Pill-style multi-value input. Enter / "," / Tab commits the typed value
 * as a chip; Backspace on an empty input removes the last chip. Duplicate
 * (case-insensitive) entries are silently ignored so admins don't have to
 * de-dupe by hand.
 */
export const ChipInput: React.FC<ChipInputProps> = ({
  value,
  onChange,
  placeholder,
  ariaLabel,
}) => {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = (raw: string) => {
    const v = raw.trim();
    if (!v) return;
    if (value.some((existing) => existing.toLowerCase() === v.toLowerCase()))
      return;
    onChange([...value, v]);
    setDraft("");
  };

  const remove = (i: number) => {
    const next = value.slice();
    next.splice(i, 1);
    onChange(next);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit(draft);
    } else if (e.key === "Tab" && draft.trim()) {
      commit(draft);
    } else if (e.key === "Backspace" && !draft && value.length > 0) {
      e.preventDefault();
      remove(value.length - 1);
    }
  };

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      onClick={() => inputRef.current?.focus()}
      className="flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md bg-white px-2 py-1.5 shadow-xs ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-secondary-600 cursor-text sm:text-sm"
    >
      <AnimatePresence initial={false}>
        {value.map((v, i) => (
          <motion.span
            key={`${v}-${i}`}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-sm text-gray-800"
          >
            {v}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                remove(i);
              }}
              className="rounded text-gray-400 hover:text-red-700"
              aria-label={`Remove ${v}`}
            >
              <XMarkIcon className="size-3.5" />
            </button>
          </motion.span>
        ))}
      </AnimatePresence>
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKey}
        onBlur={() => draft.trim() && commit(draft)}
        placeholder={value.length === 0 ? placeholder : ""}
        className="flex-1 min-w-[8ch] bg-transparent border-0 p-0 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
      />
    </div>
  );
};

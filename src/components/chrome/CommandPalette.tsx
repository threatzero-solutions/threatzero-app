/**
 * Chrome-level command palette. Opens with Cmd-K / Ctrl-K or by
 * clicking the top-bar search launcher. v1 indexes navigation
 * destinations only: nav routes from `nav-config`, filtered through
 * the same `useNav` permission checks the sidebar uses.
 *
 * Entity search (orgs, users, training items) is intentionally
 * deferred to a follow-up. The architecture is ready: drop in a
 * `Command.Group` for each TanStack query, debounce on input, and
 * the cmdk fuzzy matcher does the rest. See the shape brief
 * `_docs/2026-05-18-chrome-rework-brief.md` § Open Questions.
 *
 * The palette is a HeadlessUI Dialog for the modal portal, focus
 * trap, scrim, and Esc handling. cmdk owns the input, list, and
 * keyboard navigation.
 */
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { Command } from "cmdk";
import { Fragment, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { useNav } from "../../utils/navigation";
import { MagnifyingGlass } from "./icons";
import { CHROME_NAV, FlatNavEntry, flattenNav } from "./nav-config";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onOpenChange,
}) => {
  const navigate = useNavigate();
  const { canNavigate } = useNav();

  // Global Cmd-K / Ctrl-K to toggle. We don't claim other shortcuts.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isPaletteKey =
        e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey);
      if (isPaletteKey) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  const entries = useMemo<FlatNavEntry[]>(
    () =>
      flattenNav(CHROME_NAV).filter((e) =>
        e.permissionOptions
          ? canNavigate({
              name: e.label,
              permissionOptions: e.permissionOptions,
            })
          : true,
      ),
    [canNavigate],
  );

  // Group entries by parent group name so the palette reads as the
  // sidebar's information architecture, not a flat dump.
  const grouped = useMemo(() => {
    const groups = new Map<string, FlatNavEntry[]>();
    const ungrouped: FlatNavEntry[] = [];
    for (const entry of entries) {
      if (entry.group) {
        const list = groups.get(entry.group) ?? [];
        list.push(entry);
        groups.set(entry.group, list);
      } else {
        ungrouped.push(entry);
      }
    }
    return { groups, ungrouped };
  }, [entries]);

  const handleSelect = (to: string) => {
    onOpenChange(false);
    navigate(to);
  };

  return (
    <Transition show={open} as={Fragment} appear>
      <Dialog
        as="div"
        className="relative z-40"
        onClose={() => onOpenChange(false)}
      >
        <TransitionChild
          as={Fragment}
          enter="transition-opacity duration-200 ease-out"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity duration-150 ease-in"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <DialogBackdrop className="fixed inset-0 bg-secondary-900/40" />
        </TransitionChild>

        <div className="fixed inset-0 z-40 flex items-start justify-center pt-[12vh] px-4 motion-reduce:pt-24">
          <TransitionChild
            as={Fragment}
            enter="transition duration-200 ease-out"
            enterFrom="opacity-0 scale-[0.98] translate-y-2"
            enterTo="opacity-100 scale-100 translate-y-0"
            leave="transition duration-150 ease-in"
            leaveFrom="opacity-100 scale-100 translate-y-0"
            leaveTo="opacity-0 scale-[0.98] translate-y-2"
          >
            <DialogPanel className="w-full max-w-xl rounded-xl bg-white shadow-xl ring-1 ring-warm-200 overflow-hidden">
              <Command label="Search" className="flex flex-col max-h-[70vh]">
                <div className="flex items-center gap-2 px-4 border-b border-warm-200">
                  <MagnifyingGlass
                    size={18}
                    weight="regular"
                    className="text-secondary-400 shrink-0"
                    aria-hidden="true"
                  />
                  <Command.Input
                    placeholder="Search…"
                    autoFocus
                    className="flex-1 h-12 bg-transparent text-sm text-secondary-900 placeholder:text-secondary-400 focus:outline-none"
                  />
                  <kbd className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-warm-100 text-secondary-500">
                    Esc
                  </kbd>
                </div>
                <Command.List className="px-2 py-2 overflow-y-auto">
                  <Command.Empty className="px-3 py-8 text-center text-sm text-secondary-500">
                    Start typing to search across navigation, organizations,
                    units, users, and training.
                    <span className="block mt-1 text-xs text-secondary-400">
                      Entity search lands in a follow-up; navigation is live
                      now.
                    </span>
                  </Command.Empty>

                  {grouped.ungrouped.length > 0 && (
                    <Command.Group
                      heading={
                        <span className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-secondary-500">
                          Navigate
                        </span>
                      }
                    >
                      {grouped.ungrouped.map((entry) => (
                        <PaletteItem
                          key={entry.id}
                          entry={entry}
                          onSelect={handleSelect}
                        />
                      ))}
                    </Command.Group>
                  )}

                  {Array.from(grouped.groups.entries()).map(
                    ([groupName, list]) => (
                      <Command.Group
                        key={groupName}
                        heading={
                          <span className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-secondary-500">
                            {groupName}
                          </span>
                        }
                      >
                        {list.map((entry) => (
                          <PaletteItem
                            key={entry.id}
                            entry={entry}
                            onSelect={handleSelect}
                          />
                        ))}
                      </Command.Group>
                    ),
                  )}
                </Command.List>
              </Command>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
};

const PaletteItem: React.FC<{
  entry: FlatNavEntry;
  onSelect: (to: string) => void;
}> = ({ entry, onSelect }) => {
  const Icon = entry.icon;
  return (
    <Command.Item
      value={`${entry.label} ${entry.group ?? ""}`}
      onSelect={() => onSelect(entry.to)}
      className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-secondary-700 cursor-pointer data-[selected=true]:bg-warm-100 data-[selected=true]:text-secondary-900"
    >
      {Icon ? (
        <Icon
          size={18}
          weight="regular"
          className="text-secondary-500 shrink-0"
        />
      ) : (
        <span className="h-[18px] w-[18px] shrink-0" />
      )}
      <span className="flex-1">{entry.label}</span>
      {entry.group && (
        <span className="text-xs text-secondary-400">{entry.group}</span>
      )}
    </Command.Item>
  );
};

export default CommandPalette;

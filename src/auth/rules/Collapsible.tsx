import { motion } from "motion/react";
import { PropsWithChildren } from "react";

// Shared animation spec for both the div and li variants so presence and
// list collapses feel identical. grid-template-rows `0fr → 1fr` lets the
// row resolve to content's intrinsic height without touching height/y.
const collapseProps = {
  initial: { gridTemplateRows: "0fr", opacity: 0 },
  animate: { gridTemplateRows: "1fr", opacity: 1 },
  exit: { gridTemplateRows: "0fr", opacity: 0 },
  transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const },
  style: { display: "grid" },
} as const;

/**
 * Smoothly collapses vertical space on enter/exit. Pair with
 * `<AnimatePresence>`. Use `Collapsible` when the child is a div-level
 * container and `CollapsibleItem` when the child must be a list item.
 */
export const Collapsible: React.FC<PropsWithChildren> = ({ children }) => (
  <motion.div {...collapseProps}>
    <div className="min-h-0 overflow-hidden">{children}</div>
  </motion.div>
);

/**
 * Same animation as `Collapsible` but renders as an `<li>`. Use inside a
 * `<ul>` so screen readers still see a list.
 */
export const CollapsibleItem: React.FC<
  PropsWithChildren<{ className?: string }>
> = ({ children, className }) => (
  <motion.li {...collapseProps} className={className}>
    <div className="min-h-0 overflow-hidden">{children}</div>
  </motion.li>
);

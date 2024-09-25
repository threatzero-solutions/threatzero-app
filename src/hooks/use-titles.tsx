import { useEffect } from "react";
import { useMatches } from "react-router-dom";

export const useTitles = () => {
  const matches = useMatches();
  const titles = matches
    .map((match) => (match.handle as { title?: string })?.title)
    .filter((t) => !!t)
    .reverse();
  useEffect(() => {
    document.title = [...titles, "ThreatZero"].join(" | ");
  }, [titles]);
  return titles;
};

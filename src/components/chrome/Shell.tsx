/**
 * Authenticated-app shell. Composes the chrome (Sidebar, TopBar,
 * Footer) with a content slot and the chrome-level toast region.
 * Owns the two pieces of cross-component state that live above the
 * content: the mobile sidebar drawer's open flag and the command
 * palette's open flag. Hooks `usePageAnchor` and `useTitles` run
 * inside, so the document title and the top-bar title stay in sync.
 */
import { ReactNode, useState } from "react";
import { Toaster } from "sonner";
import { useTitles } from "../../hooks/use-titles";
import Footer from "../layouts/Footer";
import CommandPalette from "./CommandPalette";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

interface ShellProps {
  children?: ReactNode;
}

const Shell: React.FC<ShellProps> = ({ children }) => {
  useTitles();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  return (
    <div className="min-h-screen bg-warm-50 text-secondary-900">
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div className="lg:pl-64 flex flex-col min-h-screen">
        <TopBar
          onOpenSidebar={() => setMobileSidebarOpen(true)}
          onOpenSearch={() => setPaletteOpen(true)}
        />

        <main
          id="main-content"
          className="flex-1 w-full max-w-6xl mx-auto px-4 lg:px-8 py-8"
        >
          {children}
        </main>

        <Footer />
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />

      <Toaster
        position="top-right"
        closeButton
        toastOptions={{
          className:
            "!bg-white !text-secondary-900 !border !border-warm-200 !shadow-lg",
          duration: 4000,
        }}
      />
    </div>
  );
};

export default Shell;

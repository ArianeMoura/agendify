import { AgendifyIcon } from "@/components/brand";
import { MobileNav } from "./MobileNav";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";

/** Barra superior — hambúrguer (mobile), toggle de tema e menu do usuário. */
export function Topbar() {
  return (
    <header className="border-line bg-surface/80 sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-2">
        <MobileNav />
        <AgendifyIcon className="size-8 lg:hidden" />
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}

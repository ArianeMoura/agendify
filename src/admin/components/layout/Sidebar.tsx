import Link from "next/link";
import { Logo } from "@/components/brand";
import { SidebarNav } from "./SidebarNav";

/** Sidebar fixa (desktop ≥ lg). */
export function Sidebar() {
  return (
    <aside className="border-line bg-surface hidden w-64 shrink-0 flex-col border-r p-4 lg:flex">
      <Link href="/dashboard" className="mb-8 inline-flex px-2 py-1" aria-label="Agendify — início">
        <Logo />
      </Link>
      <SidebarNav />
    </aside>
  );
}

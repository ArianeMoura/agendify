"use client";

import { useRouter } from "next/navigation";
import { ChevronDown, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  Avatar,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui";

/** Menu do usuário — avatar + dados + sair. Dropdown acessível (Radix). */
export function UserMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="hover:bg-surface-muted flex items-center gap-2 rounded-[var(--radius-full)] p-0.5 pr-2">
        <Avatar name={user.name} className="size-8" />
        <span className="text-ink hidden text-sm font-medium sm:block">{user.name}</span>
        <ChevronDown className="text-ink-muted size-4" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>
          <span className="text-ink block font-medium">{user.name}</span>
          <span className="text-ink-muted block">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => logout().then(() => router.replace("/login"))}>
          <LogOut className="size-4" aria-hidden />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

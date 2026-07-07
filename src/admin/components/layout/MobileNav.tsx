"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand";
import { useDisclosure } from "@/lib/hooks/useDisclosure";
import { SidebarNav } from "./SidebarNav";

/** Navegação mobile (< lg): botão hambúrguer + drawer lateral acessível (Radix). */
export function MobileNav() {
  const { open, setOpen, onClose } = useDisclosure();

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        className="text-ink hover:bg-surface-muted inline-flex size-9 items-center justify-center rounded-[var(--radius-sm)] lg:hidden"
        aria-label="Abrir menu"
      >
        <Menu className="size-5" aria-hidden />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" />
        <Dialog.Content
          className="border-line bg-surface fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r p-4 focus:outline-none lg:hidden"
          aria-label="Menu de navegação"
        >
          <div className="mb-8 flex items-center justify-between">
            <Logo />
            <Dialog.Close
              className="text-ink-muted hover:bg-surface-muted hover:text-ink inline-flex size-8 items-center justify-center rounded-[var(--radius-sm)]"
              aria-label="Fechar menu"
            >
              <X className="size-5" aria-hidden />
            </Dialog.Close>
          </div>
          <SidebarNav onNavigate={onClose} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

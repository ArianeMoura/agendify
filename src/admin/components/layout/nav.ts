import {
  BarChart3,
  CalendarCheck2,
  LayoutDashboard,
  MapPin,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
}

/** Itens de navegação do painel — fonte única (sidebar e drawer mobile). */
export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Visão geral", Icon: LayoutDashboard },
  { href: "/spaces", label: "Espaços", Icon: MapPin },
  { href: "/bookings", label: "Reservas", Icon: CalendarCheck2 },
  { href: "/reports", label: "Relatórios", Icon: BarChart3 },
  { href: "/users", label: "Usuários", Icon: Users },
];

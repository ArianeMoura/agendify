import { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type AlertTone = "info" | "success" | "warning" | "danger";

const config: Record<AlertTone, { className: string; Icon: typeof Info }> = {
  info: { className: "border-brand/30 bg-brand-50 text-brand-800", Icon: Info },
  success: {
    className:
      "border-[var(--color-success)]/30 bg-[var(--color-success-soft)] text-[var(--color-success)]",
    Icon: CheckCircle2,
  },
  warning: { className: "border-action/40 bg-action/15 text-on-action", Icon: AlertTriangle },
  danger: { className: "border-danger/30 bg-danger/10 text-danger", Icon: XCircle },
};

interface AlertProps {
  tone?: AlertTone;
  title?: string;
  children?: ReactNode;
  className?: string;
}

/** Banner inline de mensagem. role=alert p/ leitores de tela anunciarem. */
export function Alert({ tone = "info", title, children, className }: AlertProps) {
  const { className: toneClass, Icon } = config[tone];
  return (
    <div
      role="alert"
      className={cn(
        "flex gap-3 rounded-[var(--radius-md)] border px-4 py-3 text-sm",
        toneClass,
        className
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="space-y-0.5">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="text-current/90">{children}</div>}
      </div>
    </div>
  );
}

import { cn } from "@/lib/utils/cn";

type IconVariant = "brand" | "dark" | "mono";

interface AgendifyIconProps {
  /** brand: roxo+âmbar · dark: roxo claro p/ fundos escuros · mono: uma cor (currentColor) */
  variant?: IconVariant;
  className?: string;
  title?: string;
}

const SQUARE_FILL: Record<IconVariant, string> = {
  brand: "#5E35B1",
  dark: "#7E55D2",
  mono: "currentColor",
};

/**
 * Ícone da marca Agendify — quadrado arredondado (espaço) + selo âmbar com check
 * (reserva confirmada). Construção fiel ao guia de marca (grade 240×240): o vão
 * é subtraído via máscara para o selo "encaixar" no espaço.
 */
export function AgendifyIcon({
  variant = "brand",
  className,
  title = "Agendify",
}: AgendifyIconProps) {
  const maskId = `agendify-notch-${variant}`;
  const mono = variant === "mono";

  return (
    <svg
      viewBox="0 0 240 240"
      className={cn("h-8 w-8", className)}
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <defs>
        <mask id={maskId}>
          <rect width="240" height="240" fill="#fff" />
          <circle cx="176" cy="176" r="58" fill="#000" />
        </mask>
      </defs>
      <rect
        x="18"
        y="18"
        width="150"
        height="150"
        rx="42"
        fill={SQUARE_FILL[variant]}
        mask={`url(#${maskId})`}
      />
      <circle cx="176" cy="176" r="44" fill={mono ? "currentColor" : "#FFB300"} />
      <path
        d="M160 177 L171 188 L193 164"
        fill="none"
        stroke={mono ? "#fff" : "#14333E"}
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

import Svg, { Circle, Defs, Mask, Path, Rect } from 'react-native-svg';

export type IconVariant = 'brand' | 'dark' | 'mono';

interface AgendifyIconProps {
  /** brand: roxo+âmbar · dark: roxo claro p/ fundos escuros · mono: uma cor */
  variant?: IconVariant;
  size?: number;
  /** Cor usada na variante mono. */
  color?: string;
}

const SQUARE_FILL: Record<IconVariant, string> = {
  brand: '#5E35B1',
  dark: '#7E55D2',
  mono: 'currentColor',
};

/**
 * Ícone da marca Agendify — quadrado arredondado (espaço) + selo âmbar com check
 * (reserva confirmada). Porta fiel do componente do admin (grade 240×240): o vão
 * é subtraído via máscara para o selo "encaixar" no espaço.
 */
export function AgendifyIcon({
  variant = 'brand',
  size = 32,
  color = '#5E35B1',
}: AgendifyIconProps) {
  const maskId = `agendify-notch-${variant}`;
  const mono = variant === 'mono';
  const squareFill = mono ? color : SQUARE_FILL[variant];

  return (
    <Svg
      viewBox="0 0 240 240"
      width={size}
      height={size}
      accessibilityRole="image"
      accessibilityLabel="Agendify"
    >
      <Defs>
        <Mask id={maskId}>
          <Rect width="240" height="240" fill="#fff" />
          <Circle cx="176" cy="176" r="58" fill="#000" />
        </Mask>
      </Defs>
      <Rect
        x="18"
        y="18"
        width="150"
        height="150"
        rx="42"
        fill={squareFill}
        mask={`url(#${maskId})`}
      />
      <Circle cx="176" cy="176" r="44" fill={mono ? color : '#FFB300'} />
      <Path
        d="M160 177 L171 188 L193 164"
        fill="none"
        stroke={mono ? '#fff' : '#14333E'}
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

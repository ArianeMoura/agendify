import { useWindowDimensions } from 'react-native';

/** Largura mínima (dp) a partir da qual tratamos como tablet. */
export const TABLET_BREAKPOINT = 768;

/** Largura de conteúdo confortável para formulários/leitura em telas largas. */
export const CONTENT_MAX_WIDTH = 560;

export interface Responsive {
  width: number;
  height: number;
  isTablet: boolean;
  isLandscape: boolean;
  /** Nº de colunas sugerido para grades de cards. */
  columns: number;
}

/**
 * Informações de layout reativas ao tamanho/rotação da janela. Usar em vez de
 * dimensões hardcoded para adaptar a phone/tablet e landscape.
 */
export function useResponsive(): Responsive {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;
  const isLandscape = width > height;
  return {
    width,
    height,
    isTablet,
    isLandscape,
    columns: isTablet ? 2 : 1,
  };
}

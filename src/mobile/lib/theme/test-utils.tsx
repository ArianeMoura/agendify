import type { ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './ThemeProvider';

/**
 * Renderiza um componente dentro dos providers de que o design system depende
 * (tema + safe area), para que testes exercitem os componentes como em runtime.
 */
export function renderWithTheme(ui: ReactElement, options?: RenderOptions) {
  return render(ui, {
    wrapper: ({ children }) => (
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 47, left: 0, right: 0, bottom: 34 },
        }}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </SafeAreaProvider>
    ),
    ...options,
  });
}

export * from '@testing-library/react-native';

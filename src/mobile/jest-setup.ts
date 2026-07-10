// RNTL v13 registra automaticamente os matchers de acessibilidade
// (toBeOnTheScreen, toHaveAccessibilityState, toHaveTextContent, etc.) — não é
// necessário importar 'extend-expect' (removido nesta versão).

// Mock oficial do AsyncStorage (usado pelo ThemeProvider e AuthContext).
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Mock do reanimated para o ambiente de teste. O mock oficial não cobre alguns
// símbolos usados aqui (useReducedMotion, layout animations), então os
// complementamos — as animações em si não são exercidas nos testes de unidade.
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  // Em testes, tratamos como "reduzir movimento" ativo: desliga entering/exiting
  // (que, no mock, poderiam manter nós montados) e mantém asserções determinísticas.
  Reanimated.useReducedMotion = () => true;
  const passthroughLayout = {
    duration: () => passthroughLayout,
    delay: () => passthroughLayout,
    springify: () => passthroughLayout,
    build: () => ({}),
  };
  Reanimated.FadeInDown = passthroughLayout;
  Reanimated.FadeOutDown = passthroughLayout;
  return Reanimated;
});

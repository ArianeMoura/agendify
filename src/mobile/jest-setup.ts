// RNTL v13 registra automaticamente os matchers de acessibilidade
// (toBeOnTheScreen, toHaveAccessibilityState, toHaveTextContent, etc.) — não é
// necessário importar 'extend-expect' (removido nesta versão).

// Mock oficial do AsyncStorage (usado pelo ThemeProvider e AuthContext).
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Silencia o aviso de nativo ausente do reanimated no ambiente de teste.
// (As animações não são exercidas nos testes de unidade dos componentes.)
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

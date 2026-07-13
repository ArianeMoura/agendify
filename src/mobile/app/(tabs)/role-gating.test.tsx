import { render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/lib/theme/ThemeProvider';
import { Role, type User } from '@/lib/types';

// Captura as options de cada Tabs.Screen sem montar o navegador real.
const captured: Record<string, { href?: string | null }> = {};
jest.mock('expo-router', () => ({
  Tabs: Object.assign(
    ({ children }: { children: React.ReactNode }) => children,
    {
      Screen: ({
        name,
        options,
      }: {
        name: string;
        options?: { href?: string | null };
      }) => {
        captured[name] = options ?? {};
        return null;
      },
    },
  ),
}));

let mockUser: Partial<User> | undefined;
jest.mock('@/lib/contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

import TabLayout from './_layout';

function renderLayout() {
  for (const key of Object.keys(captured)) delete captured[key];
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 47, left: 0, right: 0, bottom: 34 },
      }}
    >
      <ThemeProvider>
        <TabLayout />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

describe('Tabs role gating', () => {
  it('esconde a aba Usuários para um Member (href null)', () => {
    mockUser = { id: '1', role: Role.Member };
    renderLayout();
    expect(captured.users.href).toBeNull();
  });

  it('mostra a aba Usuários para um OrgAdmin (href undefined)', () => {
    mockUser = { id: '1', role: Role.OrgAdmin };
    renderLayout();
    expect(captured.users.href).toBeUndefined();
  });

  it('mostra a aba Usuários para um PlatformOwner', () => {
    mockUser = { id: '1', role: Role.PlatformOwner };
    renderLayout();
    expect(captured.users.href).toBeUndefined();
  });
});

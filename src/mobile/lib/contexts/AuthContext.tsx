import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import { User, LoginResponse } from '../types';
import { tokenStore } from '../storage/tokenStore';
import { setOnSessionExpired } from '../api/config';
import { authApi } from '../api/auth';

interface AuthContextData {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setAuthData: (data: LoginResponse) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

// Chave apenas para o objeto de usuário (não-sensível). Os tokens vão para o
// armazenamento seguro (Keychain/Keystore) via tokenStore.
const USER_KEY = 'user';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  const logout = useCallback(async () => {
    try {
      const refreshToken = await tokenStore.getRefreshToken();
      if (refreshToken) {
        // Revoga o refresh token no servidor (best-effort).
        await authApi.logout(refreshToken).catch(() => undefined);
      }
    } finally {
      await tokenStore.clear();
      await AsyncStorage.removeItem(USER_KEY);
      setUser(null);
      // O QueryClient vive no módulo (dura o processo inteiro), então o cache sobrevivia
      // ao logout: chaves como ['spaces']/['bookings'] são iguais para qualquer conta e o
      // próximo login renderizava os dados do usuário ANTERIOR enquanto o refetch corria.
      // Num produto multi-tenant isso é um flash de dados de outra organização.
      queryClient.clear();
    }
  }, [queryClient]);

  const loadStoredData = useCallback(async () => {
    try {
      const [accessToken, storedUser] = await Promise.all([
        tokenStore.getAccessToken(),
        AsyncStorage.getItem(USER_KEY),
      ]);

      if (accessToken && storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading stored data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStoredData();
    // Se um refresh falhar (sessão expirada), limpa o usuário em memória.
    setOnSessionExpired(() => setUser(null));
    return () => setOnSessionExpired(null);
  }, [loadStoredData]);

  const setAuthData = useCallback(async (data: LoginResponse) => {
    try {
      await tokenStore.setTokens(data.token, data.refreshToken);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setUser(data.user);
    } catch (error) {
      console.error('Error setting auth data:', error);
      throw error;
    }
  }, []);

  const updateUser = useCallback(async (updatedUser: User) => {
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        setAuthData,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

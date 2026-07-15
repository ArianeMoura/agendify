import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import {
  spacing,
  typography,
  borderRadius,
  type ThemeColors,
} from '@/constants/theme';
import { Logo } from '@/components/brand';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { CONTENT_MAX_WIDTH } from '@/lib/theme/useResponsive';
import { authApi } from '@/lib/api/auth';
import { loginSchema, LoginFormData } from '@/lib/schemas/auth';

export default function LoginScreen() {
  const router = useRouter();
  const { setAuthData } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const { mutateAsync: login, isPending } = useMutation({
    mutationFn: authApi.login,
    onSuccess: async (data) => {
      await setAuthData(data);
      router.replace('/(tabs)');
    },
    onError: (error: any) => {
      Alert.alert(
        'Erro ao fazer login',
        error.response?.data?.message ||
          'Verifique suas credenciais e tente novamente.',
      );
    },
  });

  const onSubmit = useCallback(
    async (data: LoginFormData) => {
      await login(data);
    },
    [login],
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.card}>
          <View style={styles.header}>
            <Logo orientation="vertical" iconSize={48} />
            <Text style={styles.subtitle}>Sistema de Reservas de Espaços</Text>
          </View>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email"
                placeholder="seu@email.com"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Senha"
                placeholder="••••••••"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
                secureTextEntry={!showPassword}
                rightIcon={
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={
                      showPassword ? 'Ocultar senha' : 'Mostrar senha'
                    }
                  >
                    <Ionicons
                      name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color={colors.inkMuted}
                    />
                  </Pressable>
                }
              />
            )}
          />

          <Button
            title="Entrar"
            onPress={handleSubmit(onSubmit)}
            isLoading={isPending}
            fullWidth
            style={styles.loginButton}
          />

          <Pressable
            style={styles.registerLink}
            onPress={() => router.push('/(auth)/forgot-password')}
            accessibilityRole="button"
            accessibilityLabel="Recuperar a senha"
          >
            <Text style={styles.registerText}>
              <Text style={styles.registerTextBold}>Esqueci minha senha</Text>
            </Text>
          </Pressable>

          <Pressable
            style={styles.registerLink}
            onPress={() => router.push('/(auth)/accept-invite')}
            accessibilityRole="button"
            accessibilityLabel="Aceitar um convite"
          >
            <Text style={styles.registerText}>
              Recebeu um convite?{' '}
              <Text style={styles.registerTextBold}>Aceitar</Text>
            </Text>
          </Pressable>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: spacing.xl,
      maxWidth: CONTENT_MAX_WIDTH,
      width: '100%',
      alignSelf: 'center',
    },
    // Mesmo desenho do login do admin: card centrado, lockup vertical + subtítulo.
    card: {
      borderRadius: borderRadius.xl,
      padding: spacing.xl,
    },
    header: {
      alignItems: 'center',
      marginBottom: spacing.xl,
      gap: spacing.sm,
    },
    subtitle: {
      ...typography.bodySmall,
      color: colors.textMuted,
    },
    loginButton: {
      marginTop: spacing.md,
    },
    registerLink: {
      marginTop: spacing.lg,
      alignItems: 'center',
      minHeight: 44,
      justifyContent: 'center',
    },
    registerText: {
      ...typography.body,
      color: colors.textMuted,
    },
    registerTextBold: {
      fontWeight: '600',
      color: colors.brandFg,
    },
  });

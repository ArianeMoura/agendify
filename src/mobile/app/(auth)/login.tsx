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
  fontFamily,
  type ThemeColors,
} from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useTheme } from '@/lib/theme/ThemeProvider';
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
        <View style={styles.header}>
          <Text style={styles.brandTitle} accessibilityRole="header">
            Agendify
          </Text>
          <Text style={styles.subtitle}>Sistema de Reservas de Espaços</Text>
        </View>

        <View style={styles.form}>
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
                leftIcon={
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={colors.inkMuted}
                  />
                }
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
                leftIcon={
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={colors.inkMuted}
                  />
                }
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
            onPress={() => router.push('/(auth)/accept-invite')}
            accessibilityRole="button"
            accessibilityLabel="Aceitar um convite"
          >
            <Text style={styles.registerText}>
              Recebeu um convite?{' '}
              <Text style={styles.registerTextBold}>Aceitar</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primary,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: spacing.xl,
    },
    header: {
      alignItems: 'center',
      marginBottom: spacing.xxl,
    },
    brandTitle: {
      fontFamily: fontFamily.displayExtrabold,
      color: colors.onPrimary,
      fontSize: 48,
      fontWeight: '800',
      marginBottom: spacing.sm,
    },
    subtitle: {
      ...typography.body,
      color: colors.onPrimary,
      opacity: 0.9,
    },
    form: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.xl,
      padding: spacing.xl,
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

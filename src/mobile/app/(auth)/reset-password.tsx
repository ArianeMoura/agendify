import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
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
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { CONTENT_MAX_WIDTH } from '@/lib/theme/useResponsive';
import { authApi } from '@/lib/api/auth';
import { resetPasswordSchema, ResetPasswordFormData } from '@/lib/schemas/auth';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [showPassword, setShowPassword] = useState(false);

  // O link do e-mail aponta para o painel web, mas quem já estiver no app pode colar o
  // token aqui — mesmo arranjo do aceite de convite.
  const { token: tokenParam } = useLocalSearchParams<{ token?: string }>();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: tokenParam ?? '',
      password: '',
      confirmPassword: '',
    },
  });

  const { mutateAsync: reset, isPending } = useMutation({
    mutationFn: (data: ResetPasswordFormData) =>
      authApi.resetPassword(data.token, data.password),
    onSuccess: () => {
      Alert.alert('Senha alterada', 'Entre com a sua nova senha.');
      router.replace('/(auth)/login');
    },
    onError: (error: any) => {
      Alert.alert(
        'Não foi possível redefinir',
        error.response?.data?.message ||
          'Link inválido ou expirado. Peça um novo.',
      );
    },
  });

  const onSubmit = useCallback(
    async (data: ResetPasswordFormData) => {
      await reset(data);
    },
    [reset],
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
          <Text style={styles.brandTitle}>Agendify</Text>
          <Text style={styles.subtitle}>Criar nova senha</Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="token"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Token"
                placeholder="Cole o token recebido por e-mail"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.token?.message}
                autoCapitalize="none"
                autoCorrect={false}
                leftIcon={
                  <Ionicons
                    name="key-outline"
                    size={20}
                    color={colors.textSecondary}
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
                label="Nova senha"
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
                    color={colors.textSecondary}
                  />
                }
                rightIcon={
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                }
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Confirme a nova senha"
                placeholder="••••••••"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.confirmPassword?.message}
                secureTextEntry={!showPassword}
                leftIcon={
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={colors.textSecondary}
                  />
                }
              />
            )}
          />

          <Button
            title="Salvar nova senha"
            onPress={handleSubmit(onSubmit)}
            isLoading={isPending}
            fullWidth
            style={styles.submitButton}
          />

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => router.replace('/(auth)/login')}
          >
            <Text style={styles.loginText}>
              Lembrou a senha? <Text style={styles.loginTextBold}>Entrar</Text>
            </Text>
          </TouchableOpacity>
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
      maxWidth: CONTENT_MAX_WIDTH,
      width: '100%',
      alignSelf: 'center',
    },
    header: {
      alignItems: 'center',
      marginBottom: spacing.xxl,
    },
    brandTitle: {
      color: colors.white,
      fontSize: 48,
      fontWeight: '700',
      marginBottom: spacing.sm,
    },
    subtitle: {
      ...typography.body,
      color: colors.white,
      opacity: 0.9,
    },
    form: {
      backgroundColor: colors.white,
      borderRadius: borderRadius.xl,
      padding: spacing.xl,
    },
    submitButton: {
      marginTop: spacing.md,
    },
    loginLink: {
      marginTop: spacing.lg,
      alignItems: 'center',
    },
    loginText: {
      ...typography.body,
      color: colors.textSecondary,
    },
    loginTextBold: {
      fontWeight: '600',
      color: colors.primary,
    },
  });

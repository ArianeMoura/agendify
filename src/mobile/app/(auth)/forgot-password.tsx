import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
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
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { CONTENT_MAX_WIDTH } from '@/lib/theme/useResponsive';
import { authApi } from '@/lib/api/auth';
import {
  forgotPasswordSchema,
  ForgotPasswordFormData,
} from '@/lib/schemas/auth';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [sent, setSent] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const { mutateAsync: request, isPending } = useMutation({
    mutationFn: (data: ForgotPasswordFormData) =>
      authApi.forgotPassword(data.email),
    // Sucesso e erro levam à mesma tela: a API não distingue e-mail cadastrado de
    // desconhecido, e a interface não deve distinguir também.
    onSettled: () => setSent(true),
  });

  const onSubmit = useCallback(
    async (data: ForgotPasswordFormData) => {
      await request(data).catch(() => undefined);
    },
    [request],
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
          <Text style={styles.subtitle}>Recuperar acesso</Text>
        </View>

        <View style={styles.form}>
          {sent ? (
            <>
              <Text style={styles.sentTitle}>Verifique seu e-mail</Text>
              <Text style={styles.sentText}>
                Se houver uma conta com esse e-mail, enviamos um link para
                redefinir a senha. O link vale por 30 minutos.
              </Text>
              <Button
                title="Já tenho o token"
                onPress={() => router.replace('/(auth)/reset-password')}
                fullWidth
                style={styles.submitButton}
              />
            </>
          ) : (
            <>
              <Text style={styles.sentText}>
                Informe o e-mail da sua conta e enviaremos um link para criar
                uma nova senha.
              </Text>

              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Email"
                    placeholder="voce@exemplo.com.br"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.email?.message}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    leftIcon={
                      <Ionicons
                        name="mail-outline"
                        size={20}
                        color={colors.textSecondary}
                      />
                    }
                  />
                )}
              />

              <Button
                title="Enviar link"
                onPress={handleSubmit(onSubmit)}
                isLoading={isPending}
                fullWidth
                style={styles.submitButton}
              />
            </>
          )}

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
    sentTitle: {
      ...typography.h3,
      color: colors.text,
      marginBottom: spacing.sm,
    },
    sentText: {
      ...typography.body,
      color: colors.textSecondary,
      marginBottom: spacing.md,
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

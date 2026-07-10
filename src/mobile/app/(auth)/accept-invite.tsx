import React, { useCallback, useState } from 'react';
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
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/lib/contexts/AuthContext';
import { authApi } from '@/lib/api/auth';
import { acceptInviteSchema, AcceptInviteFormData } from '@/lib/schemas/auth';

export default function AcceptInviteScreen() {
  const router = useRouter();
  const { setAuthData } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  // O token pode vir de um deep link (agendify://accept-invite?token=...) ou ser colado.
  const { token: tokenParam } = useLocalSearchParams<{ token?: string }>();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AcceptInviteFormData>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: {
      token: tokenParam ?? '',
      name: '',
      password: '',
    },
  });

  // Aceita o convite e, em seguida, faz login com o e-mail retornado + a senha
  // escolhida (o accept não devolve tokens).
  const { mutateAsync: accept, isPending } = useMutation({
    mutationFn: async (data: AcceptInviteFormData) => {
      const account = await authApi.acceptInvitation(data);
      return authApi.login({ email: account.email, password: data.password });
    },
    onSuccess: async (loginData) => {
      await setAuthData(loginData);
      router.replace('/(tabs)');
    },
    onError: (error: any) => {
      Alert.alert(
        'Erro ao aceitar convite',
        error.response?.data?.message || 'Convite inválido ou expirado.',
      );
    },
  });

  const onSubmit = useCallback(
    async (data: AcceptInviteFormData) => {
      await accept(data);
    },
    [accept],
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
          <Text style={styles.subtitle}>Aceitar convite</Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="token"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Token do convite"
                placeholder="Cole o token recebido"
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
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Seu nome"
                placeholder="Como você se chama"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.name?.message}
                leftIcon={
                  <Ionicons
                    name="person-outline"
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
                label="Defina uma senha"
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

          <Button
            title="Aceitar e entrar"
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
              Já tem conta? <Text style={styles.loginTextBold}>Entrar</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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

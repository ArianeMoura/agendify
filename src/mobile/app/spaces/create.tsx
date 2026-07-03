import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { ImagePicker } from '@/components/ui/ImagePicker';
import { spacesApi } from '@/lib/api/spaces';
import { spaceSchema, SpaceFormData } from '@/lib/schemas/space';

export default function CreateSpaceScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [imageUri, setImageUri] = useState<string>('');
  const [selectedHours, setSelectedHours] = useState<string[]>([]);

  const allAvailableHours = Array.from({ length: 15 }, (_, i) => {
    const hour = i + 8;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SpaceFormData>({
    resolver: zodResolver(spaceSchema),
    defaultValues: {
      name: '',
      description: '',
      capacity: '',
      availability: true,
      isAllDayBooking: false,
      allDayStartTime: '11:00',
      allDayEndTime: '22:00',
      availableHours: [],
    },
  });

  const isAllDayBooking = watch('isAllDayBooking');

  const toggleHour = useCallback((hour: string) => {
    setSelectedHours((prev) => {
      const newHours = prev.includes(hour)
        ? prev.filter((h) => h !== hour)
        : [...prev, hour].sort();
      setValue('availableHours', newHours);
      return newHours;
    });
  }, [setValue]);

  const createMutation = useMutation({
    mutationFn: spacesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      Alert.alert('Sucesso', 'Espaço criado com sucesso!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    },
    onError: (error: any) => {
      Alert.alert(
        'Erro',
        error.response?.data?.message || 'Não foi possível criar o espaço.'
      );
    },
  });

  const onSubmit = useCallback((data: SpaceFormData) => {
    createMutation.mutate({
      name: data.name,
      description: data.description,
      capacity: Number(data.capacity),
      resources: [],
      availableHours: data.availableHours || [],
      availability: data.availability,
      isAllDayBooking: data.isAllDayBooking,
      allDayStartTime: data.allDayStartTime,
      allDayEndTime: data.allDayEndTime,
      imageUri: imageUri || undefined,
    });
  }, [imageUri, createMutation]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card>
          <Text style={styles.title}>Novo Espaço</Text>

          <ImagePicker
            imageUri={imageUri}
            onImageSelect={setImageUri}
            label="Imagem do Espaço"
          />

          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Nome *"
                placeholder="Nome do espaço"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.name?.message}
                leftIcon={
                  <Ionicons name="business-outline" size={20} color={colors.textSecondary} />
                }
              />
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Descrição"
                placeholder="Descrição do espaço"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.description?.message}
                multiline
                numberOfLines={3}
                leftIcon={
                  <Ionicons name="document-text-outline" size={20} color={colors.textSecondary} />
                }
              />
            )}
          />

          <Controller
            control={control}
            name="capacity"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Capacidade *"
                placeholder="Número de pessoas"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.capacity?.message}
                keyboardType="numeric"
                leftIcon={
                  <Ionicons name="people-outline" size={20} color={colors.textSecondary} />
                }
              />
            )}
          />

          <View style={styles.switchContainer}>
            <View style={styles.switchLabel}>
              <Ionicons name="checkmark-circle-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.label}>Disponível</Text>
            </View>
            <Controller
              control={control}
              name="availability"
              render={({ field: { onChange, value } }) => (
                <Switch
                  value={value}
                  onValueChange={onChange}
                  trackColor={{ false: colors.border, true: colors.primary + '60' }}
                  thumbColor={value ? colors.primary : colors.gray}
                />
              )}
            />
          </View>

          <View style={styles.switchContainer}>
            <View style={styles.switchLabel}>
              <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
              <View>
                <Text style={styles.label}>Reserva de dia inteiro</Text>
                <Text style={styles.sublabel}>Ex: Salão de festas</Text>
              </View>
            </View>
            <Controller
              control={control}
              name="isAllDayBooking"
              render={({ field: { onChange, value } }) => (
                <Switch
                  value={value}
                  onValueChange={onChange}
                  trackColor={{ false: colors.border, true: colors.accent + '60' }}
                  thumbColor={value ? colors.accent : colors.gray}
                />
              )}
            />
          </View>

          {isAllDayBooking && (
            <View style={styles.allDayTimesContainer}>
              <Text style={styles.sectionTitle}>Horários do Dia Inteiro</Text>
              
              <Controller
                control={control}
                name="allDayStartTime"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Horário de Início"
                    placeholder="11:00"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.allDayStartTime?.message}
                    leftIcon={
                      <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
                    }
                  />
                )}
              />

              <Controller
                control={control}
                name="allDayEndTime"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Horário de Término"
                    placeholder="22:00"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.allDayEndTime?.message}
                    leftIcon={
                      <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
                    }
                  />
                )}
              />

              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={18} color={colors.accent} />
                <Text style={styles.infoText}>
                  Use o formato HH:MM (ex: 11:00, 22:00).
                </Text>
              </View>
            </View>
          )}

          {!isAllDayBooking && (
            <View style={styles.hourlyBookingContainer}>
              <Text style={styles.sectionTitle}>Horários Disponíveis</Text>
              <Text style={styles.sectionSubtitle}>
                Selecione os horários em que o espaço estará disponível
              </Text>
              
              <View style={styles.hoursGrid}>
                {allAvailableHours.map((hour) => {
                  const isSelected = selectedHours.includes(hour);
                  return (
                    <TouchableOpacity
                      key={hour}
                      style={[
                        styles.hourCheckbox,
                        isSelected && styles.hourCheckboxSelected,
                      ]}
                      onPress={() => toggleHour(hour)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          isSelected && styles.checkboxSelected,
                        ]}
                      >
                        {isSelected && (
                          <Ionicons name="checkmark" size={16} color={colors.white} />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.hourText,
                          isSelected && styles.hourTextSelected,
                        ]}
                      >
                        {hour}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={18} color={colors.accent} />
                <Text style={styles.infoText}>
                  Selecione todos os horários em que o espaço estará disponível para reservas.
                </Text>
              </View>
            </View>
          )}

          <View style={styles.buttonRow}>
            <Button
              title="Cancelar"
              variant="outline"
              onPress={() => router.back()}
              style={styles.button}
            />
            <Button
              title="Criar Espaço"
              onPress={handleSubmit(onSubmit)}
              isLoading={createMutation.isPending}
              style={styles.button}
            />
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xl,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingVertical: spacing.sm,
  },
  switchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  label: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  sublabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    ...typography.h5,
    color: colors.text,
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  sectionSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  allDayTimesContainer: {
    marginBottom: spacing.lg,
  },
  hourlyBookingContainer: {
    marginBottom: spacing.lg,
  },
  hoursGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  hourCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    minWidth: 100,
  },
  hourCheckboxSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  hourText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  hourTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.accent + '10',
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.accent + '30',
    marginTop: spacing.sm,
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.text,
    flex: 1,
    lineHeight: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  button: {
    flex: 1,
  },
});


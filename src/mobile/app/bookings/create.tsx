import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { DatePickerPopover } from '@/components/ui/DatePickerPopover';
import { TimeSlotPicker } from '@/components/ui/TimeSlotPicker';
import { spacesApi } from '@/lib/api/spaces';
import { bookingsApi } from '@/lib/api/bookings';
import { getImageUrl } from '@/lib/api/config';
import { format, set as setDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/lib/contexts/AuthContext';
import { SpaceAvailability } from '@/lib/types';

export default function CreateBookingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [showDatePopover, setShowDatePopover] = useState(false);
  const [selectedSpaceId] = useState<string>((params.spaceId as string) || '');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  const [availability, setAvailability] = useState<SpaceAvailability | null>(
    null,
  );
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);

  const {
    data: spaces,
    isLoading: spacesLoading,
    error: spacesError,
  } = useQuery({
    queryKey: ['spaces'],
    queryFn: spacesApi.getAll,
  });

  const selectedSpace = useMemo(
    () => spaces?.find((s) => s.id === selectedSpaceId),
    [spaces, selectedSpaceId],
  );

  const fetchAvailability = useCallback(async () => {
    if (!selectedSpaceId || !selectedDate) return;

    setIsLoadingAvailability(true);
    setAvailability(null);
    setSelectedTimeSlots([]);

    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const availabilityData = await spacesApi.getAvailability(
        selectedSpaceId,
        dateStr,
        timezone,
      );
      setAvailability(availabilityData);
    } catch (error: any) {
      Alert.alert(
        'Erro',
        error.response?.data?.message ||
          'Não foi possível carregar os horários disponíveis.',
      );
    } finally {
      setIsLoadingAvailability(false);
    }
  }, [selectedSpaceId, selectedDate]);

  useEffect(() => {
    fetchAvailability();
  }, [selectedSpaceId, selectedDate, fetchAvailability]);

  const createMutation = useMutation({
    mutationFn: bookingsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      Alert.alert('Sucesso', 'Reserva criada com sucesso!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    },
    onError: (error: any) => {
      Alert.alert(
        'Erro',
        error.response?.data?.message || 'Não foi possível criar a reserva.',
      );
    },
  });

  const handleTimeSlotSelect = (startTime: string) => {
    if (selectedSpace?.isAllDayBooking) {
      setSelectedTimeSlots([startTime]);
    } else {
      setSelectedTimeSlots((prev) => {
        if (prev.includes(startTime)) {
          return prev.filter((t) => t !== startTime);
        } else {
          return [...prev, startTime].sort();
        }
      });
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Erro', 'Você precisa estar logado para fazer uma reserva.');
      return;
    }

    if (!selectedSpaceId) {
      Alert.alert('Erro', 'Selecione um espaço.');
      return;
    }

    if (selectedTimeSlots.length === 0) {
      Alert.alert('Erro', 'Selecione pelo menos um horário.');
      return;
    }

    const sortedSlots = [...selectedTimeSlots].sort();
    const firstSlot = sortedSlots[0];
    const lastSlot = sortedSlots[sortedSlots.length - 1];

    const [startHour, startMinute] = firstSlot.split(':').map(Number);

    let endHour: number, endMinute: number;
    if (selectedSpace?.isAllDayBooking && selectedSpace.allDayEndTime) {
      [endHour, endMinute] = selectedSpace.allDayEndTime.split(':').map(Number);
    } else {
      const [lastHour, lastMinute] = lastSlot.split(':').map(Number);
      endHour = lastHour + 1;
      endMinute = lastMinute;
    }

    const startDateTime = setDate(selectedDate, {
      hours: startHour,
      minutes: startMinute,
      seconds: 0,
      milliseconds: 0,
    });

    const endDateTime = setDate(selectedDate, {
      hours: endHour,
      minutes: endMinute,
      seconds: 0,
      milliseconds: 0,
    });

    await createMutation.mutateAsync({
      UserId: user.id,
      SpaceId: selectedSpaceId,
      StartDateTime: startDateTime.toISOString(),
      EndDateTime: endDateTime.toISOString(),
    });
  };

  if (spacesLoading) {
    return <Loading message="Carregando espaços..." />;
  }

  if (spacesError) {
    return (
      <View style={styles.container}>
        <Card>
          <Text style={styles.errorText}>
            Erro ao carregar espaços:{' '}
            {(spacesError as any)?.message || 'Erro desconhecido'}
          </Text>
          <Button title="Tentar novamente" onPress={() => router.back()} />
        </Card>
      </View>
    );
  }

  if (!spaces || spaces.length === 0) {
    return (
      <View style={styles.container}>
        <Card>
          <Text style={styles.title}>Nenhum espaço disponível</Text>
          <Text style={styles.label}>
            Não há espaços cadastrados no momento. Entre em contato com o
            administrador.
          </Text>
          <Button
            title="Voltar"
            onPress={() => router.back()}
            style={{ marginTop: spacing.lg }}
          />
        </Card>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card>
          {selectedSpace && (
            <Card variant="outlined" style={styles.spacePreview}>
              {selectedSpace.imageUrl && (
                <Image
                  source={{ uri: getImageUrl(selectedSpace.imageUrl) }}
                  style={styles.spaceImage}
                  resizeMode="cover"
                />
              )}
              <View style={styles.spacePreviewContent}>
                <Text style={styles.spacePreviewTitle}>
                  {selectedSpace.name}
                </Text>
                {selectedSpace.description && (
                  <Text style={styles.spacePreviewDesc}>
                    {selectedSpace.description}
                  </Text>
                )}
                <View style={styles.spacePreviewRow}>
                  <Ionicons
                    name="people-outline"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.spacePreviewText}>
                    Capacidade: {selectedSpace.capacity} pessoas
                  </Text>
                </View>
                {selectedSpace.isAllDayBooking && (
                  <View style={styles.allDayBadge}>
                    <Ionicons name="calendar" size={14} color={colors.accent} />
                    <Text style={styles.allDayBadgeText}>
                      Reserva de dia inteiro
                    </Text>
                  </View>
                )}
              </View>
            </Card>
          )}

          {selectedSpaceId && (
            <View style={styles.dateSection}>
              <Text style={styles.sectionTitle}>📅 Data da Reserva</Text>
              <Pressable
                style={({ pressed }) => [
                  styles.dateButton,
                  pressed && styles.dateButtonPressed,
                ]}
                onPress={() => setShowDatePopover(true)}
              >
                <View style={styles.dateButtonContent}>
                  <View style={styles.dateIconContainer}>
                    <Ionicons
                      name="calendar"
                      size={24}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.dateTextContainer}>
                    <Text style={styles.dateLabel}>Data selecionada</Text>
                    <Text style={styles.dateValue}>
                      {format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", {
                        locale: ptBR,
                      })}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.textSecondary}
                  />
                </View>
              </Pressable>
            </View>
          )}

          {selectedSpaceId && !isLoadingAvailability && availability && (
            <TimeSlotPicker
              timeSlots={availability.timeSlots}
              selectedSlots={selectedTimeSlots}
              onSelectSlot={handleTimeSlotSelect}
              isAllDayBooking={availability.isAllDayBooking}
              allDayStartTime={availability.allDayStartTime}
              allDayEndTime={availability.allDayEndTime}
              isUser={false}
            />
          )}

          {isLoadingAvailability && (
            <View style={styles.loadingContainer}>
              <Loading message="Carregando horários..." />
            </View>
          )}

          <Card variant="outlined" style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>💡 Dicas</Text>
            <Text style={styles.tipsText}>
              • Selecione um espaço e data para ver os horários
            </Text>
            <Text style={styles.tipsText}>
              • <Text style={styles.tipsBold}>Espaços de dia inteiro:</Text>{' '}
              Podem ser reservados mesmo se o horário de início já passou
            </Text>
            <Text style={styles.tipsText}>
              • <Text style={styles.tipsBold}>Espaços por hora:</Text> Horários
              passados não podem ser reservados
            </Text>
            <Text style={styles.tipsText}>
              • Você pode selecionar múltiplos horários consecutivos
            </Text>
          </Card>

          <View style={styles.buttonRow}>
            <Button
              title="Cancelar"
              variant="outline"
              onPress={() => router.back()}
              style={styles.button}
            />
            <Button
              title="Criar Reserva"
              onPress={handleSubmit}
              isLoading={createMutation.isPending}
              disabled={selectedTimeSlots.length === 0}
              style={styles.button}
            />
          </View>
        </Card>
      </ScrollView>

      <DatePickerPopover
        visible={showDatePopover}
        value={selectedDate}
        mode="date"
        minimumDate={new Date()}
        title="Selecionar Data"
        onConfirm={(date) => {
          setSelectedDate(date);
          setShowDatePopover(false);
        }}
        onDismiss={() => setShowDatePopover(false)}
      />
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
  errorText: {
    ...typography.body,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  formGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  spacesScroll: {
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  spaceCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.md,
    marginRight: spacing.sm,
    minWidth: 140,
  },
  spaceCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  spaceCardName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  spaceCardCapacity: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  spacePreview: {
    marginBottom: spacing.lg,
    overflow: 'hidden',
    padding: 0,
  },
  spaceImage: {
    width: '100%',
    height: 180,
    backgroundColor: colors.lightGray,
  },
  spacePreviewContent: {
    padding: spacing.md,
  },
  spacePreviewTitle: {
    ...typography.h5,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  spacePreviewDesc: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  spacePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  spacePreviewText: {
    ...typography.bodySmall,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  allDayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accent + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  allDayBadgeText: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '600',
  },
  dateSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h5,
    color: colors.text,
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  dateButton: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dateButtonPressed: {
    backgroundColor: colors.lightGray,
    borderColor: colors.primary,
  },
  dateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dateIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateTextContainer: {
    flex: 1,
  },
  dateLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 2,
    fontWeight: '500',
  },
  dateValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    fontSize: 16,
  },
  loadingContainer: {
    paddingVertical: spacing.xl,
  },
  tipsCard: {
    backgroundColor: colors.accent + '10',
    borderColor: colors.accent + '30',
    marginBottom: spacing.lg,
  },
  tipsTitle: {
    ...typography.h5,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  tipsText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    lineHeight: 18,
  },
  tipsBold: {
    fontWeight: '600',
    color: colors.text,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  button: {
    flex: 1,
  },
});

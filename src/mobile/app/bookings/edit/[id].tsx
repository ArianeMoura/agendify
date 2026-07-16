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
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import {
  spacing,
  typography,
  borderRadius,
  type ThemeColors,
} from '@/constants/theme';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { CONTENT_MAX_WIDTH } from '@/lib/theme/useResponsive';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { DatePickerPopover } from '@/components/ui/DatePickerPopover';
import { TimeSlotPicker } from '@/components/ui/TimeSlotPicker';
import { spacesApi } from '@/lib/api/spaces';
import { bookingsApi } from '@/lib/api/bookings';
import { getImageUrl } from '@/lib/api/config';
import { format, isSameDay, set as setDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/lib/contexts/AuthContext';
import { SpaceAvailability, TimeSlot } from '@/lib/types';

export default function EditBookingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [showDatePopover, setShowDatePopover] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  const [availability, setAvailability] = useState<SpaceAvailability | null>(
    null,
  );
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);

  const { data: booking, isLoading: bookingLoading } = useQuery({
    queryKey: ['bookings', id],
    queryFn: async () => {
      const booking = await bookingsApi.getById(id as string);

      const startDate = new Date(booking.startDateTime);
      const endDate = new Date(booking.endDateTime);
      setSelectedDate(startDate);

      const slots: string[] = [];
      const current = new Date(startDate);

      while (current < endDate) {
        slots.push(format(current, 'HH:mm'));
        current.setHours(current.getHours() + 1);
      }

      setSelectedTimeSlots(slots);

      return booking;
    },
    enabled: !!id,
  });

  const { data: spaces, isLoading: spacesLoading } = useQuery({
    queryKey: ['spaces'],
    queryFn: spacesApi.getAll,
  });

  const selectedSpace = useMemo(
    () => spaces?.find((s) => s.id === booking?.spaceId),
    [spaces, booking?.spaceId],
  );

  const fetchAvailability = useCallback(async () => {
    if (!booking?.spaceId || !selectedDate) return;

    setIsLoadingAvailability(true);
    setAvailability(null);

    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const availabilityData = await spacesApi.getAvailability(
        booking.spaceId,
        dateStr,
        timezone,
      );
      // Os slots da PRÓPRIA reserva não podem aparecer como ocupados — senão, ao editar,
      // o usuário não conseguiria manter o horário que já é dele (trocar só o espaço, p.ex.).
      // É só isso que precisa ser reescrito: o isBooked dos DEMAIS já vem correto da API.
      // (Antes: `id === booking.id ? false : slot.isAvailable` — como `booking` é buscado
      // POR `id`, a condição era sempre verdadeira e zerava o isBooked de TODO mundo,
      // mostrando como livre o horário já reservado por outra pessoa. O usuário só
      // descobria no submit, com um 409 sem explicação.)
      const ownSlots = new Set<string>();
      const bookingStart = new Date(booking.startDateTime);
      const bookingEnd = new Date(booking.endDateTime);
      if (isSameDay(bookingStart, selectedDate)) {
        const cursor = new Date(bookingStart);
        while (cursor < bookingEnd) {
          ownSlots.add(format(cursor, 'HH:mm'));
          cursor.setHours(cursor.getHours() + 1);
        }
      }

      setAvailability({
        ...availabilityData,
        timeSlots: availabilityData.timeSlots.map((slot: TimeSlot) => ({
          ...slot,
          isBooked: slot.isBooked && !ownSlots.has(slot.startTime),
        })),
      });
    } catch (error: any) {
      Alert.alert(
        'Erro',
        error.response?.data?.message ||
          'Não foi possível carregar os horários disponíveis.',
      );
    } finally {
      setIsLoadingAvailability(false);
    }
  }, [booking?.spaceId, booking?.id, id, selectedDate]);

  useEffect(() => {
    if (booking) {
      fetchAvailability();
    }
  }, [booking, selectedDate, fetchAvailability]);

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; booking: any }) =>
      bookingsApi.update(data.id, data.booking),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      Alert.alert('Sucesso', 'Reserva atualizada com sucesso!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    },
    onError: (error: any) => {
      Alert.alert(
        'Erro',
        error.response?.data?.message ||
          'Não foi possível atualizar a reserva.',
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
      Alert.alert('Erro', 'Você precisa estar logado para editar uma reserva.');
      return;
    }

    if (!booking?.spaceId) {
      Alert.alert('Erro', 'Espaço não encontrado.');
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

    await updateMutation.mutateAsync({
      id: id as string,
      booking: {
        UserId: user.id,
        SpaceId: booking.spaceId,
        StartDateTime: startDateTime.toISOString(),
        EndDateTime: endDateTime.toISOString(),
      },
    });
  };

  if (bookingLoading || spacesLoading) {
    return <Loading message="Carregando..." />;
  }

  if (!booking) {
    return (
      <View style={styles.container}>
        <Card>
          <Text style={styles.errorText}>Reserva não encontrada.</Text>
          <Button title="Voltar" onPress={() => router.back()} />
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
                  contentFit="cover"
                  transition={200}
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

          {booking?.spaceId && (
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

          {booking?.spaceId && !isLoadingAvailability && availability && (
            <TimeSlotPicker
              timeSlots={availability.timeSlots}
              selectedSlots={selectedTimeSlots}
              onSelectSlot={handleTimeSlotSelect}
              isAllDayBooking={availability.isAllDayBooking}
              allDayStartTime={selectedSpace?.allDayStartTime}
              allDayEndTime={selectedSpace?.allDayEndTime}
              isUser={false}
            />
          )}

          {isLoadingAvailability && (
            <View style={styles.loadingContainer}>
              <Loading message="Carregando horários..." />
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
              title="Salvar Alterações"
              onPress={handleSubmit}
              isLoading={updateMutation.isPending}
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

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: spacing.lg,
      maxWidth: CONTENT_MAX_WIDTH,
      width: '100%',
      alignSelf: 'center',
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
    spacePreview: {
      marginBottom: spacing.lg,
      overflow: 'hidden',
      padding: 0,
    },
    spaceImage: {
      width: '100%',
      aspectRatio: 16 / 9,
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
    buttonRow: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    button: {
      flex: 1,
    },
  });

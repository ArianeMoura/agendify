import { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  spacing,
  typography,
  borderRadius,
  type ThemeColors,
} from '@/constants/theme';
import { useTheme } from '@/lib/theme/ThemeProvider';
import type { TimeSlot } from '@/lib/types';
import { Badge } from './Badge';

interface TimeSlotPickerProps {
  timeSlots: TimeSlot[];
  selectedSlots: string[];
  onSelectSlot: (startTime: string) => void;
  isAllDayBooking?: boolean;
  allDayStartTime?: string;
  allDayEndTime?: string;
  isUser?: boolean;
}

export function TimeSlotPicker({
  timeSlots,
  selectedSlots,
  onSelectSlot,
  isAllDayBooking = false,
  allDayStartTime,
  allDayEndTime,
  isUser = true,
}: TimeSlotPickerProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (timeSlots.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="calendar-outline"
          size={48}
          color={colors.inkMuted}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
        <Text style={styles.emptyText}>
          {isAllDayBooking
            ? 'Este espaço não possui horários configurados para reservas de dia inteiro.'
            : 'Nenhum horário disponível para este espaço.'}
        </Text>
      </View>
    );
  }

  if (isAllDayBooking && timeSlots.length === 1) {
    const slot = timeSlots[0];
    const isSelected = selectedSlots.includes(slot.startTime);
    const isDisabled = slot.isPast || slot.isBooked;

    return (
      <View style={styles.container}>
        <View style={styles.allDayHeader}>
          <Ionicons
            name="calendar"
            size={20}
            color={colors.brandFg}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          <Text style={styles.allDayTitle}>Reserva de Dia Inteiro</Text>
        </View>

        <Text style={styles.allDayInfo}>
          Disponível de {allDayStartTime} até {allDayEndTime}
        </Text>

        <SlotRow
          styles={styles}
          colors={colors}
          slot={slot}
          isSelected={isSelected}
          isDisabled={isDisabled}
          subtitle="Dia inteiro"
          onPress={() => onSelectSlot(slot.startTime)}
        />

        <View style={styles.tipContainer}>
          <Ionicons
            name="information-circle"
            size={16}
            color={colors.action}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          <Text style={styles.tipText}>
            Este espaço é reservado por dia inteiro. Você pode fazer a reserva
            mesmo se o horário de início já passou, desde que o horário de
            término ainda não tenha chegado.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle} accessibilityRole="header">
          Horários Disponíveis
        </Text>
        <Text style={styles.headerSubtitle}>
          Selecione os horários que deseja reservar
        </Text>
      </View>

      <ScrollView
        style={styles.slotsList}
        contentContainerStyle={styles.slotsListContent}
        showsVerticalScrollIndicator={false}
      >
        {timeSlots.map((slot) => {
          const isSelected = selectedSlots.includes(slot.startTime);
          const isDisabled = (slot.isPast || slot.isBooked) && !isUser;
          return (
            <SlotRow
              key={slot.startTime}
              styles={styles}
              colors={colors}
              slot={slot}
              isSelected={isSelected}
              isDisabled={isDisabled}
              subtitle="1 hora"
              onPress={() => !isDisabled && onSelectSlot(slot.startTime)}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

function SlotRow({
  styles,
  colors,
  slot,
  isSelected,
  isDisabled,
  subtitle,
  onPress,
}: {
  styles: ReturnType<typeof createStyles>;
  colors: ThemeColors;
  slot: TimeSlot;
  isSelected: boolean;
  isDisabled: boolean;
  subtitle: string;
  onPress: () => void;
}) {
  const statusLabel = slot.isPast
    ? 'Indisponível'
    : slot.isBooked
      ? 'Reservado'
      : undefined;
  const range = `${slot.startTime} às ${slot.endTime}`;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isSelected, disabled: isDisabled }}
      accessibilityLabel={statusLabel ? `${range}, ${statusLabel}` : range}
      style={[
        styles.slot,
        isSelected && styles.slotSelected,
        isDisabled && styles.slotDisabled,
      ]}
    >
      <View style={styles.slotContent}>
        <View style={styles.slotLeft}>
          <View
            style={[
              styles.checkbox,
              isSelected && styles.checkboxSelected,
              isDisabled && styles.checkboxDisabled,
            ]}
          >
            {isSelected ? (
              <Ionicons name="checkmark" size={18} color={colors.onPrimary} />
            ) : null}
          </View>
          <View>
            <Text
              style={[styles.slotTime, isDisabled && styles.slotTimeDisabled]}
            >
              {range}
            </Text>
            <Text style={styles.slotDuration}>{subtitle}</Text>
          </View>
        </View>
        {statusLabel ? (
          <Badge
            label={statusLabel}
            tone={slot.isBooked ? 'danger' : 'neutral'}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      marginVertical: spacing.md,
    },
    header: {
      marginBottom: spacing.md,
    },
    headerTitle: {
      ...typography.h5,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    headerSubtitle: {
      ...typography.bodySmall,
      color: colors.textMuted,
    },
    slotsList: {
      maxHeight: 400,
    },
    slotsListContent: {
      gap: spacing.sm,
    },
    slot: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      borderWidth: 2,
      borderColor: colors.line,
      padding: spacing.md,
      minHeight: 44,
    },
    slotSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.surfaceMuted,
    },
    slotDisabled: {
      backgroundColor: colors.surfaceMuted,
      opacity: 0.6,
    },
    slotContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    slotLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      flex: 1,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: borderRadius.sm,
      borderWidth: 2,
      borderColor: colors.line,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    checkboxSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    checkboxDisabled: {
      backgroundColor: colors.surfaceMuted,
      borderColor: colors.inkMuted,
    },
    slotTime: {
      ...typography.body,
      fontWeight: '600',
      color: colors.text,
    },
    slotTimeDisabled: {
      color: colors.textMuted,
    },
    slotDuration: {
      ...typography.caption,
      color: colors.textMuted,
    },
    tipContainer: {
      flexDirection: 'row',
      gap: spacing.sm,
      backgroundColor: colors.surfaceMuted,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      marginTop: spacing.md,
      borderWidth: 1,
      borderColor: colors.line,
    },
    tipText: {
      ...typography.bodySmall,
      color: colors.text,
      flex: 1,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
      backgroundColor: colors.surfaceMuted,
      borderRadius: borderRadius.lg,
      marginVertical: spacing.md,
    },
    emptyText: {
      ...typography.body,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: spacing.md,
    },
    allDayHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    allDayTitle: {
      ...typography.h5,
      color: colors.text,
      fontWeight: '600',
    },
    allDayInfo: {
      ...typography.body,
      color: colors.textMuted,
      marginBottom: spacing.md,
    },
  });

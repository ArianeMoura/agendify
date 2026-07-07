import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { TimeSlot } from '@/lib/types';

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
  if (timeSlots.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="calendar-outline" size={48} color={colors.textSecondary} />
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
          <Ionicons name="calendar" size={20} color={colors.primary} />
          <Text style={styles.allDayTitle}>Reserva de Dia Inteiro</Text>
        </View>
        
        <Text style={styles.allDayInfo}>
          Disponível de {allDayStartTime} até {allDayEndTime}
        </Text>

        <TouchableOpacity
          style={[
            styles.allDaySlot,
            isSelected && styles.slotSelected,
            isDisabled && styles.slotDisabled,
          ]}
          onPress={() => onSelectSlot(slot.startTime)}
          activeOpacity={0.7}
        >
          <View style={styles.allDaySlotContent}>
            <View style={styles.allDaySlotLeft}>
              <View
                style={[
                  styles.checkbox,
                  isSelected && styles.checkboxSelected,
                  isDisabled && styles.checkboxDisabled,
                ]}
              >
                {isSelected && (
                  <Ionicons name="checkmark" size={18} color={colors.white} />
                )}
              </View>
              <View>
                <Text style={styles.allDaySlotTime}>
                  {slot.startTime} - {slot.endTime}
                </Text>
                <Text style={styles.allDaySlotSubtext}>Dia inteiro</Text>
              </View>
            </View>
            
            {isDisabled && (
              <View
                style={[
                  styles.badge,
                  slot.isPast ? styles.badgePast : styles.badgeBooked,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    slot.isPast ? styles.badgeTextPast : styles.badgeTextBooked,
                  ]}
                >
                  {slot.isPast ? 'Indisponível' : 'Reservado'}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.tipContainer}>
          <Ionicons name="information-circle" size={16} color={colors.accent} />
          <Text style={styles.tipText}>
            Este espaço é reservado por dia inteiro. Você pode fazer a reserva mesmo se o horário
            de início já passou, desde que o horário de término ainda não tenha chegado.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Horários Disponíveis</Text>
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
            <TouchableOpacity
              key={slot.startTime}
              style={[
                styles.slot,
                isSelected && styles.slotSelected,
                isDisabled && styles.slotDisabled,
              ]}
              onPress={() => !isDisabled && onSelectSlot(slot.startTime)}
              disabled={isDisabled}
              activeOpacity={0.7}
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
                    {isSelected && (
                      <Ionicons name="checkmark" size={18} color={colors.white} />
                    )}
                  </View>
                  <View>
                    <Text
                      style={[
                        styles.slotTime,
                        isDisabled && styles.slotTimeDisabled,
                      ]}
                    >
                      {slot.startTime} - {slot.endTime}
                    </Text>
                    <Text style={styles.slotDuration}>1 hora</Text>
                  </View>
                </View>
                
                {isDisabled && (
                  <View
                    style={[
                      styles.badge,
                      slot.isPast ? styles.badgePast : styles.badgeBooked,
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        slot.isPast ? styles.badgeTextPast : styles.badgeTextBooked,
                      ]}
                    >
                      {slot.isPast ? 'Indisponível' : 'Reservado'}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
    color: colors.textSecondary,
  },
  slotsList: {
    maxHeight: 400,
  },
  slotsListContent: {
    gap: spacing.sm,
  },
  slot: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.md,
  },
  slotSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  slotDisabled: {
    backgroundColor: colors.lightGray,
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
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxDisabled: {
    backgroundColor: colors.lightGray,
    borderColor: colors.textSecondary,
  },
  slotTime: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  slotTimeDisabled: {
    color: colors.textSecondary,
  },
  slotDuration: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  badgeBooked: {
    backgroundColor: colors.danger + '15',
  },
  badgePast: {
    backgroundColor: colors.textSecondary + '15',
  },
  badgeText: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 11,
  },
  badgeTextBooked: {
    color: colors.danger,
  },
  badgeTextPast: {
    color: colors.textSecondary,
  },
  tipContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.accent + '10',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent + '30',
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
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.lg,
    marginVertical: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
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
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  allDaySlot: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  allDaySlotContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  allDaySlotLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  allDaySlotTime: {
    ...typography.h5,
    color: colors.text,
    fontWeight: '600',
  },
  allDaySlotSubtext: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});


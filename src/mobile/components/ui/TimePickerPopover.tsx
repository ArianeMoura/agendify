import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Portal } from '@gorhom/portal';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { format, setMinutes, setSeconds, setMilliseconds } from 'date-fns';
import {
  spacing,
  typography,
  borderRadius,
  type ThemeColors,
} from '@/constants/theme';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { Button } from './Button';

interface TimePickerPopoverProps {
  visible: boolean;
  startTime: Date;
  endTime: Date;
  onConfirm: (startTime: Date, endTime: Date) => void;
  onDismiss: () => void;
}

const roundToNearestHour = (date: Date): Date => {
  let rounded = setMilliseconds(date, 0);
  rounded = setSeconds(rounded, 0);
  rounded = setMinutes(rounded, 0);
  return rounded;
};

function formatDuration(startTime: Date, endTime: Date): string {
  const hours =
    Math.abs(endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
  const fullHours = Math.floor(hours);
  const minutes = Math.round((hours - fullHours) * 60);
  if (fullHours === 0) return `${minutes} minutos`;
  if (minutes === 0)
    return `${fullHours} ${fullHours === 1 ? 'hora' : 'horas'}`;
  return `${fullHours}h ${minutes}min`;
}

export function TimePickerPopover({
  visible,
  startTime,
  endTime,
  onConfirm,
  onDismiss,
}: TimePickerPopoverProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [tempStartTime, setTempStartTime] = useState(startTime);
  const [tempEndTime, setTempEndTime] = useState(endTime);
  const [activeTab, setActiveTab] = useState<'start' | 'end'>('start');

  useEffect(() => {
    if (visible) {
      setTempStartTime(roundToNearestHour(startTime));
      setTempEndTime(roundToNearestHour(endTime));
      setActiveTab('start');
    }
  }, [visible, startTime, endTime]);

  const handleConfirm = () => {
    onConfirm(
      roundToNearestHour(tempStartTime),
      roundToNearestHour(tempEndTime),
    );
    onDismiss();
  };

  const currentTime = activeTab === 'start' ? tempStartTime : tempEndTime;
  const setCurrentTime =
    activeTab === 'start' ? setTempStartTime : setTempEndTime;

  if (!visible) return null;

  return (
    <Portal hostName="root">
      <Pressable
        style={styles.backdrop}
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel="Fechar seletor"
      >
        <View
          style={styles.container}
          onStartShouldSetResponder={() => true}
          accessibilityViewIsModal
        >
          <View style={styles.header}>
            <Text style={styles.title} accessibilityRole="header">
              Selecionar Horário
            </Text>
            <Pressable
              onPress={onDismiss}
              style={styles.closeButton}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.tabContainer}>
            {(['start', 'end'] as const).map((tab) => {
              const active = activeTab === tab;
              const label = tab === 'start' ? 'Início' : 'Término';
              const time = format(
                tab === 'start' ? tempStartTime : tempEndTime,
                'HH:mm',
              );
              return (
                <Pressable
                  key={tab}
                  style={[styles.tab, active && styles.activeTab]}
                  onPress={() => setActiveTab(tab)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`${label}, ${time}`}
                >
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={active ? colors.brandFg : colors.inkMuted}
                    accessibilityElementsHidden
                    importantForAccessibility="no"
                  />
                  <Text
                    style={[styles.tabText, active && styles.activeTabText]}
                  >
                    {label}
                  </Text>
                  <Text
                    style={[styles.tabTime, active && styles.activeTabTime]}
                  >
                    {time}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.pickerContainer}>
            {Platform.OS === 'ios' ? (
              <DateTimePicker
                value={currentTime}
                mode="time"
                display="spinner"
                is24Hour
                minuteInterval={15}
                onChange={(_event, selectedDate) => {
                  if (selectedDate) {
                    setCurrentTime(roundToNearestHour(selectedDate));
                  }
                }}
                style={styles.picker}
              />
            ) : (
              <DateTimePicker
                value={currentTime}
                mode="time"
                display="default"
                is24Hour
                onChange={(event, selectedDate) => {
                  if (event.type === 'set' && selectedDate) {
                    setCurrentTime(roundToNearestHour(selectedDate));
                  }
                }}
              />
            )}
          </View>

          <View style={styles.durationCard}>
            <Ionicons
              name="hourglass-outline"
              size={18}
              color={colors.inkMuted}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
            <Text style={styles.durationText}>
              Duração: {formatDuration(tempStartTime, tempEndTime)}
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <Button
              title="Cancelar"
              variant="outline"
              onPress={onDismiss}
              style={styles.button}
            />
            <Button
              title="Confirmar"
              onPress={handleConfirm}
              style={styles.button}
            />
          </View>
        </View>
      </Pressable>
    </Portal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
      zIndex: 9999,
    },
    container: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.xl,
      padding: spacing.xl,
      width: '100%',
      maxWidth: 400,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.lg,
    },
    title: {
      ...typography.h4,
      color: colors.text,
      fontWeight: '600',
    },
    closeButton: {
      padding: spacing.xs,
    },
    tabContainer: {
      flexDirection: 'row',
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    tab: {
      flex: 1,
      backgroundColor: colors.surfaceMuted,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
      minHeight: 44,
    },
    activeTab: {
      backgroundColor: colors.surfaceMuted,
      borderColor: colors.primary,
    },
    tabText: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: spacing.xs,
      fontWeight: '500',
    },
    activeTabText: {
      color: colors.brandFg,
      fontWeight: '600',
    },
    tabTime: {
      ...typography.h5,
      color: colors.text,
      marginTop: spacing.xs / 2,
    },
    activeTabTime: {
      color: colors.brandFg,
      fontWeight: '700',
    },
    pickerContainer: {
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    picker: {
      width: '100%',
      height: 200,
    },
    durationCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surfaceMuted,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.line,
      marginBottom: spacing.lg,
    },
    durationText: {
      ...typography.bodySmall,
      color: colors.text,
      fontWeight: '600',
    },
    buttonRow: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    button: {
      flex: 1,
    },
  });

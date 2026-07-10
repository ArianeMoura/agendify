import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Pressable,
} from 'react-native';
import { Portal } from '@gorhom/portal';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { Button } from './Button';
import { format, setMinutes, setSeconds, setMilliseconds } from 'date-fns';

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

export function TimePickerPopover({
  visible,
  startTime,
  endTime,
  onConfirm,
  onDismiss,
}: TimePickerPopoverProps) {
  const [tempStartTime, setTempStartTime] = React.useState(startTime);
  const [tempEndTime, setTempEndTime] = React.useState(endTime);
  const [activeTab, setActiveTab] = React.useState<'start' | 'end'>('start');

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
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <View style={styles.container} onStartShouldSetResponder={() => true}>
          <View style={styles.header}>
            <Text style={styles.title}>Selecionar Horário</Text>
            <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'start' && styles.activeTab]}
              onPress={() => setActiveTab('start')}
            >
              <Ionicons
                name="time-outline"
                size={20}
                color={
                  activeTab === 'start' ? colors.primary : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'start' && styles.activeTabText,
                ]}
              >
                Início
              </Text>
              <Text
                style={[
                  styles.tabTime,
                  activeTab === 'start' && styles.activeTabTime,
                ]}
              >
                {format(tempStartTime, 'HH:mm')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'end' && styles.activeTab]}
              onPress={() => setActiveTab('end')}
            >
              <Ionicons
                name="time-outline"
                size={20}
                color={
                  activeTab === 'end' ? colors.primary : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'end' && styles.activeTabText,
                ]}
              >
                Término
              </Text>
              <Text
                style={[
                  styles.tabTime,
                  activeTab === 'end' && styles.activeTabTime,
                ]}
              >
                {format(tempEndTime, 'HH:mm')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.pickerContainer}>
            {Platform.OS === 'ios' ? (
              <DateTimePicker
                value={currentTime}
                mode="time"
                display="spinner"
                is24Hour={true}
                minuteInterval={15}
                onChange={(event, selectedDate) => {
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
                is24Hour={true}
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
              color={colors.textSecondary}
            />
            <Text style={styles.durationText}>
              Duração:{' '}
              {(() => {
                const hours =
                  Math.abs(tempEndTime.getTime() - tempStartTime.getTime()) /
                  (1000 * 60 * 60);
                const fullHours = Math.floor(hours);
                const minutes = Math.round((hours - fullHours) * 60);

                if (fullHours === 0) {
                  return `${minutes} minutos`;
                } else if (minutes === 0) {
                  return `${fullHours} ${fullHours === 1 ? 'hora' : 'horas'}`;
                } else {
                  return `${fullHours}h ${minutes}min`;
                }
              })()}
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

const styles = StyleSheet.create({
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
    backgroundColor: colors.white,
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
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeTab: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary,
  },
  tabText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  tabTime: {
    ...typography.h5,
    color: colors.text,
    marginTop: spacing.xs / 2,
  },
  activeTabTime: {
    color: colors.primary,
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
    backgroundColor: colors.accent + '10',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent + '30',
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

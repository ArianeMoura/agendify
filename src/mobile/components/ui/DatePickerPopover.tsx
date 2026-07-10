import React, { useCallback, useEffect } from 'react';
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

interface DatePickerPopoverProps {
  visible: boolean;
  value: Date;
  mode: 'date' | 'time';
  minimumDate?: Date;
  is24Hour?: boolean;
  title: string;
  onConfirm: (date: Date) => void;
  onDismiss: () => void;
}

export function DatePickerPopover({
  visible,
  value,
  mode,
  minimumDate,
  is24Hour = true,
  title,
  onConfirm,
  onDismiss,
}: DatePickerPopoverProps) {
  const [tempDate, setTempDate] = React.useState(value);

  useEffect(() => {
    if (visible) {
      setTempDate(value);
    }
  }, [visible, value]);

  const handleConfirm = useCallback(() => {
    onConfirm(tempDate);
    onDismiss();
  }, [tempDate, onConfirm, onDismiss]);

  if (!visible) return null;

  return (
    <Portal hostName="root">
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <View style={styles.container} onStartShouldSetResponder={() => true}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.pickerContainer}>
            {Platform.OS === 'ios' ? (
              <DateTimePicker
                value={tempDate}
                mode={mode}
                display="spinner"
                minimumDate={minimumDate}
                is24Hour={is24Hour}
                onChange={(event, selectedDate) => {
                  if (selectedDate) {
                    setTempDate(selectedDate);
                  }
                }}
                style={styles.picker}
              />
            ) : (
              <DateTimePicker
                value={tempDate}
                mode={mode}
                display="default"
                minimumDate={minimumDate}
                is24Hour={is24Hour}
                onChange={(event, selectedDate) => {
                  if (event.type === 'set' && selectedDate) {
                    onConfirm(selectedDate);
                  }
                  onDismiss();
                }}
              />
            )}
          </View>

          {Platform.OS === 'ios' && (
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
          )}
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
  pickerContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  picker: {
    width: '100%',
    height: 200,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  button: {
    flex: 1,
  },
});

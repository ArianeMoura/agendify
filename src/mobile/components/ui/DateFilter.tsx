import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { Button } from './Button';

interface DateFilterProps {
  onFilterChange: (startDate: Date | null, endDate: Date | null) => void;
  startDate?: Date | null;
  endDate?: Date | null;
}

export const DateFilter: React.FC<DateFilterProps> = ({
  onFilterChange,
  startDate: initialStartDate = null,
  endDate: initialEndDate = null,
}) => {
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(initialStartDate);
  const [endDate, setEndDate] = useState<Date | null>(initialEndDate);
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = useCallback((date: Date | null) => {
    if (!date) return 'Selecionar';
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }, []);

  const handleStartDateChange = useCallback(
    (event: any, selectedDate?: Date) => {
      setShowStartPicker(Platform.OS === 'ios');
      if (selectedDate) {
        setStartDate(selectedDate);
        if (Platform.OS !== 'ios') {
          onFilterChange(selectedDate, endDate);
        }
      }
    },
    [endDate, onFilterChange],
  );

  const handleEndDateChange = useCallback(
    (event: any, selectedDate?: Date) => {
      setShowEndPicker(Platform.OS === 'ios');
      if (selectedDate) {
        setEndDate(selectedDate);
        if (Platform.OS !== 'ios') {
          onFilterChange(startDate, selectedDate);
        }
      }
    },
    [onFilterChange, startDate],
  );

  const handleApplyFilter = useCallback(() => {
    onFilterChange(startDate, endDate);
    if (Platform.OS === 'ios') {
      setShowStartPicker(false);
      setShowEndPicker(false);
    }
  }, [startDate, endDate, onFilterChange]);

  const handleClearFilter = useCallback(() => {
    setStartDate(null);
    setEndDate(null);
    onFilterChange(null, null);
  }, [onFilterChange]);

  const hasActiveFilter = startDate !== null || endDate !== null;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <View style={styles.headerLeft}>
          <Ionicons
            name="filter"
            size={20}
            color={hasActiveFilter ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.headerText,
              hasActiveFilter && styles.headerTextActive,
            ]}
          >
            Filtrar por Data
          </Text>
          {hasActiveFilter && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Ativo</Text>
            </View>
          )}
        </View>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.content}>
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <Text style={styles.label}>Data Início</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowStartPicker(true)}
              >
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text style={styles.dateText}>{formatDate(startDate)}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dateField}>
              <Text style={styles.label}>Data Fim</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowEndPicker(true)}
              >
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text style={styles.dateText}>{formatDate(endDate)}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.actions}>
            {hasActiveFilter && (
              <Button
                title="Limpar"
                variant="outline"
                size="small"
                onPress={handleClearFilter}
                style={styles.actionButton}
              />
            )}
            {Platform.OS === 'ios' && (startDate || endDate) && (
              <Button
                title="Aplicar"
                size="small"
                onPress={handleApplyFilter}
                style={styles.actionButton}
              />
            )}
          </View>

          {Platform.OS === 'ios' && showStartPicker && (
            <Modal
              transparent
              animationType="slide"
              visible={showStartPicker}
              onRequestClose={() => setShowStartPicker(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>
                      Selecionar Data Início
                    </Text>
                    <TouchableOpacity onPress={() => setShowStartPicker(false)}>
                      <Text style={styles.modalDone}>Fechar</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={startDate || new Date()}
                    mode="date"
                    display="spinner"
                    onChange={handleStartDateChange}
                    locale="pt-BR"
                  />
                </View>
              </View>
            </Modal>
          )}

          {Platform.OS === 'ios' && showEndPicker && (
            <Modal
              transparent
              animationType="slide"
              visible={showEndPicker}
              onRequestClose={() => setShowEndPicker(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Selecionar Data Fim</Text>
                    <TouchableOpacity onPress={() => setShowEndPicker(false)}>
                      <Text style={styles.modalDone}>Fechar</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={endDate || new Date()}
                    mode="date"
                    display="spinner"
                    onChange={handleEndDateChange}
                    locale="pt-BR"
                    minimumDate={startDate || undefined}
                  />
                </View>
              </View>
            </Modal>
          )}

          {Platform.OS === 'android' && showStartPicker && (
            <DateTimePicker
              value={startDate || new Date()}
              mode="date"
              display="default"
              onChange={handleStartDateChange}
            />
          )}

          {Platform.OS === 'android' && showEndPicker && (
            <DateTimePicker
              value={endDate || new Date()}
              mode="date"
              display="default"
              onChange={handleEndDateChange}
              minimumDate={startDate || undefined}
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  headerTextActive: {
    color: colors.primary,
  },
  badge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  badgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  content: {
    padding: spacing.md,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dateRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  dateField: {
    flex: 1,
  },
  label: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.lightGray,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateText: {
    ...typography.body,
    color: colors.text,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.h4,
    color: colors.text,
  },
  modalDone: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
});

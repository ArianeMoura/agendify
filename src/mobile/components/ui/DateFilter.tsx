import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import {
  spacing,
  typography,
  borderRadius,
  type ThemeColors,
} from '@/constants/theme';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { Button } from './Button';
import { Badge } from './Badge';

interface DateFilterProps {
  onFilterChange: (startDate: Date | null, endDate: Date | null) => void;
  startDate?: Date | null;
  endDate?: Date | null;
}

export function DateFilter({
  onFilterChange,
  startDate: initialStartDate = null,
  endDate: initialEndDate = null,
}: DateFilterProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
    (_event: unknown, selectedDate?: Date) => {
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
    (_event: unknown, selectedDate?: Date) => {
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
      <Pressable
        style={styles.header}
        onPress={() => setIsExpanded((prev) => !prev)}
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
        accessibilityLabel="Filtrar por data"
        accessibilityHint={
          isExpanded ? 'Recolher filtros' : 'Expandir filtros de data'
        }
      >
        <View style={styles.headerLeft}>
          <Ionicons
            name="filter"
            size={20}
            color={hasActiveFilter ? colors.brandFg : colors.inkMuted}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          <Text
            style={[
              styles.headerText,
              hasActiveFilter && styles.headerTextActive,
            ]}
          >
            Filtrar por Data
          </Text>
          {hasActiveFilter ? <Badge label="Ativo" tone="brand" /> : null}
        </View>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.inkMuted}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      </Pressable>

      {isExpanded && (
        <View style={styles.content}>
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <Text style={styles.label}>Data Início</Text>
              <Pressable
                style={styles.dateButton}
                onPress={() => setShowStartPicker(true)}
                accessibilityRole="button"
                accessibilityLabel={`Data início: ${formatDate(startDate)}`}
              >
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={colors.inkMuted}
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                />
                <Text style={styles.dateText}>{formatDate(startDate)}</Text>
              </Pressable>
            </View>

            <View style={styles.dateField}>
              <Text style={styles.label}>Data Fim</Text>
              <Pressable
                style={styles.dateButton}
                onPress={() => setShowEndPicker(true)}
                accessibilityRole="button"
                accessibilityLabel={`Data fim: ${formatDate(endDate)}`}
              >
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={colors.inkMuted}
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                />
                <Text style={styles.dateText}>{formatDate(endDate)}</Text>
              </Pressable>
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
            <IosDateModal
              styles={styles}
              title="Selecionar Data Início"
              value={startDate || new Date()}
              onChange={handleStartDateChange}
              onClose={() => setShowStartPicker(false)}
            />
          )}

          {Platform.OS === 'ios' && showEndPicker && (
            <IosDateModal
              styles={styles}
              title="Selecionar Data Fim"
              value={endDate || new Date()}
              minimumDate={startDate || undefined}
              onChange={handleEndDateChange}
              onClose={() => setShowEndPicker(false)}
            />
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
}

function IosDateModal({
  styles,
  title,
  value,
  minimumDate,
  onChange,
  onClose,
}: {
  styles: ReturnType<typeof createStyles>;
  title: string;
  value: Date;
  minimumDate?: Date;
  onChange: (event: unknown, date?: Date) => void;
  onClose: () => void;
}) {
  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent} accessibilityViewIsModal>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle} accessibilityRole="header">
              {title}
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
            >
              <Text style={styles.modalDone}>Fechar</Text>
            </Pressable>
          </View>
          <DateTimePicker
            value={value}
            mode="date"
            display="spinner"
            onChange={onChange}
            locale="pt-BR"
            minimumDate={minimumDate}
          />
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      marginBottom: spacing.md,
      borderRadius: borderRadius.md,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.md,
      minHeight: 44,
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
      color: colors.brandFg,
    },
    content: {
      padding: spacing.md,
      paddingTop: 0,
      borderTopWidth: 1,
      borderTopColor: colors.line,
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
      color: colors.textMuted,
      marginBottom: spacing.xs,
      fontWeight: '600',
    },
    dateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surfaceMuted,
      padding: spacing.md,
      borderRadius: borderRadius.sm,
      borderWidth: 1,
      borderColor: colors.line,
      minHeight: 44,
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
      backgroundColor: colors.surface,
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
      color: colors.brandFg,
      fontWeight: '600',
    },
  });

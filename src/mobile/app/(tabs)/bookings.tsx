import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { DateFilter } from '@/components/ui/DateFilter';
import { useAuth } from '@/lib/contexts/AuthContext';
import { bookingsApi } from '@/lib/api/bookings';
import { BookingWithDetails, Role } from '@/lib/types';

export default function BookingsScreen() {
  const router = useRouter();

  const { user } = useAuth();

  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const queryClient = useQueryClient();

  const isAdmin = useMemo(
    () => user?.role === Role.OrgAdmin || user?.role === Role.PlatformOwner,
    [user],
  );

  const [filterStartDate, setFilterStartDate] = useState<Date | null>(null);
  const [filterEndDate, setFilterEndDate] = useState<Date | null>(null);

  const {
    data: bookings,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: isAdmin ? ['bookings'] : ['bookings', 'user', user?.id],
    queryFn: () =>
      isAdmin ? bookingsApi.getAll() : bookingsApi.getByUserId(user?.id || ''),
    enabled: !!user,
  });

  const filteredBookings = useMemo(() => {
    if (!bookings) return [];

    if (!filterStartDate && !filterEndDate) {
      return bookings;
    }

    return bookings.filter((booking) => {
      const bookingDate = new Date(booking.startDateTime);

      const bookingDay = new Date(
        bookingDate.getFullYear(),
        bookingDate.getMonth(),
        bookingDate.getDate(),
      );

      if (filterStartDate && filterEndDate) {
        const startDay = new Date(
          filterStartDate.getFullYear(),
          filterStartDate.getMonth(),
          filterStartDate.getDate(),
        );
        const endDay = new Date(
          filterEndDate.getFullYear(),
          filterEndDate.getMonth(),
          filterEndDate.getDate(),
        );
        return bookingDay >= startDay && bookingDay <= endDay;
      }

      if (filterStartDate) {
        const startDay = new Date(
          filterStartDate.getFullYear(),
          filterStartDate.getMonth(),
          filterStartDate.getDate(),
        );
        return bookingDay >= startDay;
      }

      if (filterEndDate) {
        const endDay = new Date(
          filterEndDate.getFullYear(),
          filterEndDate.getMonth(),
          filterEndDate.getDate(),
        );
        return bookingDay <= endDay;
      }

      return true;
    });
  }, [bookings, filterStartDate, filterEndDate]);

  const handleFilterChange = useCallback(
    (startDate: Date | null, endDate: Date | null) => {
      setFilterStartDate(startDate);
      setFilterEndDate(endDate);
    },
    [],
  );

  const deleteMutation = useMutation({
    mutationFn: bookingsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      Alert.alert('Sucesso', 'Reserva excluída com sucesso!');
    },
    onError: () => {
      Alert.alert('Erro', 'Não foi possível excluir a reserva.');
    },
  });

  const handleDelete = useCallback(
    (id: string) => {
      Alert.alert(
        'Confirmar exclusão',
        'Tem certeza que deseja excluir esta reserva?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Excluir',
            style: 'destructive',
            onPress: () => deleteMutation.mutate(id),
          },
        ],
      );
    },
    [deleteMutation],
  );

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }, []);

  const formatTime = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const renderBookingItem = ({ item }: { item: BookingWithDetails }) => (
    <Card style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <View style={styles.bookingInfo}>
          <Ionicons name="business" size={20} color={colors.primary} />
          <Text style={styles.spaceName}>{item.space?.name || 'Espaço'}</Text>
        </View>
        <View style={styles.bookingActions}>
          <TouchableOpacity
            onPress={() => router.push(`/bookings/edit/${item.id}`)}
            style={styles.iconButton}
          >
            <Ionicons name="create-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDelete(item.id)}
            style={styles.iconButton}
          >
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      {isAdmin && item.user && (
        <View style={styles.userInfo}>
          <Ionicons
            name="person-outline"
            size={16}
            color={colors.textSecondary}
          />
          <Text style={styles.userName}>{item.user.name}</Text>
        </View>
      )}

      <View style={styles.dateTimeContainer}>
        <View style={styles.dateTimeRow}>
          <Ionicons
            name="calendar-outline"
            size={16}
            color={colors.textSecondary}
          />
          <Text style={styles.dateText}>{formatDate(item.startDateTime)}</Text>
        </View>
        <View style={styles.dateTimeRow}>
          <Ionicons
            name="time-outline"
            size={16}
            color={colors.textSecondary}
          />
          <Text style={styles.timeText}>
            {formatTime(item.startDateTime)} - {formatTime(item.endDateTime)}
          </Text>
        </View>
      </View>

      {item.space?.description && (
        <Text style={styles.description} numberOfLines={2}>
          {item.space.description}
        </Text>
      )}
    </Card>
  );

  if (isLoading) {
    return <Loading message="Carregando reservas..." />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredBookings}
        renderItem={renderBookingItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <DateFilter
            onFilterChange={handleFilterChange}
            startDate={filterStartDate}
            endDate={filterEndDate}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="calendar-outline"
            title={
              filterStartDate || filterEndDate
                ? 'Nenhuma reserva encontrada'
                : 'Nenhuma reserva'
            }
            message={
              filterStartDate || filterEndDate
                ? 'Não há reservas no período selecionado. Tente ajustar os filtros.'
                : isAdmin
                  ? 'Não há reservas cadastradas no sistema.'
                  : 'Você ainda não fez nenhuma reserva.'
            }
            onAction={
              !filterStartDate && !filterEndDate
                ? () => router.push('/bookings/create')
                : undefined
            }
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    listContent: {
      padding: spacing.lg,
      flexGrow: 1,
    },
    bookingCard: {
      marginBottom: spacing.md,
    },
    bookingHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    bookingInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    spaceName: {
      ...typography.h5,
      color: colors.text,
      marginLeft: spacing.sm,
      flex: 1,
    },
    bookingActions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    iconButton: {
      padding: spacing.xs,
    },
    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    userName: {
      ...typography.bodySmall,
      color: colors.textSecondary,
      marginLeft: spacing.xs,
    },
    dateTimeContainer: {
      marginBottom: spacing.sm,
    },
    dateTimeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    dateText: {
      ...typography.body,
      color: colors.text,
      marginLeft: spacing.sm,
    },
    timeText: {
      ...typography.body,
      color: colors.text,
      marginLeft: spacing.sm,
    },
    description: {
      ...typography.bodySmall,
      color: colors.textSecondary,
      marginTop: spacing.sm,
    },
  });

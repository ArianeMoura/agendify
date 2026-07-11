import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import {
  spacing,
  typography,
  borderRadius,
  shadows,
  type ThemeColors,
} from '@/constants/theme';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useResponsive } from '@/lib/theme/useResponsive';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/lib/contexts/AuthContext';
import { spacesApi } from '@/lib/api/spaces';
import { getImageUrl } from '@/lib/api/config';
import { Space, Role } from '@/lib/types';

export default function SpacesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const { columns } = useResponsive();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isAdmin =
    user?.role === Role.OrgAdmin || user?.role === Role.PlatformOwner;

  const {
    data: spaces,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['spaces'],
    queryFn: spacesApi.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: spacesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      Alert.alert('Sucesso', 'Espaço excluído com sucesso!');
    },
    onError: () => {
      Alert.alert('Erro', 'Não foi possível excluir o espaço.');
    },
  });

  const handleDelete = useCallback(
    (id: string) => {
      Alert.alert(
        'Confirmar exclusão',
        'Tem certeza que deseja excluir este espaço?',
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

  const renderSpaceItem = ({ item }: { item: Space }) => (
    <Card style={[styles.spaceCard, columns > 1 ? styles.spaceCardGrid : null]}>
      {item.imageUrl && (
        <Image
          source={{ uri: getImageUrl(item.imageUrl) }}
          style={styles.spaceImage}
          contentFit="cover"
          transition={200}
        />
      )}

      <View style={styles.spaceContent}>
        <View style={styles.spaceHeader}>
          <View style={styles.spaceInfo}>
            <Text style={styles.spaceName}>{item.name}</Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: item.availability
                    ? colors.success + '20'
                    : colors.danger + '20',
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: item.availability ? colors.success : colors.danger },
                ]}
              >
                {item.availability ? 'Disponível' : 'Indisponível'}
              </Text>
            </View>
          </View>

          {isAdmin && (
            <View style={styles.spaceActions}>
              <TouchableOpacity
                onPress={() => router.push(`/spaces/edit/${item.id}`)}
                style={styles.iconButton}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Editar ${item.name}`}
              >
                <Ionicons
                  name="create-outline"
                  size={20}
                  color={colors.primary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(item.id)}
                style={styles.iconButton}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Excluir ${item.name}`}
              >
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color={colors.danger}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {item.description && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Ionicons
              name="people-outline"
              size={16}
              color={colors.textSecondary}
            />
            <Text style={styles.detailText}>
              Capacidade: {item.capacity} pessoas
            </Text>
          </View>

          {item.resources && item.resources.length > 0 && (
            <View style={styles.detailRow}>
              <Ionicons
                name="list-outline"
                size={16}
                color={colors.textSecondary}
              />
              <Text style={styles.detailText}>
                {item.resources.length} recurso(s)
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.reviewsLink}
          onPress={() =>
            router.push({
              pathname: '/spaces/[id]/reviews',
              params: { id: item.id, name: item.name },
            })
          }
          accessibilityRole="button"
          accessibilityLabel={`Ver avaliações de ${item.name}`}
        >
          <Ionicons name="star-outline" size={16} color={colors.brandFg} />
          <Text style={styles.reviewsLinkText}>Avaliações</Text>
        </TouchableOpacity>

        {!isAdmin && (
          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => router.push(`/bookings/create?spaceId=${item.id}`)}
            disabled={!item.availability}
            accessibilityRole="button"
            accessibilityState={{ disabled: !item.availability }}
            accessibilityLabel={
              item.availability
                ? `Reservar ${item.name}`
                : `${item.name} indisponível`
            }
          >
            <Text style={styles.bookButtonText}>
              {item.availability ? 'Reservar' : 'Indisponível'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );

  if (isLoading) {
    return <Loading message="Carregando espaços..." />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={spaces}
        renderItem={renderSpaceItem}
        keyExtractor={(item) => item.id}
        // `key` força o FlatList a remontar quando o nº de colunas muda (rotação/tablet).
        key={`cols-${columns}`}
        numColumns={columns}
        columnWrapperStyle={columns > 1 ? styles.columnWrapper : undefined}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon="business-outline"
            title="Nenhum espaço"
            message="Não há espaços disponíveis no momento."
            actionLabel={isAdmin ? 'Adicionar Espaço' : undefined}
            onAction={isAdmin ? () => router.push('/spaces/create') : undefined}
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

      {isAdmin && spaces && spaces.length > 0 && (
        <View style={styles.fabContainer}>
          <TouchableOpacity
            style={styles.fab}
            onPress={() => router.push('/spaces/create')}
            accessibilityRole="button"
            accessibilityLabel="Adicionar espaço"
          >
            <Ionicons name="add" size={32} color={colors.white} />
          </TouchableOpacity>
        </View>
      )}
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
    spaceCard: {
      marginBottom: spacing.md,
      overflow: 'hidden',
      padding: 0,
    },
    spaceCardGrid: {
      flex: 1,
    },
    columnWrapper: {
      gap: spacing.md,
    },
    spaceImage: {
      width: '100%',
      aspectRatio: 16 / 9,
      backgroundColor: colors.lightGray,
    },
    spaceContent: {
      padding: spacing.md,
    },
    spaceHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.md,
    },
    spaceInfo: {
      flex: 1,
    },
    spaceName: {
      ...typography.h5,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    statusBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.sm,
      marginTop: spacing.xs,
    },
    statusText: {
      ...typography.caption,
      fontWeight: '600',
    },
    spaceActions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    iconButton: {
      padding: spacing.xs,
    },
    description: {
      ...typography.body,
      color: colors.textSecondary,
      marginBottom: spacing.md,
    },
    detailsContainer: {
      gap: spacing.sm,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    detailText: {
      ...typography.bodySmall,
      color: colors.text,
      marginLeft: spacing.sm,
    },
    reviewsLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      alignSelf: 'flex-start',
      marginTop: spacing.md,
      paddingVertical: spacing.xs,
    },
    reviewsLinkText: {
      ...typography.bodySmall,
      color: colors.brandFg,
      fontWeight: '600',
    },
    bookButton: {
      marginTop: spacing.md,
      backgroundColor: colors.primary,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      alignItems: 'center',
    },
    bookButtonText: {
      ...typography.body,
      color: colors.white,
      fontWeight: '600',
    },
    fabContainer: {
      position: 'absolute',
      bottom: spacing.xl,
      right: spacing.xl,
    },
    fab: {
      width: 56,
      height: 56,
      borderRadius: borderRadius.round,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      ...shadows.lg,
    },
  });

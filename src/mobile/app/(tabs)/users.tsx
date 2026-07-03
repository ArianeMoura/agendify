import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { usersApi } from '@/lib/api/users';
import { User, Profile } from '@/lib/types';

export default function UsersScreen() {
  const queryClient = useQueryClient();

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: usersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      Alert.alert('Sucesso', 'Usuário excluído com sucesso!');
    },
    onError: () => {
      Alert.alert('Erro', 'Não foi possível excluir o usuário.');
    },
  });

  const handleDelete = useCallback((id: string, name: string) => {
    Alert.alert(
      'Confirmar exclusão',
      `Tem certeza que deseja excluir o usuário "${name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(id),
        },
      ]
    );
  }, [deleteMutation]);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  }, []);

  const renderUserItem = ({ item }: { item: User }) => (
    <Card style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>

          <View style={styles.badgeContainer}>
            <View
              style={[
                styles.roleBadge,
                {
                  backgroundColor:
                    item.profile === Profile.Administrator
                      ? colors.primary + '20'
                      : colors.success + '20',
                },
              ]}
            >
              <Text
                style={[
                  styles.roleText,
                  {
                    color:
                      item.profile === Profile.Administrator
                        ? colors.primary
                        : colors.success,
                  },
                ]}
              >
                {item.profile === Profile.Administrator ? 'Admin' : 'Usuário'}
              </Text>
            </View>
          </View>

          <View style={styles.dateContainer}>
            <Ionicons name="calendar-outline" size={12} color={colors.textLight} />
            <Text style={styles.dateText}>
              Criado em {formatDate(item.createdAt)}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => handleDelete(item.id, item.name)}
          style={styles.deleteButton}
        >
          <Ionicons name="trash-outline" size={20} color={colors.danger} />
        </TouchableOpacity>
      </View>
    </Card>
  );

  if (isLoading) {
    return <Loading message="Carregando usuários..." />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="Nenhum usuário"
            message="Não há usuários cadastrados no sistema."
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.lg,
    flexGrow: 1,
  },
  userCard: {
    marginBottom: spacing.md,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.round,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    ...typography.h4,
    color: colors.white,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...typography.h5,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  userEmail: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  badgeContainer: {
    marginBottom: spacing.sm,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  roleText: {
    ...typography.caption,
    fontWeight: '600',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    ...typography.caption,
    color: colors.textLight,
    marginLeft: spacing.xs,
  },
  deleteButton: {
    padding: spacing.xs,
  },
});


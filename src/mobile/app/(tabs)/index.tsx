import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Profile } from '@/lib/types';

export const DashboardCard = ({
  icon,
  title,
  description,
  onPress,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  onPress: () => void;
  color: string;
}) => (
  <TouchableOpacity onPress={onPress} style={styles.cardContainer}>
    <Card style={styles.card}>
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={32} color={color} />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDescription}>{description}</Text>
    </Card>
  </TouchableOpacity>
);

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.profile === Profile.Administrator;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Bem-vindo,</Text>
        <Text style={styles.userName}>{user?.name}!</Text>
      </View>

      {isAdmin ? (
        <>
          <Text style={styles.sectionTitle}>Administração</Text>
          <View style={styles.grid}>
            <DashboardCard
              icon="people"
              title="Usuários"
              description="Visualize e gerencie usuários do sistema"
              onPress={() => router.push('/(tabs)/users')}
              color={colors.primary}
            />
            <DashboardCard
              icon="business"
              title="Espaços"
              description="Adicione e edite espaços disponíveis"
              onPress={() => router.push('/(tabs)/spaces')}
              color={colors.accent}
            />
            <DashboardCard
              icon="calendar"
              title="Reservas"
              description="Visualize e gerencie todas as reservas"
              onPress={() => router.push('/(tabs)/bookings')}
              color={colors.success}
            />
          </View>
        </>
      ) : (
        <>
          <View style={styles.grid}>
            <DashboardCard
              icon="calendar"
              title="Minhas Reservas"
              description="Visualize suas reservas ativas"
              onPress={() => router.push('/(tabs)/bookings')}
              color={colors.success}
            />
            <DashboardCard
              icon="business"
              title="Espaços"
              description="Veja os espaços disponíveis"
              onPress={() => router.push('/(tabs)/spaces')}
              color={colors.accent}
            />
          </View>
        </>
      )}

      <Card style={styles.infoCard}>
        <Text style={styles.infoTitle}>Informações da Conta</Text>
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.infoText}>{user?.name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.infoText}>{user?.email}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.infoText}>
            {isAdmin ? 'Administrador' : 'Usuário Comum'}
          </Text>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
  },
  greeting: {
    ...typography.h4,
    color: colors.textSecondary,
  },
  userName: {
    ...typography.h1,
    color: colors.text,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.sm,
    marginBottom: spacing.xl,
  },
  cardContainer: {
    width: '50%',
    padding: spacing.sm,
  },
  card: {
    alignItems: 'center',
    minHeight: 160,
    justifyContent: 'flex-start',
    flex: 1,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: {
    ...typography.h5,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  cardDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  infoCard: {
    marginBottom: spacing.lg,
  },
  infoTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  infoText: {
    ...typography.body,
    color: colors.text,
    marginLeft: spacing.md,
  },
});

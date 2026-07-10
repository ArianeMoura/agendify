import React from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { getPeakHours, PeakHourDto } from '../../services/analytics';

export default function AnalyticsScreen() {
  const [data, setData] = React.useState<PeakHourDto[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const now = new Date();

        const result = await getPeakHours({
          year: now.getFullYear(),
          month: now.getMonth() + 1,
        });

        setData(result);
      } catch (err: any) {
        console.error('Erro ao buscar peak hours:', err);
        setError(err.message ?? 'Erro ao carregar horários de pico');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.text}>Carregando horários de pico...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={[styles.text, styles.errorText]}>{error}</Text>
      </View>
    );
  }

  if (data.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>
          Sem dados de horários de pico para este período.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Horários de Pico</Text>

      <FlatList
        data={data}
        keyExtractor={(_, index) => String(index)}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.hourText}>
              {item.startTime} - {item.endTime}
            </Text>
            <Text style={styles.countText}>
              Reservas: {item.reservationsCount}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  text: {
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
  item: {
    paddingVertical: 12,
  },
  hourText: {
    fontSize: 16,
    fontWeight: '500',
  },
  countText: {
    fontSize: 14,
    color: '#555',
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
  },
});

import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Link } from 'expo-router';

export default function EscolherEspacoScreen() {

  const espacos = [
    { id: 'sala_a', nome: 'Sala de Reunião A' },
    { id: 'cabine_b', nome: 'Cabine Foco B' },
    { id: 'auditorio', nome: 'Auditório' },
    { id: 'espaco_cafe', nome: 'Espaço Café' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>

      <Text style={styles.selectionTitle}>O que você gostaria de fazer?</Text>

      {espacos.map((espaco) => (
        <View key={espaco.id} style={styles.spaceItemComplex}>
          <Text style={styles.spaceName}>{espaco.nome}</Text>

          <Link
            href={{
              pathname: "/avaliar",
              params: { id: espaco.id, nome: espaco.nome }
            }}
            asChild
          >
            <TouchableOpacity style={styles.avaliaButton}>
              <Text style={styles.avaliaButtonText}>Avaliar</Text>
            </TouchableOpacity>
          </Link>
        </View>
      ))}

      <Link href="/avaliacoes" asChild>
        <TouchableOpacity style={styles.spaceItem}>
          <Text>Ver Avaliações Recebidas</Text>
        </TouchableOpacity>
      </Link>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
  },
  selectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 32,
  },
  spaceItemComplex: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EEEEEE',
    borderRadius: 8,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    marginBottom: 16,
  },
  spaceName: {
    fontSize: 16,
    fontWeight: '500',
  },
  avaliaButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#9345D9',
  },
  avaliaButtonText: {
    color: '#9345D9',
    fontSize: 14,
    fontWeight: '500',
  },
  spaceItem: {
    backgroundColor: '#EEEEEE',
    borderRadius: 8,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  }
});
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Link } from 'expo-router'; // Importa o Link para navegação

// Componente do Ecrã de Escolher Espaço
export default function EscolherEspacoScreen() {

  const espacos = [
    { id: 'sala_a', nome: 'Sala de Reunião A' },
    { id: 'cabine_b', nome: 'Cabine Foco B' },
    { id: 'auditorio', nome: 'Auditório' },
    { id: 'espaco_cafe', nome: 'Espaço Café' },
  ];

  return (
    // Usamos ScrollView para a lista
    <ScrollView contentContainerStyle={styles.container}>

      <Text style={styles.selectionTitle}>O que você gostaria de fazer?</Text>

      {/* Itera sobre os espaços e cria os botões */}
      {espacos.map((espaco) => (
        <View key={espaco.id} style={styles.spaceItemComplex}>
          <Text style={styles.spaceName}>{espaco.nome}</Text>

          {/* Botão Avaliar */}
          <Link
            href={{
              pathname: "/avaliar", // Procura por app/avaliar.tsx
              params: { id: espaco.id, nome: espaco.nome } // Passa os parâmetros
            }}
            asChild
          >
            <TouchableOpacity style={styles.avaliaButton}>
              <Text style={styles.avaliaButtonText}>Avaliar</Text>
            </TouchableOpacity>
          </Link>
        </View>
      ))}

      {/* Link para Ver Avaliações */}
      <Link href="/avaliacoes" asChild>
        <TouchableOpacity style={styles.spaceItem}>
          <Text>Ver Avaliações Recebidas</Text>
        </TouchableOpacity>
      </Link>

    </ScrollView>
  );
}

// Estilos (CSS) MÍNIMOS para este ecrã
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
    paddingTop: 60, // Espaço para o cabeçalho que removemos
    backgroundColor: '#FFFFFF',
  },
  selectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 32,
  },
  // Item da Lista
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
  // Botão Avaliar
  avaliaButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#9345D9', // Roxo
  },
  avaliaButtonText: {
    color: '#9345D9', // Roxo
    fontSize: 14,
    fontWeight: '500',
  },
  // Item "Ver Avaliações"
  spaceItem: {
    backgroundColor: '#EEEEEE',
    borderRadius: 8,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  }
});
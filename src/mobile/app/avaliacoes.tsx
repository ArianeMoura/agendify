import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router'; // Para o botão "voltar"


const Cores = {
  primaryPurple: '#9345D9',
  headerPurple: '#6a12aaff',
  logoDark: '#3F3C56',
  inputBg: '#EEEEEE',
  textColor: '#555555',
  pageBg: '#FFFFFF',
};

// --- FUNÇÃO AJUDANTE 1: Deixar o nome do espaço bonito ---
function getSpaceName(spaceID: string) {
  switch (spaceID) {
    case 'sala_a': return 'Sala de Reunião A';
    case 'cabine_b': return 'Cabine Foco B';
    case 'auditorio': return 'Auditório';
    case 'espaco_cafe': return 'Espaço Café';
    default: return spaceID;
  }
}

// --- FUNÇÃO AJUDANTE 2: Converter CSV para Array ---
function parseCSV(text: string): string[][] {
  const rows = text.split('\n').map(row => row.trim());
  return rows.map(row => row.split(','));
}

// Define a estrutura de um "Review"
type Review = {
  id: string;
  timestamp: string;
  spaceID: string;
  rating: string;
  feedback: string;
};

// Componente do Ecrã de Ver Avaliações
export default function VerAvaliacoesScreen() {
  const router = useRouter(); // Para o botão "voltar"
  
  // Estados para controlar o carregamento e os dados
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);

  // useEffect é como o 'DOMContentLoaded'
  // Vai rodar 1 vez quando o ecrã carregar
  useEffect(() => {
    const fetchReviews = async () => {
      const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT-w0r2V7VBPQr3L-6IahMta9GdAXiapgaJNpBoMIsPfz9xoRVSRP0CjdDyOxAQioSWck2NNnV5HcQP/pub?output=csv';
      
      try {
        const response = await fetch(GOOGLE_SHEET_CSV_URL);
        if (!response.ok) {
          throw new Error('Erro ao buscar dados');
        }
        const csvText = await response.text();
        const data = parseCSV(csvText);

        // Processa os dados (começa de 1 para pular o cabeçalho)
        const loadedReviews: Review[] = [];
        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          // Validação básica para pular linhas vazias
          if (row && row.length > 6) { 
            const newReview: Review = {
              id: `${i}-${row[0]}`, // Cria um ID único
              timestamp: row[0],
              spaceID: row[1],
              rating: row[2],
              feedback: row[6], // Coluna "Sugestões de Melhoria"
            };
            loadedReviews.push(newReview);
          }
        }
        
        // Mostra os mais novos primeiro
        setReviews(loadedReviews.reverse()); 
        setError(null);
      } catch (err) {
        console.error('Falha ao carregar avaliações:', err);
        setError('Falha ao carregar avaliações. Tente novamente mais tarde.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, []); // O array vazio [] significa "rode 1 vez"

  // Função para renderizar o conteúdo
  const renderContent = () => {
    // 1. Se estiver carregando
    if (isLoading) {
      return (
        <View style={styles.centeredMessage}>
          <ActivityIndicator size="large" color={Cores.primaryPurple} />
          <Text style={styles.loadingText}>Carregando avaliações...</Text>
        </View>
      );
    }
    // 2. Se der erro
    if (error) {
      return (
        <View style={styles.centeredMessage}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }
    // 3. Se não houver reviews
    if (reviews.length === 0) {
      return (
        <View style={styles.centeredMessage}>
          <Text style={styles.loadingText}>Nenhuma avaliação encontrada.</Text>
        </View>
      );
    }
    
    // 4. Se houver reviews, mostra a lista
    return (
      <View style={styles.reviewsListContainer}>
        {reviews.map((review) => (
          <View key={review.id} style={styles.reviewCard}>
            <View style={styles.reviewCardHeader}>
              <Text style={styles.reviewSpaceName}>{getSpaceName(review.spaceID)}</Text>
              <View style={styles.reviewRating}>
                <Text style={styles.reviewRatingText}>{review.rating}</Text>
                <Text style={styles.reviewRatingStar}>★</Text>
              </View>
            </View>
            <Text style={styles.reviewFeedback}>
              {review.feedback || "(Nenhum comentário de melhoria foi deixado)"}
            </Text>
            <Text style={styles.reviewDate}>
              {review.timestamp ? review.timestamp.split(' ')[0] : ''}
            </Text>
          </View>
        ))}
      </View>
    );
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Cores.headerPurple} />
      
      {/* <header class="top-bar"> */}
      <View style={styles.topBar}>
        <View style={styles.topBarContent}>
          {/* Botão Voltar (Manual) */}
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>{"< Voltar"}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Avaliações Recebidas</Text>
          <View style={styles.headerPlaceholder} /> 
        </View>
      </View>

      {/* <main ...> */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

// 
// Estilos (CSS) para este ecrã
// 
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Cores.pageBg,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    alignItems: 'center',
    padding: 20,
    paddingBottom: 60,
  },
  // Header
  topBar: {
    width: '100%',
    height: 60,
    backgroundColor: Cores.headerPurple,
  },
  topBarContent: {
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '500',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
  },
  headerPlaceholder: {
    width: 60, // Espaço para o botão "voltar"
  },
  // Mensagens
  centeredMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: '50%', // Empurra para o centro
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Cores.textColor,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  },
  // Reviews
  reviewsListContainer: {
    width: '100%',
    maxWidth: 900,
  },
  reviewCard: {
    width: '100%',
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    padding: 24, // duvida!!
    borderWidth: 1,
    borderColor: Cores.inputBg,
    marginBottom: 16, 
    // fallback para 'gap'
  },
  reviewCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#EAEAEA',
    paddingBottom: 12,
    marginBottom: 16,
  },
  reviewSpaceName: {
    fontSize: 20,
    fontWeight: '700',
    color: Cores.logoDark,
    flex: 1, 
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewRatingText: {
    fontSize: 20,
    fontWeight: '700',
    color: Cores.primaryPurple,
    marginRight: 4,
  },
  reviewRatingStar: {
    fontSize: 20,
    color: Cores.primaryPurple,
  },
  reviewFeedback: {
    fontSize: 16,
    color: Cores.textColor,
    lineHeight: 24,
    marginBottom: 16,
    fontStyle: 'italic', 
    // Componente do Ecrã de Obrigado
  },
  reviewDate: {
    fontSize: 14,
    color: '#888',
    textAlign: 'right',
  },
});
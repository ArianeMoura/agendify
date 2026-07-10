import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Switch,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { reviewsApi } from '../../lib/api/reviews';

const Cores = {
  primaryPurple: '#9345D9',
  headerPurple: '#6A0DAD',
  logoDark: '#3F3C56',
  inputBg: '#EEEEEE',
  textColor: '#555555',
  pageBg: '#FFFFFF',
};

export default function AvaliarScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [rating, setRating] = useState<string>('0');
  const [purpose, setPurpose] = useState<string>('');
  const [hadProblem, setHadProblem] = useState<boolean>(false);
  const [problemDetails, setProblemDetails] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Envia a avaliação para a própria API (RF-013), não mais a um Google Form de
  // terceiros. O usuário vem do token; os campos extras compõem o comentário.
  const handleSubmit = async () => {
    if (rating === '0' || !purpose) {
      Alert.alert(
        'Campos Obrigatórios',
        'Por favor, selecione uma nota e um propósito.',
      );
      return;
    }

    setIsSubmitting(true);

    const commentParts = [
      `Propósito: ${purpose}`,
      hadProblem
        ? `Problema: ${problemDetails || 'sim (sem detalhes)'}`
        : 'Sem problemas técnicos',
      feedback ? `Feedback: ${feedback}` : null,
    ].filter(Boolean);

    try {
      await reviewsApi.create({
        spaceId: params.id as string,
        rating: parseInt(rating, 10),
        comment: commentParts.join(' | '),
      });
      router.push('/obrigado');
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error);
      Alert.alert('Erro', 'Falha ao enviar avaliação. Tente novamente.');
      setIsSubmitting(false);
    }
  };

  const StarRating = () => (
    <View style={styles.starRating}>
      {[1, 2, 3, 4, 5].map((value) => (
        <TouchableOpacity
          key={value}
          onPress={() => setRating(value.toString())}
        >
          <Text
            style={[
              styles.starIcon,
              parseInt(rating) >= value ? styles.starFilled : {},
            ]}
          >
            ★
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <ScrollView
      style={styles.safeArea}
      contentContainerStyle={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Cores.pageBg} />

      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backButtonText}>{'< Voltar'}</Text>
      </TouchableOpacity>

      <View style={styles.evaluationFormContainer}>
        <Text style={styles.title}>Como foi sua experiência?</Text>
        <Text style={styles.evaluationContext}>
          Espaço: <Text style={{ fontWeight: 'bold' }}>{params.nome}</Text>
        </Text>

        <Text style={styles.formLabel}>Nota Geral:</Text>
        <StarRating />

        <Text style={styles.formLabel}>
          Qual foi o propósito da sua reserva?
        </Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={purpose}
            onValueChange={(itemValue) => setPurpose(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Selecione uma opção..." value="" />
            <Picker.Item
              label="Reunião com Cliente"
              value="Reunião com Cliente"
            />
            <Picker.Item label="Reunião Interna" value="Reunião Interna" />
            <Picker.Item
              label="Trabalho Focado (Individual)"
              value="Trabalho Focado (Individual)"
            />
            <Picker.Item
              label="Treinamento / Workshop"
              value="Treinamento / Workshop"
            />
            <Picker.Item label="Outro" value="Outro" />
          </Picker>
        </View>

        <Text style={styles.formLabel}>Houve algum problema técnico?</Text>
        <View style={styles.switchContainer}>
          <Text>Não</Text>
          <Switch
            trackColor={{ false: '#767577', true: Cores.primaryPurple }}
            thumbColor={'#f4f3f4'}
            onValueChange={() =>
              setHadProblem((previousState) => !previousState)
            }
            value={hadProblem}
          />
          <Text>Sim</Text>
        </View>

        {hadProblem && (
          <View style={styles.problemDetailsContainer}>
            <Text style={styles.formLabel}>
              Por favor, descreva o problema:
            </Text>
            <TextInput
              style={styles.textArea}
              placeholder="Ex: O projetor não estava conectando..."
              multiline
              numberOfLines={4}
              value={problemDetails}
              onChangeText={setProblemDetails}
            />
          </View>
        )}

        <Text style={styles.formLabel}>Sugestões de melhoria (opcional):</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Deixe seu comentário para o gestor..."
          multiline
          numberOfLines={4}
          value={feedback}
          onChangeText={setFeedback}
        />

        <View style={styles.switchContainer}>
          <Text style={styles.checkboxLabel}>
            Enviar esta avaliação anonimamente
          </Text>
          <Switch
            trackColor={{ false: '#767577', true: Cores.primaryPurple }}
            thumbColor={'#f4f3f4'}
            onValueChange={() =>
              setIsAnonymous((previousState) => !previousState)
            }
            value={isAnonymous}
          />
        </View>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.actionButtonText}>
            {isSubmitting ? 'ENVIANDO...' : 'ENVIAR AVALIAÇÃO'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Cores.pageBg,
  },
  container: {
    alignItems: 'center',
    padding: 20,
    paddingBottom: 60,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  backButtonText: {
    color: Cores.primaryPurple,
    fontSize: 16,
  },
  evaluationFormContainer: {
    width: '100%',
    maxWidth: 380,
  },
  title: {
    color: Cores.logoDark,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  evaluationContext: {
    color: Cores.textColor,
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 32,
  },
  formLabel: {
    color: Cores.textColor,
    fontWeight: '500',
    fontSize: 14,
    marginBottom: 8,
  },
  starRating: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  starIcon: {
    fontSize: 36,
    color: '#c7c7c7',
    marginHorizontal: 4, // substituto para 'gap'
  },
  starFilled: {
    color: Cores.primaryPurple,
  },
  pickerContainer: {
    backgroundColor: Cores.inputBg,
    borderRadius: 8,
    marginBottom: 24,
  },
  picker: {
    width: '100%',
    color: Cores.textColor,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  checkboxLabel: {
    flex: 1, // Permite que o texto quebre a linha
    marginRight: 10,
    color: Cores.textColor,
    fontSize: 14,
  },
  textArea: {
    backgroundColor: Cores.inputBg,
    borderWidth: 0,
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    fontSize: 16,
    color: Cores.textColor,
    width: '100%',
    minHeight: 120,
    textAlignVertical: 'top', // Para o placeholder começar em cima
  },
  problemDetailsContainer: {
    width: '100%',
  },
  actionButton: {
    backgroundColor: Cores.primaryPurple,
    borderRadius: 8,
    paddingVertical: 18,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});

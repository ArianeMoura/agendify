import { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput, Alert, Switch, StatusBar } from 'react-native'; // <-- CORREÇÃO AQUI
import { useLocalSearchParams, useRouter } from 'expo-router'; // Hooks para parâmetros e navegação
import { Picker } from '@react-native-picker/picker'; // Componente para o <select>

// Variáveis de Cor
const Cores = {
  primaryPurple: '#9345D9',
  headerPurple: '#6A0DAD',
  logoDark: '#3F3C56',
  inputBg: '#EEEEEE',
  textColor: '#555555',
  pageBg: '#FFFFFF',
};

// Componente do Ecrã de Avaliação
export default function AvaliarScreen() {
  // Hooks
  const router = useRouter(); // Para navegar de volta ou para "obrigado"
  const params = useLocalSearchParams(); // Pega os parâmetros da URL (id e nome)

  // Estados para controlar o formulário
  const [rating, setRating] = useState<string>("0");
  const [purpose, setPurpose] = useState<string>("");
  const [hadProblem, setHadProblem] = useState<boolean>(false);
  const [problemDetails, setProblemDetails] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Função de envio para o Google Forms (LÓGICA 4 do seu app.js)
  const handleSubmit = async () => {
    if (rating === "0" || !purpose) {
      Alert.alert("Campos Obrigatórios", "Por favor, selecione uma nota e um propósito.");
      return;
    }

    setIsSubmitting(true);
    const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfVu2vt6wuYLXbR1-IMotKbtc3s6EBBQ5gZfwWpFYqxwzVOeQ/formResponse';

    // Mapeia os dados do formulário para os 'entry' IDs
    const formData = new FormData();
    formData.append('entry.771112235', params.id as string); // space-id-input
    formData.append('entry.1948864566', rating); // rating-value
    formData.append('entry.1958159279', purpose); // purpose
    formData.append('entry.1106367887', hadProblem ? "Sim" : "Não"); // problema_sim/nao
    formData.append('entry.1189940137', problemDetails); // problem_details
    formData.append('entry.1480821103', feedback); // feedback
    formData.append('entry.673090461', isAnonymous ? "Sim" : "Não"); // anonymous

    try {
      await fetch(GOOGLE_FORM_URL, {
        method: 'POST',
        body: formData,
        mode: 'no-cors'
      });
      // Navega para a tela de obrigado
      router.push('/obrigado');
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      Alert.alert("Erro", "Falha ao enviar avaliação. Tente novamente.");
      setIsSubmitting(false);
    }
  };

  // Componente para as estrelas (LÓGICA 2 do seu app.js)
  const StarRating = () => (
    <View style={styles.starRating}>
      {[1, 2, 3, 4, 5].map((value) => (
        <TouchableOpacity key={value} onPress={() => setRating(value.toString())}>
          <Text style={[styles.starIcon, parseInt(rating) >= value ? styles.starFilled : {}]}>
            ★
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <ScrollView style={styles.safeArea} contentContainerStyle={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Cores.pageBg} />

      {/* Botão Voltar (Manual) */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backButtonText}>{"< Voltar"}</Text>
      </TouchableOpacity>

      <View style={styles.evaluationFormContainer}>
        <Text style={styles.title}>Como foi sua experiência?</Text>
        <Text style={styles.evaluationContext}>
          Espaço: <Text style={{ fontWeight: 'bold' }}>{params.nome}</Text>
        </Text>

        {/* --- Formulário --- */}
        <Text style={styles.formLabel}>Nota Geral:</Text>
        <StarRating />

        <Text style={styles.formLabel}>Qual foi o propósito da sua reserva?</Text>
        {/* Isto é um <select> */}
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={purpose}
            onValueChange={(itemValue) => setPurpose(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Selecione uma opção..." value="" />
            <Picker.Item label="Reunião com Cliente" value="Reunião com Cliente" />
            <Picker.Item label="Reunião Interna" value="Reunião Interna" />
            <Picker.Item label="Trabalho Focado (Individual)" value="Trabalho Focado (Individual)" />
            <Picker.Item label="Treinamento / Workshop" value="Treinamento / Workshop" />
            <Picker.Item label="Outro" value="Outro" />
          </Picker>
        </View>

        <Text style={styles.formLabel}>Houve algum problema técnico?</Text>
        {/* Isto são <radio buttons> (usamos um Switch no mobile) */}
        <View style={styles.switchContainer}>
          <Text>Não</Text>
          <Switch
            trackColor={{ false: "#767577", true: Cores.primaryPurple }}
            thumbColor={"#f4f3f4"}
            onValueChange={() => setHadProblem(previousState => !previousState)}
            value={hadProblem}
          />
          <Text>Sim</Text>
        </View>

        {/* Campo Condicional (LÓGICA 3 do seu app.js) */}
        {hadProblem && (
          <View style={styles.problemDetailsContainer}>
            <Text style={styles.formLabel}>Por favor, descreva o problema:</Text>
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

        {/* Isto é um <checkbox> (usamos um Switch no mobile) */}
        <View style={styles.switchContainer}>
          <Text style={styles.checkboxLabel}>Enviar esta avaliação anonimamente</Text>
          <Switch
            trackColor={{ false: "#767577", true: Cores.primaryPurple }}
            thumbColor={"#f4f3f4"}
            onValueChange={() => setIsAnonymous(previousState => !previousState)}
            value={isAnonymous}
          />
        </View>

        {/* Botão de Envio */}
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.actionButtonText}>
            {isSubmitting ? "ENVIANDO..." : "ENVIAR AVALIAÇÃO"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// 
// Estilos (CSS) MÍNIMOS para este ecrã
// 
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Cores.pageBg,
  },
  container: {
    alignItems: 'center',
    padding: 20,
    paddingBottom: 60, // Mais espaço no final
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
  // Estrelas
  starRating: {
    flexDirection: 'row',
    justifyContent: 'center',
    // gap: 8, // 'gap' pode ser instável na web, usando margem
    marginBottom: 24,
  },
  starIcon: {
    fontSize: 36,
    color: '#c7c7c7', // Cinza (vazio)
    marginHorizontal: 4, // substituto para 'gap'
  },
  starFilled: {
    color: Cores.primaryPurple,
  },
  // Select (Picker)
  pickerContainer: {
    backgroundColor: Cores.inputBg,
    borderRadius: 8,
    marginBottom: 24,
  },
  picker: {
    width: '100%',
    color: Cores.textColor,
  },
  // Switch (Radio / Checkbox)
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
  // Text Area
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
  // Botão
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
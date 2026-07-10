import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Link } from 'expo-router';

const Cores = {
  primaryPurple: '#9543dcff',
  headerPurple: '#6A0DAD',
  logoDark: '#3F3C56',
  textColor: '#555555',
  pageBg: '#ffffffff',
};

export default function ObrigadoScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Cores.headerPurple}
      />

      <View style={styles.topBar}></View>

      <View style={styles.loginContainer}>
        <View style={styles.recoveryContent}>
          {/* O ícone de check foi removido para evitar erros de pacote */}
          <Text style={styles.checkIcon}>✔</Text>

          <Text style={styles.recoveryTitle}>Avaliação Enviada!</Text>
          <Text style={styles.recoveryText}>
            Obrigado pelo seu feedback. Sua opinião é muito importante para
            melhorarmos nossos espaços.
          </Text>

          <Link href="/(tabs)" asChild>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>AVALIAR OUTRO ESPAÇO</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Cores.pageBg,
  },
  topBar: {
    width: '100%',
    height: 60,
    backgroundColor: Cores.headerPurple,
  },
  loginContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  recoveryContent: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },

  checkIcon: {
    fontSize: 80,
    color: Cores.primaryPurple,
    fontWeight: 'bold',
  },
  recoveryTitle: {
    color: Cores.logoDark,
    fontWeight: '700',
    fontSize: 24,
    marginTop: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  recoveryText: {
    color: Cores.textColor,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
    textAlign: 'center',
  },

  actionButton: {
    width: '100%',
    backgroundColor: Cores.primaryPurple,
    borderRadius: 8,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 16,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

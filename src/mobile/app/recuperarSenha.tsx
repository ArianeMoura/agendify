import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, StatusBar, Linking } from 'react-native';
import { Link } from 'expo-router';

const Cores = {
  primaryPurple: '#9345D9',
  headerPurple: '#6A0DAD',
  logoDark: '#3F3C56',
  textColor: '#555555',
  pageBg: '#FFFFFF',
};

export default function RecuperarSenhaScreen() {
  const handleAbrirEmail = () => {
    Linking.openURL('mailto:admagendify@email.com?subject=Recuperação de Senha - AgendifyApp');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Cores.headerPurple} />
      <View style={styles.topBar}></View>

      <View style={styles.loginContainer}>

        <View style={styles.logo}>
          <View style={styles.logoIconWrapper}>
            <View style={{width: 50, height: 50}} />
          </View>
          <Text style={styles.logoText}>
            <Text style={styles.logoPart1}>Agendify</Text>
            <Text style={styles.logoPart2}>App</Text>
          </Text>
        </View>

        <View style={styles.recoveryContent}>
          <Text style={styles.recoveryTitle}>Recuperar Senha</Text>
          <Text style={styles.recoveryText}>
            Para iniciar o processo de redefinição, envie um e-mail para o nosso suporte e nossa equipe irá ajudá-lo.
          </Text>
          <Text style={styles.emailAddress}>admagendify@email.com</Text>
          <TouchableOpacity style={styles.actionButton} onPress={handleAbrirEmail}>
            <Text style={styles.actionButtonText}>ABRIR E-MAIL</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.forgotPassword}>
          <Link href="/">
            <Text style={styles.forgotPasswordLink}>Lembrou sua senha? Voltar para o Login</Text>
          </Link>
        </Text>

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
  logo: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoIconWrapper: {
    backgroundColor: Cores.headerPurple,
    borderRadius: 50,
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  logoText: {
    marginTop: 16,
    fontSize: 32,
    fontWeight: '700',
  },
  logoPart1: {
    color: Cores.logoDark,
  },
  logoPart2: {
    color: Cores.primaryPurple,
  },
  recoveryContent: {
    width: '100%',
    maxWidth: 350,
    alignItems: 'center',
    textAlign: 'center',
  },
  recoveryTitle: {
    color: Cores.logoDark,
    fontWeight: '700',
    fontSize: 24, 
    marginBottom: 16,
  },
  recoveryText: {
    color: Cores.textColor,
    fontSize: 16, 
    lineHeight: 24, 
    marginBottom: 16,
    textAlign: 'center',
  },
  emailAddress: {
    fontSize: 18, 
    fontWeight: '700',
    color: Cores.primaryPurple,
    marginBottom: 32, 
  },
  actionButton: {
    width: '100%', 
    backgroundColor: Cores.primaryPurple,
    borderRadius: 8,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  forgotPassword: {
    marginTop: 24, 
    color: Cores.textColor,
    fontSize: 14, 
    textAlign: 'center',
    maxWidth: 350, 
  },
  forgotPasswordLink: {
    color: Cores.textColor,
    fontWeight: '500',
    textDecorationLine: 'none',
  },
});
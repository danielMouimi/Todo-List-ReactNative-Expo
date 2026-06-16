import React, { useState, useEffect } from 'react';
import '@react-native-firebase/app';
import { View, Text, TextInput, StyleSheet, Alert, ActivityIndicator, SafeAreaView, TouchableOpacity} from 'react-native';
import { Button } from '@react-navigation/elements';
import { useNavigation } from '@react-navigation/native';
// Temporarily commented out Firebase
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export default function LoginScreen() {
  const navigation = useNavigation();
  
  // Estados para el formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Función para procesar el inicio de sesión - TEMPORARILY DISABLED
  const handleLogin = async () => {
    // For now, just navigate to MainTabs to test the rest of the app
    if (!email || !password) {
      Alert.alert('Error', 'Por favor, rellena todos los campos.');
      return;
    }

    setLoading(true);
    try {
    const userCredential = await auth().signInWithEmailAndPassword(email.trim(), password);
    const user = userCredential.user;
    if (!user.emailVerified) {
      Alert.alert('Cuenta no verificada', 'Por favor, verifica tu correo electrónico antes de iniciar sesión.');
      await auth().signOut();
      return;
    }
    Alert.alert('¡Bienvenido!', `Has iniciado sesión como ${user.email}`);
    navigation.navigate('Home');
    } catch (error) {
      console.error(error);
      // 4. Control de errores típicos de Firebase Auth
      let errorMessage = 'Ocurrió un error inesperado. Inténtalo de nuevo.';
      
      if (error.code === 'auth/invalid-email') {
        errorMessage = 'El formato del correo electrónico no es válido.';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'El correo o la contraseña son incorrectos.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No existe ninguna cuenta con este correo.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'La contraseña es incorrecta.';
      }
      
      Alert.alert('Error de acceso', errorMessage);
    } finally {
      setLoading(false);
    }
  };


const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Atención', 'Por favor, introduce tu correo electrónico en el campo de arriba para poder enviarte el enlace de recuperación.');
      return;
    }

    try {
      await auth().sendPasswordResetEmail(email.trim());
      Alert.alert('Correo enviado', 'Se ha enviado un enlace de restablecimiento a tu correo electrónico.');
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/invalid-email') {
        Alert.alert('Error', 'El formato del correo electrónico no es válido.');
      } else if (error.code === 'auth/user-not-found') {
        Alert.alert('Error', 'No existe ningún usuario registrado con este correo electrónico.');
      } else {
        Alert.alert('Error', 'No se pudo enviar el correo de recuperación. Inténtalo más tarde.');
      }
    }
  };







return (
  <SafeAreaView style={styles.container}>
    <View style={styles.content}>

      <View style={styles.appHeader}>
        <Text style={styles.appLogo}>✓</Text>
        <Text style={styles.appTitle}>Tareas Juncaril</Text>
        <Text style={styles.appSubtitle}>
          Gestión colaborativa de tareas y equipos
        </Text>
      </View>

      <View style={styles.loginCard}>

        <Text style={styles.cardTitle}>
          Iniciar sesión
        </Text>

        <Text style={styles.cardSubtitle}>
          Accede a tus proyectos, tareas y grupos de trabajo.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          placeholderTextColor="#9CA3AF"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor="#9CA3AF"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#111827"
            style={{ marginVertical: 20 }}
          />
        ) : (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleLogin}
          >
            <Text style={styles.primaryButtonText}>
              Entrar
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.registerLink}>
            ¿No tienes cuenta? Crear cuenta
          </Text>
        </TouchableOpacity>
        <TouchableOpacity          onPress={handleForgotPassword}
        >
          <Text style={[styles.registerLink, { marginTop: 10 }]}>
            ¿Olvidaste tu contraseña?
          </Text>
        </TouchableOpacity>

      </View>

      <View style={styles.separatorContainer}>
        <View style={styles.separatorLine} />
        <Text style={styles.separatorText}>O</Text>
        <View style={styles.separatorLine} />
      </View>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.secondaryButtonText}>
          Volver al inicio
        </Text>
      </TouchableOpacity>

    </View>
  </SafeAreaView>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },

  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
  },

  appHeader: {
    alignItems: 'center',
    marginBottom: 35,
  },

  appLogo: {
    fontSize: 52,
    marginBottom: 10,
  },

  appTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#111827',
  },

  appSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 6,
    textAlign: 'center',
  },

  loginCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,

    elevation: 5,
  },

  cardTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },

  cardSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 25,
    lineHeight: 22,
  },

  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    fontSize: 16,
    marginBottom: 15,
    color: '#111827',
  },

  primaryButton: {
    backgroundColor: '#111827',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  registerLink: {
    marginTop: 20,
    textAlign: 'center',
    color: '#2563EB',
    fontSize: 15,
    fontWeight: '600',
  },

  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 25,
  },

  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },

  separatorText: {
    marginHorizontal: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },

  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
 
  secondaryButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
});
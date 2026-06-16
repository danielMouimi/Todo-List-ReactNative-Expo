import React, { useState, useEffect } from 'react';
import '@react-native-firebase/app';
import { View, Text, TextInput, StyleSheet, Alert, ActivityIndicator, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { Button } from '@react-navigation/elements'; // Manteniendo tu librería de diseño
import { useNavigation } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import { UserService } from '../services/FirebaseService'; 
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export default function RegisterScreen() {
  const navigation = useNavigation();

  // Estados para el formulario de registro
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
  GoogleSignin.configure({
    // El webClientId es CRUCIAL para que Firebase funcione.
    // Lo encuentras en tu archivo google-services.json (como client_id de tipo 3)
    // o en la consola de Firebase -> Configuración del proyecto.
    webClientId: '174796503128-l9l5q7p6lv7ta0i2bdfp93eev1bbeup5.apps.googleusercontent.com', 
    
    offlineAccess: true, // Opcional, si necesitas access token del servidor
  });
}, []);

  // Función para procesar el registro de usuario
  const handleRegister = async () => {
    // 1. Validación de campos vacíos
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Por favor, rellena todos los campos.');
      return;
    }

    // 2. Validación de coincidencia de contraseñas
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }

    // 3. Validación de longitud mínima (regla por defecto de Firebase)
    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      // Llamada a Firebase para crear el usuario
      const userCredential = await auth().createUserWithEmailAndPassword(email.trim(), password);
      await userCredential.user.sendEmailVerification(); // Enviar correo de verificación
      await UserService.createUserProfile(userCredential.user.uid, { email: email.trim() }); // Crear perfil adicional en Firestore
      Alert.alert('¡Cuenta creada!', 
        'Te hemos enviado un correo de confirmación. Por favor, verifica tu bandeja de entrada. revisa el spam', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (error) {
      console.error(error);
      // Manejo de errores comunes de Firebase al registrar
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert('Error de registro', 'Ese correo electrónico ya está en uso por otra cuenta.');
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert('Error de registro', 'El formato del correo electrónico no es válido.');
      } else {
        Alert.alert('Error', 'Ocurrió un error al registrar la cuenta. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };




const [googleLoading, setGoogleLoading] = useState(false);

const handleGoogleSignIn = async () => {
  setGoogleLoading(true);
  try {
    // 1. Iniciar el flujo nativo de Google
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const signInResultData = await GoogleSignin.signIn();
    
    // CORRECCIÓN: Acceso directo al token (depende de tu versión, pero suele ser directo)
    const idToken = signInResultData.idToken || signInResultData.data?.idToken;

    if (!idToken) throw new Error('No se recibió el ID Token');

    // 2. Vincular el token con las credenciales de Firebase
    // CORRECCIÓN: Asegurar que llamamos bien al proveedor
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);
    
    // 3. Iniciar sesión en Firebase
    await auth().signInWithCredential(googleCredential);
    
  } catch (error) {
    console.error(error);
    
    // Buena práctica: capturar si el usuario simplemente canceló el flujo
    if (error.code === 'SIGN_IN_CANCELLED') {
      return; // El usuario canceló, no mostramos alerta
    }
    
    if (error.code !== 'ASYNC_OP_IN_PROGRESS') {
      Alert.alert('Error', 'No se pudo autenticar con Google en Firebase.');
    }
  } finally {
    setGoogleLoading(false);
  }
};

return (
  <SafeAreaView style={styles.container}>
      <ScrollView
    contentContainerStyle={styles.scrollContent}
    showsVerticalScrollIndicator={false}
    keyboardShouldPersistTaps="handled"
  >
    <View style={styles.content}>

      <View style={styles.appHeader}>
        <Text style={styles.appLogo}>✓</Text>

        <Text style={styles.appTitle}>
          Únete a Tareas Juncaril
        </Text>

        <Text style={styles.appSubtitle}>
          Empieza a gestionar equipos, tareas y proyectos
          de forma más eficiente.
        </Text>
      </View>

      <View style={styles.registerCard}>

        <Text style={styles.cardTitle}>
          Crear cuenta
        </Text>

        <Text style={styles.cardSubtitle}>
          Crea tu espacio de trabajo y comienza a colaborar
          con tu equipo en minutos.
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
          placeholder="Contraseña (mínimo 6 caracteres)"
          placeholderTextColor="#9CA3AF"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          style={styles.input}
          placeholder="Confirmar contraseña"
          placeholderTextColor="#9CA3AF"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
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
            onPress={handleRegister}
          >
            <Text style={styles.primaryButtonText}>
              Crear Cuenta
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginLink}>
            ¿Ya tienes cuenta? Iniciar sesión
          </Text>
        </TouchableOpacity>

      </View>

      <View style={styles.benefitsCard}>
        <Text style={styles.benefitsTitle}>
          Lo que podrás hacer
        </Text>

        <Text style={styles.benefitItem}>
          👥 Crear grupos de trabajo
        </Text>

        <Text style={styles.benefitItem}>
          📝 Asignar tareas a miembros
        </Text>

        <Text style={styles.benefitItem}>
          📅 Organizar tareas diarias y semanales
        </Text>

        <Text style={styles.benefitItem}>
          📊 Supervisar el progreso del equipo
        </Text>
      </View>

      <View style={styles.separatorContainer}>
        <View style={styles.separatorLine}/>
        <Text style={styles.separatorText}>O</Text>
        <View style={styles.separatorLine}/>
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
    </ScrollView>
  </SafeAreaView>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },

scrollContent: {
  flexGrow: 1,
},

content: {
  paddingHorizontal: 28,
  paddingVertical: 30,
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
  registerCard: {
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

loginLink: {
  marginTop: 20,
  textAlign: 'center',
  color: '#2563EB',
  fontWeight: '600',
  fontSize: 15,
},

benefitsCard: {
  marginTop: 20,
  backgroundColor: '#FFFFFF',
  borderRadius: 20,
  padding: 20,

  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 3,
  },
  shadowOpacity: 0.05,
  shadowRadius: 8,

  elevation: 3,
},

benefitsTitle: {
  fontSize: 18,
  fontWeight: '700',
  color: '#111827',
  marginBottom: 15,
},

benefitItem: {
  fontSize: 15,
  color: '#4B5563',
  marginBottom: 10,
},
});

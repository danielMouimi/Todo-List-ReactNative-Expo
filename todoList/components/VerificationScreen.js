import React, { useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import auth from '@react-native-firebase/auth';

export default function VerificationScreen() {
  const [loading, setLoading] = useState(false);

  const checkVerification = async () => {
    setLoading(true);
    try {
      const user = auth().currentUser;
      
      if (user) {
        // CRUCIAL: Recarga el usuario para traer el estado actualizado desde los servidores de Firebase
        await user.reload(); 
        
        if (auth().currentUser.emailVerified) {
          Alert.alert('¡Éxito!', 'Tu correo ha sido verificado. Bienvenido.');
          // Tu lógica de navegación aquí cambiará automáticamente si escuchas el auth().onAuthStateChanged
        } else {
          Alert.alert('Todavía no', 'No hemos detectado la verificación. Revisa tu correo nuevamente.');
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resendEmail = async () => {
    try {
      await auth().currentUser?.sendEmailVerification();
      Alert.alert('Enviado', 'Te hemos reenviado el correo de verificación.');
    } catch (error) {
      Alert.alert('Error', 'Espera un momento antes de solicitar otro correo.');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 18, textAlign: 'center', marginBottom: 20 }}>
        Por favor, verifica tu correo electrónico para continuar.
      </Text>
      
      <Button title={loading ? "Verificando..." : "Ya hice clic en el enlace"} onPress={checkVerification} disabled={loading} />
      <Text style={{ marginVertical: 10 }}>¿No te llegó?</Text>
      <Button title="Reenviar correo" onPress={resendEmail} color="gray" />
    </View>
  );
}
import React, { useState } from 'react';
import '@react-native-firebase/app';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { GroupService } from '../../services/FirebaseService';
import { useNavigation } from '@react-navigation/native';

export default function JoinGroup() {
  const navigation = useNavigation();
  const [groupId, setGroupId] = useState('');
  const [loading, setLoading] = useState(false);
  const user = auth().currentUser;

  const handleSendRequest = async () => {
    const cleanGroupId = groupId.trim();
    
    if (!cleanGroupId) {
      Alert.alert('Atención', 'Por favor, introduce el ID del grupo.');
      return;
    }

    try {
      setLoading(true);

      // 1. Validar si el grupo existe en Firestore antes de procesar
      const groupData = await GroupService.getGroupDetail(cleanGroupId);

      // 2. Criterio de Seguridad: Verificar si ya forma parte de los miembros
      if (groupData.members && groupData.members.includes(user.uid)) {
        Alert.alert('Información', 'Ya eres miembro de este grupo de trabajo.');
        setLoading(false);
        return;
      }

      // 3. Criterio de Seguridad: Verificar si ya tiene una solicitud pendiente de aprobación
      const existingRequests = groupData.joinRequests || [];
      const hasPending = existingRequests.some(
        req => req.userId === user.uid && req.status === 'pending'
      );

      if (hasPending) {
        Alert.alert('Solicitud Duplicada', 'Ya has enviado una solicitud a este grupo. Está pendiente de aprobación por el Administrador.');
        setLoading(false);
        return;
      }

      // 4. Si pasa los filtros, se ejecuta el servicio de Firebase proporcionado
      await GroupService.requestJoinGroup(cleanGroupId, user.uid, user.email);

      Alert.alert(
        'Éxito', 
        `Solicitud enviada correctamente al grupo "${groupData.name}". El administrador revisará tu petición.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );

    } catch (error) {
      console.error('Error al unirse al grupo:', error);
      // El método getGroupDetail lanza un error si el documento .exists es false
      Alert.alert('Error', 'No se encontró ningún grupo con ese código o ID. Revisa que esté bien escrito.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} bounces={false}>
        <View style={styles.container}>
          <Text style={styles.iconHeader}>🔗</Text>
          <Text style={styles.title}>Unirse a un grupo</Text>
          <Text style={styles.subtitle}>
            Introduce el identificador único del grupo de trabajo para solicitar el acceso.
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>ID Único del Grupo *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: JXb82nsK91laOPw..."
              placeholderTextColor="#A9A9A9"
              value={groupId}
              onChangeText={setGroupId}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={handleSendRequest}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Enviar Solicitud</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#F5F5F5',
  },
  container: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconHeader: {
    fontSize: 56,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  inputContainer: {
    width: '100%',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
    backgroundColor: '#FAFAFA',
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E5E5E5',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 15,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
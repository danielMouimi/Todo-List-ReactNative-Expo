import React, { useState } from 'react';
import '@react-native-firebase/app';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { GroupService } from '../../services/FirebaseService';
import { useNavigation } from '@react-navigation/native';

export default function CreateGroup() {
  const navigation = useNavigation();
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const user = auth().currentUser;

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Por favor, ingresa un nombre para el grupo');
      return;
    }

    try {
      setLoading(true);

      const groupData = {
        name: groupName.trim(),
        description: description.trim(),
      };

      const newGroup = await GroupService.createGroup(groupData);

      Alert.alert('Éxito', 'Grupo creado correctamente', [
        {
          text: 'OK',
          onPress: () => {
            navigation.goBack();
            navigation.navigate('GroupDetail', { groupId: newGroup.id });
          },
        },
      ]);
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'No se pudo crear el grupo');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Creando grupo...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Crear Nuevo Grupo</Text>
        <Text style={styles.subtitle}>
          Los grupos te permiten colaborar con otros usuarios y asignar tareas
        </Text>
      </View>

      {/* Nombre del grupo */}
      <View style={styles.section}>
        <Text style={styles.label}>Nombre del grupo *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Proyecto Marketing"
          value={groupName}
          onChangeText={setGroupName}
          maxLength={50}
          placeholderTextColor="#ccc"
        />
        <Text style={styles.charCount}>{groupName.length}/50</Text>
      </View>

      {/* Descripción */}
      <View style={styles.section}>
        <Text style={styles.label}>Descripción</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe el propósito del grupo (opcional)"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          maxLength={200}
          placeholderTextColor="#ccc"
        />
        <Text style={styles.charCount}>{description.length}/200</Text>
      </View>

      {/* Info sobre permisos */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>📋 Información importante:</Text>
        <Text style={styles.infoText}>
          • Serás el administrador de este grupo
        </Text>
        <Text style={styles.infoText}>
          • Podrás aceptar o rechazar solicitudes de otros usuarios
        </Text>
        <Text style={styles.infoText}>
          • Podrás asignar tareas a los miembros del grupo
        </Text>
        <Text style={styles.infoText}>
          • Podrás ver el progreso de cada miembro
        </Text>
      </View>

      {/* Botones de acción */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.button, styles.buttonCancel]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonCancelText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.buttonCreate]}
          onPress={handleCreateGroup}
          disabled={!groupName.trim()}
        >
          <Text style={styles.buttonCreateText}>Crear grupo</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'right',
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#0D47A1',
    marginBottom: 6,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 40,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonCancel: {
    backgroundColor: '#F0F0F0',
  },
  buttonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  buttonCreate: {
    backgroundColor: '#007AFF',
  },
  buttonCreateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});

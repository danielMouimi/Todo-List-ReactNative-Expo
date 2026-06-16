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
import { TaskService } from '../../services/FirebaseService';
import { PRIORITY_LEVELS, TASK_TYPES } from '../../constants/AppConstants';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function CreateTask() {
  const navigation = useNavigation();
  const route = useRoute();
  
  // 🛠️ Extraemos tanto el groupId como el posible assignedUserId enviado desde GroupDetail
  const { groupId, assignedUserId } = route.params || {};
  const user = auth().currentUser;
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('high');
  const [type, setType] = useState('daily');
  const [dueDaysFromNow, setDueDaysFromNow] = useState(7);
  const [loading, setLoading] = useState(false);

  const getDueDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + dueDaysFromNow);
    return date;
  };

  const handleCreateTask = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Por favor, ingresa un título para la tarea');
      return;
    }

    try {
      setLoading(true);
      
      const taskData = {
        title: title.trim(),
        description: description.trim(),
        priority,
        type,
        dueDate: getDueDate(),
        groupId: groupId || null,
        // 🛠️ Si el Admin la crea para un miembro, usamos assignedUserId, de lo contrario es propia (user.uid)
        userId: assignedUserId || user.uid, 
      };

      console.log('Datos de la tarea a crear:', taskData);
      console.log(route.params);
      await TaskService.createTask(taskData);
      
      Alert.alert('Éxito', 'Tarea creada correctamente', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error creating task:', error);
      Alert.alert('Error', 'No se pudo crear la tarea');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 8 }}>Creando tarea...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Indicador visual si el Admin está delegando la tarea */}
      {assignedUserId && (
        <View style={styles.delegatedInfoBanner}>
          <Text style={styles.delegatedInfoText}>
            📌 Asignando esta tarea a un miembro del grupo de trabajo
          </Text>
        </View>
      )}

      {/* Título */}
      <View style={styles.section}>
        <Text style={styles.label}>Título *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ingresa el título de la tarea"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
          placeholderTextColor="#ccc"
        />
      </View>

      {/* Descripción */}
      <View style={styles.section}>
        <Text style={styles.label}>Descripción</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Ingresa una descripción (opcional)"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          maxLength={500}
          placeholderTextColor="#ccc"
        />
      </View>

      {/* Tipo de tarea */}
      <View style={styles.section}>
        <Text style={styles.label}>Tipo de tarea</Text>
        <View style={styles.buttonGroup}>
          {Object.entries(TASK_TYPES).map(([key, taskType]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.groupButton,
                type === taskType.value && styles.groupButtonActive,
              ]}
              onPress={() => setType(taskType.value)}
            >
              <Text
                style={[
                  styles.groupButtonText,
                  type === taskType.value && styles.groupButtonTextActive,
                ]}
              >
                {taskType.icon} {taskType.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Prioridad */}
      <View style={styles.section}>
        <Text style={styles.label}>Prioridad</Text>
        <View style={styles.priorityContainer}>
          {Object.entries(PRIORITY_LEVELS).map(([key, priorityLevel]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.priorityButton,
                priority === priorityLevel.value && styles.priorityButtonActive,
              ]}
              onPress={() => setPriority(priorityLevel.value)}
            >
              <View
                style={[
                  styles.priorityColor,
                  { backgroundColor: priorityLevel.color },
                ]}
              />
              <Text style={styles.priorityText}>{priorityLevel.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Fecha de vencimiento */}
      <View style={styles.section}>
        <Text style={styles.label}>Fecha de vencimiento (en días)</Text>
        <View style={styles.dateContainer}>
          {[1, 3, 7, 14, 30].map(days => (
            <TouchableOpacity
              key={days}
              style={[
                styles.dateButton,
                dueDaysFromNow === days && styles.dateButtonActive,
              ]}
              onPress={() => setDueDaysFromNow(days)}
            >
              <Text
                style={[
                  styles.dateButtonText,
                  dueDaysFromNow === days && styles.dateButtonTextActive,
                ]}
              >
                {days} día{days > 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.dueDateInfo}>
          Vencimiento: {getDueDate().toLocaleDateString()}
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
          onPress={handleCreateTask}
        >
          <Text style={styles.buttonCreateText}>Crear tarea</Text>
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
  delegatedInfoBanner: {
    backgroundColor: '#E1F5FE',
    borderWidth: 1,
    borderColor: '#B3E5FC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  delegatedInfoText: {
    color: '#0288D1',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
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
    color: '#333',
  },
  textArea: {
    textAlignVertical: 'top',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  groupButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  groupButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  groupButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  groupButtonTextActive: {
    color: '#FFF',
  },
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  priorityButtonActive: {
    borderWidth: 2,
    borderColor: '#333',
  },
  priorityColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  dateContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  dateButton: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dateButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  dateButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  dateButtonTextActive: {
    color: '#FFF',
  },
  dueDateInfo: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
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
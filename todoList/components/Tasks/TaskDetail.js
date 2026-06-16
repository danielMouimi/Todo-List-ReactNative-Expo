import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import { TaskService, GroupService, UserService } from '../../services/FirebaseService';
import { PRIORITY_LEVELS, TASK_TYPES } from '../../constants/AppConstants';

export default function TaskDetail() {
  const navigation = useNavigation();
  const route = useRoute();
  const { taskId } = route.params || {};

  const currentUser = auth().currentUser;
  const [task, setTask] = useState(null);
  const [group, setGroup] = useState(null);
  const [assignedUser, setAssignedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Sincronizar datos cada vez que la pantalla gane el foco
  useFocusEffect(
    useCallback(() => {
      if (!taskId) {
        Alert.alert('Error', 'ID de tarea no válido');
        navigation.goBack();
        return;
      }
      loadTaskDetails();
    }, [taskId])
  );

  const loadTaskDetails = async () => {
    try {
      setLoading(true);
      // 1. Obtener los datos de la tarea
      const taskData = await TaskService.getTaskDetail(taskId);
      setTask(taskData);

      // 2. Si la tarea pertenece a un grupo, obtener los detalles del grupo para validar si es Admin
      if (taskData.groupId) {
        const groupData = await GroupService.getGroupDetail(taskData.groupId);
        setGroup(groupData);
      }

      // 3. Obtener el perfil del usuario asignado
      if (taskData.userId) {
        const userData = await UserService.getUserProfile(taskData.userId);
        setAssignedUser(userData);
      }
    } catch (error) {
      console.error('Error loading task details:', error);
      Alert.alert('Error', 'No se pudo cargar la información de la tarea');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  // --- CONTROLADORES DE ACCIÓN ---

  const handleToggleStatus = async () => {
    try {
      setActionLoading(true);
      if (task.status === 'completed') {
        await TaskService.updateTask(taskId, { status: 'pending' });
        setTask(prev => ({ ...prev, status: 'pending' }));
      } else {
        await TaskService.completeTask(taskId);
        setTask(prev => ({ ...prev, status: 'completed' }));
      }
      Alert.alert('Éxito', 'Estado de la tarea actualizado');
    } catch (error) {
      Alert.alert('Error', 'No se pudo cambiar el estado de la tarea');
    } finally {
      setActionLoading(false);
    }
  };



  if (loading || !task) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 8 }}>Cargando detalles...</Text>
      </View>
    );
  }

  // Permisos: Puede editar/borrar si es el admin del grupo o si la tarea le pertenece a él
  const isGroupAdmin = group?.admin === currentUser.uid;
  const isTaskOwner = task.userId === currentUser.uid;
  const hasPermissions = isGroupAdmin || isTaskOwner;

  // Mapeos visuales basados en tus constantes
  const currentPriority = PRIORITY_LEVELS[task.priority?.toUpperCase()] || { label: task.priority, color: '#8E8E93' };
  const currentType = Object.values(TASK_TYPES).find(t => t.value === task.type) || { label: task.type, icon: '📌' };

  // Formatear Fecha de Firebase (Timestamp o Date)
  const formatDueDate = (dateInput) => {
    if (!dateInput) return 'Sin fecha';
    const date = dateInput.toDate ? dateInput.toDate() : new Date(dateInput);
    return date.toLocaleDateString();
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* ETIQUETAS SUPERIORES (Badge de Estado y Tipo) */}
        <View style={styles.badgeRow}>
          <View style={[styles.statusBadge, task.status === 'completed' ? styles.badgeSuccess : styles.badgePending]}>
            <Text style={task.status === 'completed' ? styles.textSuccess : styles.textPending}>
              {task.status === 'completed' ? '✓ Completada' : '⏳ Pendiente'}
            </Text>
          </View>
          
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{currentType.icon} {currentType.label}</Text>
          </View>
        </View>

        {/* TÍTULO Y DESCRIPCIÓN */}
        <Text style={styles.title}>{task.title}</Text>
        
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Descripción</Text>
          <Text style={styles.description}>
            {task.description || 'Esta tarea no contiene una descripción detallada.'}
          </Text>
        </View>

        {/* METADATOS (Prioridad, Vencimiento, Grupo) */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Detalles de asignación</Text>
          
          <View style={styles.metaRow}>
            <Text style={styles.metaKey}>Prioridad:</Text>
            <View style={styles.priorityIndicatorRow}>
              <View style={[styles.priorityDot, { backgroundColor: currentPriority.color }]} />
              <Text style={[styles.metaValue, { color: currentPriority.color, fontWeight: '700' }]}>
                {currentPriority.label}
              </Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaKey}>Fecha Límite:</Text>
            <Text style={[styles.metaValue, styles.dueDateText]}>{formatDueDate(task.dueDate)}</Text>
          </View>

          {group && (
            <View style={styles.metaRow}>
              <Text style={styles.metaKey}>Grupo:</Text>
              <Text style={styles.metaValue}>{group.name}</Text>
            </View>
          )}

          {assignedUser && (
            <View style={styles.metaRow}>
              <Text style={styles.metaKey}>Asignado a:</Text>
              <Text style={styles.metaValue}>{isTaskOwner ? 'A ti' : assignedUser.name}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* BOTONES DE ACCIÓN FLOTANTES / INFERIORES */}
      {hasPermissions && (
        <View style={styles.actionFooter}>
          {actionLoading ? (
            <ActivityIndicator size="small" color="#007AFF" style={{ padding: 16 }} />
          ) : (
            <>

              <TouchableOpacity
                style={[styles.btnAction, task.status === 'completed' ? styles.btnReopen : styles.btnComplete]}
                onPress={handleToggleStatus}
              >
                <Text style={styles.btnActionText}>
                  {task.status === 'completed' ? 'Reabrir Tarea' : 'Marcar como Hecha'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100, // Espacio para que el footer no tape el contenido
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgePending: {
    backgroundColor: '#FFF3CD',
  },
  badgeSuccess: {
    backgroundColor: '#D1E7DD',
  },
  textPending: {
    color: '#856404',
    fontSize: 12,
    fontWeight: '700',
  },
  textSuccess: {
    color: '#0F5132',
    fontSize: 12,
    fontWeight: '700',
  },
  typeBadge: {
    backgroundColor: '#E9ECEF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CED4DA',
  },
  typeBadgeText: {
    color: '#495057',
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    elevation: 1,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6C757D',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 15,
    color: '#495057',
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  metaKey: {
    fontSize: 14,
    color: '#6C757D',
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 14,
    color: '#212529',
    fontWeight: '600',
  },
  priorityIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  dueDateText: {
    color: '#007AFF',
  },
  actionFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#EAEAEA',
    gap: 12,
  },
  btnAction: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDelete: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DC3545',
    flex: 0.4, // El botón eliminar es un poco más pequeño proporcionalmente
  },
  btnDeleteText: {
    color: '#DC3545',
    fontSize: 15,
    fontWeight: '600',
  },
  btnComplete: {
    backgroundColor: '#34C759',
  },
  btnReopen: {
    backgroundColor: '#6C757D',
  },
  btnActionText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
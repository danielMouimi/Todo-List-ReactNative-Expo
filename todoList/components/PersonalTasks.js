import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import '@react-native-firebase/app';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { TaskService } from '../services/FirebaseService';
import TaskCard from './Common/TaskCard';
import { TASK_TYPES } from '../constants/AppConstants';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function PersonalTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'daily', 'weekly', 'monthly'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'completed'
  const navigation = useNavigation();
  const route = useRoute();
  const user = auth().currentUser;



    useFocusEffect(
      React.useCallback(() => {
        // 1. Creamos una función interna normal
        const fetchTasks = async () => {
          console.log('La pantalla está enfocada, cargando tareas...');
          await loadTasks(); // Ejecutamos tu función de Firebase
        };
  
        // 2. La llamamos inmediatamente
        fetchTasks();
  
        // 3. Opcional: devolvemos un retorno vacío para que React Navigation esté feliz
        return () => {
          console.log('El usuario ha salido de la pantalla de tareas.');
        };
      }, [filter, statusFilter]) // Corchetes vacíos en el useCallback para que la función se mantenga estable
    );

  const loadTasks = async () => {
    if (!user) {
      Alert.alert('Error', 'Usuario no autenticado');
      return;
    }
    try {
      setLoading(true);
      console.log('Loading tasks for user:', user);
    let taskList = await TaskService.getUserTasks(user.uid);

      // Filtrar por tipo
      if (filter !== 'all') {
        taskList = taskList.filter(t => t.type === filter);
      }

      // Filtrar por estado
      if (statusFilter !== 'all') {
        taskList = taskList.filter(t => t.status === statusFilter);
      }

      setTasks(taskList);
    } catch (error) {
      console.error('Error loading tasks:', error);
      Alert.alert('Error', 'No se pudieron cargar las tareas');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      await TaskService.completeTask(taskId);
      await loadTasks();
    } catch (error) {
      Alert.alert('Error', 'No se pudo completar la tarea');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await TaskService.deleteTask(taskId);
      await loadTasks();
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar la tarea');
    }
  };

  const handleCreateTask = () => {
    navigation.navigate('CreateTask', { groupId: null }); // null = tarea personal
  };

  const getStatistics = () => {
    const pending = tasks.filter(t => t.status === 'pending').length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const total = tasks.length;

    return { pending, completed, total };
  };

  const stats = getStatistics();

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Cargando tareas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header con estadísticas */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#FFC400' }]}>
            {stats.pending}
          </Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#69F0AE' }]}>
            {stats.completed}
          </Text>
          <Text style={styles.statLabel}>Completadas</Text>
        </View>
      </View>

      {/* Filtros */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
      >
        {/* Filtro por tipo */}
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'all' && styles.filterBtnActive]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[
              styles.filterBtnText,
              filter === 'all' && styles.filterBtnTextActive,
            ]}
          >
            Todas
          </Text>
        </TouchableOpacity>

        {Object.entries(TASK_TYPES).map(([key, type]) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.filterBtn,
              filter === type.value && styles.filterBtnActive,
            ]}
            onPress={() => setFilter(type.value)}
          >
            <Text
              style={[
                styles.filterBtnText,
                filter === type.value && styles.filterBtnTextActive,
              ]}
            >
              {type.icon} {type.label}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Separador */}
        <View style={styles.filterSeparator} />

        {/* Filtro por estado */}
        <TouchableOpacity
          style={[
            styles.filterBtn,
            statusFilter === 'all' && styles.filterBtnActive,
          ]}
          onPress={() => setStatusFilter('all')}
        >
          <Text
            style={[
              styles.filterBtnText,
              statusFilter === 'all' && styles.filterBtnTextActive,
            ]}
          >
            Todos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterBtn,
            statusFilter === 'pending' && styles.filterBtnActive,
          ]}
          onPress={() => setStatusFilter('pending')}
        >
          <Text
            style={[
              styles.filterBtnText,
              statusFilter === 'pending' && styles.filterBtnTextActive,
            ]}
          >
            Por hacer
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterBtn, { marginRight: 20 },
            statusFilter === 'completed' && styles.filterBtnActive,
          ]}
          onPress={() => setStatusFilter('completed')}
        >
          <Text
            style={[
              styles.filterBtnText,
              statusFilter === 'completed' && styles.filterBtnTextActive,
            ]}
          >
            Completadas
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Lista de tareas */}
      {tasks.length > 0 ? (
        <FlatList
          data={tasks}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              onDelete={handleDeleteTask}
              onComplete={handleCompleteTask}
              onPress={() => navigation.navigate('TaskDetail', { taskId: item.id })}
            />
          )}
          contentContainerStyle={styles.tasksList}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>No hay tareas</Text>
          <Text style={styles.emptySubtext}>
            Unete a un grupo y espera a que te asignen tareas
          </Text>
        </View>
      )}
{/* 
      
      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreateTask}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity> 
      */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 12,
    elevation: 2,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  filtersContainer: {
    backgroundColor: '#FFF',
    paddingHorizontal: 8,
    paddingVertical: 12,
    marginBottom: 12,
    maxHeight: 50,
    minHeight: 50,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 4,
  },
  filterBtnActive: {
    backgroundColor: '#007AFF',
  },
  filterBtnText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  filterBtnTextActive: {
    color: '#FFF',
  },
  filterSeparator: {
    width: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 8,
  },
  tasksList: {
    paddingHorizontal: 12,
    paddingBottom: 80,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  fabText: {
    fontSize: 32,
    color: '#FFF',
    fontWeight: 'bold',
  },
});

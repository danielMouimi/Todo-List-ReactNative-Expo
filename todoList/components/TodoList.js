import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { 
  StyleSheet, 
  Text, 
  View, 
  KeyboardAvoidingView, 
  TextInput, 
  TouchableOpacity, 
  Platform, 
  Keyboard,
  FlatList
} from 'react-native';
import Task from './Task';

const TodoList = () => {
  const [taskText, setTaskText] = useState('');
  const [tasks, setTasks] = useState([]);

  const handleAddTask = () => {
    if (!taskText.trim()) return;
    
    Keyboard.dismiss();
    
    const newTask = {
      id: Date.now().toString(),
      text: taskText.trim(),
      isCompleted: false
    };

    setTasks([...tasks, newTask]);
    setTaskText('');
  };

  const handleToggleComplete = (id) => {
    const updatedTasks = tasks.map(item => {
      if (item.id === id) {
        return { ...item, isCompleted: !item.isCompleted };
      }
      return item;
    });
    setTasks(updatedTasks);
  };

  const handleDeleteTask = (id) => {
    const filteredTasks = tasks.filter(item => item.id !== id);
    setTasks(filteredTasks);
  };

  const pendingTasksCount = tasks.filter(t => !t.isCompleted).length;

  return (
    // Cambiamos el contenedor principal a un KeyboardAvoidingView que envuelve TODA la pantalla
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      // Ajuste clave para iOS para evitar que los elementos se solapen con los Tabs inferiores
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 100} 
    >
      <StatusBar style="dark" />
      
      {/* SECCIÓN DE CABECERA PROFESIONAL */}
      <View style={styles.headerWrapper}>
        <Text style={styles.sectionTitle}>Mis Tareas</Text>
        <Text style={styles.sectionSubtitle}>Espacio Personal Local</Text>
        
        <View style={styles.infoBadge}>
          <Text style={styles.infoBadgeText}>
            {pendingTasksCount === 0 
              ? '✨ ¡Todo al día!' 
              : `⏳ Tienes ${pendingTasksCount} tarea${pendingTasksCount > 1 ? 's' : ''} pendiente${pendingTasksCount > 1 ? 's' : ''}`
            }
          </Text>
        </View>
      </View>

      {/* LISTADO DE TAREAS (flex: 1 hace que use todo el espacio central) */}
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Task 
            text={item.text} 
            isCompleted={item.isCompleted}
            onToggle={() => handleToggleComplete(item.id)}
            onDelete={() => handleDeleteTask(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyText}>¿Qué tienes pensado hacer hoy?</Text>
            <Text style={styles.emptySubtext}>Añade tus recordatorios personales abajo.</Text>
          </View>
        }
      />

      {/* FORMULARIO INFERIOR (Ya no es absoluto, ahora se apoya al final del Flex) */}
      <View style={styles.writeTaskWrapper}>
        <TextInput 
          style={styles.input} 
          placeholder={'Escribe una tarea personal...'} 
          value={taskText} 
          onChangeText={setTaskText} 
          placeholderTextColor="#A0A0A0"
        />
        <TouchableOpacity onPress={handleAddTask} activeOpacity={0.8}>
          <View style={styles.addWrapper}>
            <Text style={styles.addText}>+</Text>
          </View>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  headerWrapper: {
    paddingTop: 20,
    paddingHorizontal: 24,
    backgroundColor: '#FFF',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
    fontWeight: '500',
  },
  infoBadge: {
    backgroundColor: '#E1F5FE',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },
  infoBadgeText: {
    color: '#0288D1',
    fontSize: 12,
    fontWeight: '700',
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20, // Reducido ya que el input ya no pasa "por encima" de la lista
  },
  writeTaskWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16, // Proporciona espaciado constante con el fondo o teclado
    backgroundColor: '#F5F7FA', // Mismo color del fondo para fundirse de forma invisible
  },
  input: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#FFF',
    borderRadius: 30,
    borderColor: '#E2E8F0',
    borderWidth: 1,
    flex: 1,
    marginRight: 12,
    fontSize: 15,
    color: '#333',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  addWrapper: {
    width: 52,
    height: 52,
    backgroundColor: '#007AFF',
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  addText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '300',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyIcon: {
    fontSize: 50,
    marginBottom: 14,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#48484A',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#A0A0A0',
    textAlign: 'center',
  },
});

export default TodoList;
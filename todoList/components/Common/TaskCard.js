import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import PriorityBadge from './PriorityBadge';
import { TASK_TYPES } from '../../constants/AppConstants';

export default function TaskCard({
  task,
  onPress,
  onDelete,
  onComplete,
  showActions = true,
}) {
  // const handleDelete = () => {
  //   Alert.alert(
  //     'Eliminar tarea',
  //     '¿Estás seguro de que deseas eliminar esta tarea?',
  //     [
  //       { text: 'Cancelar', onPress: () => {}, style: 'cancel' },
  //       {
  //         text: 'Eliminar',
  //         onPress: () => onDelete && onDelete(task.id),
  //         style: 'destructive',
  //       },
  //     ]
  //   );
  // };

  const handleComplete = () => {
        Alert.alert(
      'Completar tarea',
      '¿Estás seguro de que deseas completar esta tarea?',
      [
        { text: 'Cancelar', onPress: () => {}, style: 'cancel' },
        {
          text: 'Completar',
          onPress: () => onComplete && onComplete(task.id),
          style: 'destructive',
        },
      ]
    );
  };

  const taskTypeInfo = TASK_TYPES[task.type?.toUpperCase()];
  const isCompleted = task.status === 'completed';

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.card, isCompleted && styles.cardCompleted]}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleWrapper}>
          <Text style={[styles.icon]}>{taskTypeInfo?.icon || '📝'}</Text>
          <Text style={[styles.title, isCompleted && styles.titleCompleted]}>
            {task.title}
          </Text>
        </View>
        <PriorityBadge priority={task.priority} size="small" />
      </View>

      {task.description && (
        <Text style={styles.description}>{task.description}</Text>
      )}

      <View style={styles.footer}>
        <Text style={styles.dueDate}>
          {task.dueDate ? new Date(task.dueDate.seconds * 1000).toLocaleDateString() : 'Sin fecha'}
        </Text>

        {showActions && (
          <View style={styles.actions}>
            {!isCompleted && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.completeBtn]}
                onPress={handleComplete}
              >
                <Text style={styles.actionText}>✓</Text>
              </TouchableOpacity>
            )}
            {/* <TouchableOpacity
              style={[styles.actionBtn, styles.deleteBtn]}
              onPress={handleDelete}
            >
              <Text style={styles.actionText}>🗑️</Text>
            </TouchableOpacity> */}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FF5252',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardCompleted: {
    opacity: 0.6,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  icon: {
    fontSize: 18,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  description: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dueDate: {
    fontSize: 12,
    color: '#999',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeBtn: {
    backgroundColor: '#69F0AE',
  },
  deleteBtn: {
    backgroundColor: '#FF5252',
  },
  actionText: {
    fontSize: 16,
  },
});

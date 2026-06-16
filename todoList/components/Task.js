import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

const Task = ({ text, isCompleted, onToggle, onDelete }) => {
  return (
    <View style={[styles.item, isCompleted && styles.itemCompleted]}>
      <View style={styles.itemLeft}>
        {/* Checkbox Interactivo (Cuadrado) */}
        <TouchableOpacity 
          style={[styles.square, isCompleted && styles.squareCompleted]} 
          onPress={onToggle}
          activeOpacity={0.7}
        >
          {isCompleted && <Text style={styles.checkMark}>✓</Text>}
        </TouchableOpacity>
        
        {/* Texto de la Tarea */}
        <Text style={[styles.itemText, isCompleted && styles.itemTextCompleted]}>
          {text}
        </Text>
      </View>

      {/* Botón de Eliminar (Círculo de la derecha) */}
      <TouchableOpacity 
        style={styles.deleteButton} 
        onPress={onDelete}
        activeOpacity={0.6}
      >
        <Text style={styles.deleteIcon}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  item: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  itemCompleted: {
    backgroundColor: '#F8F9FA',
    borderColor: '#E5E5E5',
    borderWidth: 1,
    shadowOpacity: 0,
    elevation: 0,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  square: {
    width: 24,
    height: 24,
    borderColor: '#007AFF',
    borderWidth: 2,
    borderRadius: 6,
    marginRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  squareCompleted: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  checkMark: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  itemText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    paddingRight: 8,
  },
  itemTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#A0A0A0',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: {
    fontSize: 14,
  },
});

export default Task;
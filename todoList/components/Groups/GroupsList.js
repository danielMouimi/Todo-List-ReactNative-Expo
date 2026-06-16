import React, { useState, useCallback } from 'react';
import '@react-native-firebase/app';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator, 
  Alert,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { GroupService } from '../../services/FirebaseService';
import { useNavigation } from '@react-navigation/native'; 

export default function GroupsList() {
  const navigation = useNavigation();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth().currentUser;

  useFocusEffect(
    useCallback(() => {
      const fetchGroups = async () => {
        console.log('La pantalla está enfocada, cargando grupos...');
        await loadGroups();
      };
      fetchGroups();
      return () => {
        console.log('El usuario ha salido de la pantalla de grupos.');
      };
    }, [])
  );

  const loadGroups = async () => {
    try {
      setLoading(true);
      const userGroups = await GroupService.getUserGroups(user.uid);
      setGroups(userGroups);
    } catch (error) {
      console.error('Error loading groups:', error);
      Alert.alert('Error', 'No se pudieron cargar los grupos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = () => {
    navigation.navigate('CreateGroup');
  };

  const handleJoinGroup = () => {
    navigation.navigate('JoinGroup'); // 👈 Ruta para la nueva pantalla
  };

  const handleGroupPress = (groupId) => {
    navigation.navigate('GroupDetail', { groupId });
  };

  const GroupCard = ({ group }) => {
    const isAdmin = group.admin === user.uid;
    const memberCount = group.members?.length || 0;
    const pendingRequests = group.joinRequests?.filter(r => r.status === 'pending').length || 0;

    return (
      <TouchableOpacity
        style={styles.groupCard}
        onPress={() => handleGroupPress(group.id)}
        activeOpacity={0.7}
      >
        <View style={styles.groupHeader}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={styles.groupName}>{group.name}</Text>
            <Text style={styles.groupDescription}>{group.description}</Text>
          </View>
          {isAdmin && (
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>Admin</Text>
            </View>
          )}
        </View>

        <View style={styles.groupFooter}>
          <View style={styles.groupStat}>
            <Text style={styles.statLabel}>👥 Miembros</Text>
            <Text style={styles.statValue}>{memberCount}</Text>
          </View>

          {isAdmin && pendingRequests > 0 && (
            <View style={styles.groupStat}>
              <Text style={styles.statLabel}>📬 Solicitudes</Text>
              <Text style={[styles.statValue, styles.pendingValue]}>
                {pendingRequests}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.enterButton}
            onPress={() => handleGroupPress(group.id)}
          >
            <Text style={styles.enterButtonText}>Ver →</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 8 }}>Cargando grupos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {groups.length > 0 ? (
        <FlatList
          data={groups}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <GroupCard group={item} />}
          contentContainerStyle={styles.groupsList}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyText}>No hay grupos</Text>
          <Text style={styles.emptySubtext}>
            Crea un grupo de trabajo o solicita unirte a uno existente para colaborar.
          </Text>
        </View>
      )}

      {/* 🛠️ PANEL DE ACCIONES INFERIORES */}
      <View style={styles.bottomActionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.joinButton]}
          onPress={handleJoinGroup}
          activeOpacity={0.8}
        >
          <Text style={styles.joinButtonText}>🔗 Unirme a Grupo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.createButton]}
          onPress={handleCreateGroup}
          activeOpacity={0.8}
        >
          <Text style={styles.createButtonText}>＋ Crear Grupo</Text>
        </TouchableOpacity>
      </View>
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
  groupsList: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    paddingBottom: 100, // Espacio extra para que los botones no tapen el contenido
  },
  groupCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  adminBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFF',
  },
  groupFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  groupStat: {
    alignItems: 'flex-start',
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#007AFF',
    paddingLeft: 4,
  },
  pendingValue: {
    color: '#FF5252',
  },
  enterButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  enterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
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
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomActionsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  joinButton: {
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#007AFF',
    marginRight: 8,
  },
  joinButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '700',
  },
  createButton: {
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
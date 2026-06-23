import React, { useState, useCallback } from 'react';
import '@react-native-firebase/app';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Clipboard,
  Share,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import { GroupService, UserService, TaskService } from '../../services/FirebaseService';

export default function GroupDetail() {
  const navigation = useNavigation();
  const route = useRoute();
  const { groupId } = route.params || {};

  const currentUser = auth().currentUser;
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para el Modal de Gestión de Miembro (Solo Admin)
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberStats, setMemberStats] = useState(null);
  const [memberTasks, setMemberTasks] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Carga y sincronización de datos mediante el hook de enfoque
  useFocusEffect(
    useCallback(() => {
      if (!groupId) {
        Alert.alert('Error', 'ID de grupo no válido');
        navigation.goBack();
        return;
      }
      loadGroupData();
    }, [groupId])
  );

  const loadGroupData = async () => {
    try {
      setLoading(true);
      await GroupService.checkAndResetDailyTasks(groupId);
      const groupDetail = await GroupService.getGroupDetail(groupId);
      setGroup(groupDetail);

      const groupMembers = await UserService.getGroupMembers(groupId);
      setMembers(groupMembers);
    } catch (error) {
      console.error('Error loading group details:', error);
      Alert.alert('Error', 'No se pudieron cargar los detalles del grupo');
    } finally {
      setLoading(false);
    }
  };

  // Cargar estadísticas y tareas específicas de un miembro al pulsar sobre él
  const handleMemberPress = async (member) => {
    const isAdmin = group?.admin === currentUser.uid;
    // Criterio: Solo el administrador puede auditar o alterar tareas de otros miembros
    if (!isAdmin && member.id !== currentUser.uid) return;

    try {
      setSelectedMember(member);
      console.log(`Cargando métricas para ${member.email} (ID: ${member.id}) en el grupo ${group.name}`);
      setLoadingStats(true);
      setModalVisible(true);

      // Obtener estadísticas calculadas desde UserService
      const stats = await UserService.getMemberStats(groupId, member.id);
      setMemberStats(stats);

      // Obtener el listado real de tareas asignadas a este usuario en este grupo concreto
      const tasks = await TaskService.getUserGroupTasks(member.id, groupId);
      setMemberTasks(tasks);
    } catch (error) {
      console.error('Error fetching member metrics:', error);
      Alert.alert('Error', 'No se pudieron recopilar las métricas del miembro');
    } finally {
      setLoadingStats(false);
    }
  };

const handleRemoveMember = (memberId, memberName) => {
  // Evitar que el admin se elimine a sí mismo por error desde la lista
  if (memberId === currentUser.uid) {
    Alert.alert('Acción no permitida', 'No puedes eliminarte a ti mismo del grupo siendo el Administrador.');
    return;
  }

  Alert.alert(
    'Eliminar Miembro',
    `¿Estás seguro de que deseas expulsar a ${memberName} del grupo?`,
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Expulsar',
        style: 'destructive',
        onPress: async () => {
          try {
            // Llama al método de tu servicio que remueve al usuario del grupo
            await GroupService.removeMember(group.id, memberId);
            
            Alert.alert('Éxito', `${memberName} ha sido eliminado del grupo.`);
            
            // Actualiza el estado local de miembros para refrescar la lista de inmediato sin recargar toda la pantalla
            setMembers(prevMembers => prevMembers.filter(m => m.id !== memberId));
          } catch (error) {
            console.error('Error al eliminar miembro:', error);
            Alert.alert('Error', 'No se pudo eliminar al participante del grupo.');
          }
        },
      },
    ]
  );
};




  // --- CONTROLADORES DE ACCIONES SOBRE TAREAS (ADMIN) ---

  const handleCreateTaskForMember = () => {
    setModalVisible(false);
    // Redirige al formulario pasándole el ID del grupo y el usuario asignado predefinido
    navigation.navigate('CreateTask', { groupId, assignedUserId: selectedMember.id });
  };

  const handleToggleCompleteTask = async (taskId, currentStatus) => {
    try {
      if (currentStatus === 'completed') {
        // Si ya está completada, la devolvemos a pendiente
        await TaskService.updateTask(taskId, { status: 'pending' });
      } else {
        await TaskService.completeTask(taskId);
      }
      // Refrescar el modal interno volviendo a consultar los datos del miembro
      const tasks = await TaskService.getUserGroupTasks(selectedMember.id, groupId);
      const stats = await UserService.getMemberStats(groupId, selectedMember.id);
      setMemberTasks(tasks);
      setMemberStats(stats);
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el estado de la tarea');
    }
  };

  const handleDeleteTask = (taskId) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que quieres realizar un borrado lógico de esta tarea?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await TaskService.deleteTask(taskId);
              const tasks = await TaskService.getUserGroupTasks(selectedMember.id, groupId);
              const stats = await UserService.getMemberStats(groupId, selectedMember.id);
              setMemberTasks(tasks);
              setMemberStats(stats);
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la tarea');
            }
          },
        },
      ]
    );
  };


const handleCopyId = () => {
  Clipboard.setString(group.id);
  // Un feedback rápido y elegante para el usuario
  Alert.alert('Copiado', 'El ID del grupo se ha copiado al portapapeles.');
};

const handleShareGroupCode = async () => {
  try {
    const message = `¡Únete a mi grupo de trabajo!\n\n*Nombre:* ${group.name}\n*ID del grupo:*  ${group.id}\n\nIntroduce este código en la aplicación para unirte.`;
    
    await Share.share({
      message: message,
    });
  } catch (error) {
    console.error('Error al compartir:', error);
    Alert.alert('Error', 'No se pudo abrir el menú para compartir.');
  }
};


const handleDeleteGroup = () => {
  Alert.alert(
    '🚨 Eliminar Grupo',
    `¿Estás seguro de que deseas eliminar permanentemente el grupo "${group.name}"? Esta acción no se puede deshacer y todos los miembros perderán el acceso.`,
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar de todos modos',
        style: 'destructive',
        onPress: async () => {
          try {
            // 1. Llamar al servicio para borrar de Firestore
            await GroupService.deleteGroup(group.id);
            
            Alert.alert('Eliminado', 'El grupo ha sido borrado correctamente.', [
              {
                text: 'OK',
                onPress: () => {
                  // 2. Redirigir al usuario a la lista de grupos
                  navigation.goBack(); 
                }
              }
            ]);
          } catch (error) {
            console.error('Error al eliminar el grupo:', error);
            Alert.alert('Error', 'No se pudo eliminar el grupo en este momento.');
          }
        },
      },
    ]
  );
};


  if (loading || !group) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 8 }}>Sincronizando detalles del grupo...</Text>
      </View>
    );
  }

  const isCurrentAdmin = group.admin === currentUser.uid;
  const pendingRequestsCount = group.joinRequests?.filter(r => r.status === 'pending').length || 0;

  return (
    <View style={styles.container}>
      {/* 📬 BANNER DE SOLICITUDES PENDIENTES (SOLO ADMIN) */}
      {isCurrentAdmin && pendingRequestsCount > 0 && (
        <TouchableOpacity
          style={styles.requestsBanner}
          onPress={() => navigation.navigate('GroupRequests', { groupId })}
          activeOpacity={0.9}
        >
          <Text style={styles.requestsBannerText}>
            📬 Tienes {pendingRequestsCount} solicitud{pendingRequestsCount > 1 ? 'es' : ''} de unión pendiente{pendingRequestsCount > 1 ? 'es' : ''}
          </Text>
          <Text style={styles.requestsBannerLink}>Gestionar →</Text>
        </TouchableOpacity>
      )}

{/* CABECERA DEL GRUPO */}
<View style={styles.headerSection}>
  <View style={styles.titleRow}>
    <Text style={styles.groupTitle}>{group.name}</Text>
    
    {/* 🗑️ Botón de borrar grupo visible solo si eres Admin */}
    {isCurrentAdmin && (
      <TouchableOpacity 
        style={styles.deleteGroupBtn} 
        onPress={handleDeleteGroup}
        activeOpacity={0.7}
      >
        <Text style={styles.deleteGroupBtnText}>🗑️ Borrar Grupo</Text>
      </TouchableOpacity>
    )}
  </View>

  <Text style={styles.groupDesc}>{group.description}</Text>
  
  <View style={styles.idContainer}>
    <Text style={styles.groupIdText}>ID: {group.id}</Text>
    
    <View style={styles.headerActionRow}>
      <TouchableOpacity 
        style={styles.headerInlineBtn} 
        onPress={handleCopyId}
        activeOpacity={0.7}
      >
        <Text style={styles.headerInlineBtnText}>📋 Copiar</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.headerInlineBtn, styles.shareBtn]} 
        onPress={handleShareGroupCode}
        activeOpacity={0.7}
      >
        <Text style={styles.headerInlineBtnText}>💬 Compartir</Text>
      </TouchableOpacity>
    </View>
  </View>
</View>

      {/* LISTADO DE COMPONENTES DE MIEMBROS */}
        <View style={styles.listContainer}>
          <Text style={styles.sectionTitle}>Participantes ({members.length})</Text>
          <FlatList
            data={members}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const isUserAdmin = group.admin === item.id;
              return (
                <View style={styles.memberCardWrapper}>
                  <TouchableOpacity
                    style={styles.memberCard}
                    onPress={() => handleMemberPress(item)}
                    disabled={!isCurrentAdmin && item.id !== currentUser.uid}
                    activeOpacity={0.7}
                  >
                    <View style={styles.memberInfo}>
                      <Text style={styles.avatarPlaceholder}>👤</Text>
                      <View>
                        <Text style={styles.memberName}>{item.name}</Text>
                        <Text style={styles.memberEmail}>{item.email}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.badgeRow}>
                      {isUserAdmin && (
                        <View style={styles.adminBadge}>
                          <Text style={styles.adminBadgeText}>Admin</Text>
                        </View>
                      )}
                      {isCurrentAdmin && <Text style={styles.gearIcon}>⚙️</Text>}
                    </View>
                  </TouchableOpacity>

                  {/* 🗑️ Botón de eliminar visible solo para el Admin y que no sea él mismo */}
                  {isCurrentAdmin && !isUserAdmin && (
                    <TouchableOpacity
                      style={styles.removeMemberButton}
                      onPress={() => handleRemoveMember(item.id, item.name)}
                      activeOpacity={0.6}
                    >
                      <Text style={styles.removeIcon}>🗑️</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            }}
          />
        </View>

      {/* 🔲 MODAL DE AUDITORÍA Y CONTROL DE TAREAS (ADMIN/PROPIO) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Panel de {selectedMember?.name}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeModalText}>✕</Text>
              </TouchableOpacity>
            </View>

            {loadingStats ? (
              <ActivityIndicator size="small" color="#007AFF" style={{ margin: 24 }} />
            ) : (
              <ScrollView bounces={false} contentContainerStyle={{ paddingBottom: 24 }}>
                {/* Panel de Estadísticas */}
                <Text style={styles.modalSubTitle}>Rendimiento en el Grupo</Text>
                <View style={styles.statsDashboard}>
                  <View style={styles.statBox}>
                    <Text style={styles.statBoxNum}>{memberStats?.total || 0}</Text>
                    <Text style={styles.statBoxLabel}>Totales</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={[styles.statBoxNum, { color: '#FF9500' }]}>{memberStats?.pending || 0}</Text>
                    <Text style={styles.statBoxLabel}>Pendientes</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={[styles.statBoxNum, { color: '#34C759' }]}>{memberStats?.completed || 0}</Text>
                    <Text style={styles.statBoxLabel}>Hechas</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={[styles.statBoxNum, { color: '#007AFF' }]}>{memberStats?.completionRate || 0}%</Text>
                    <Text style={styles.statBoxLabel}>Ratio</Text>
                  </View>
                </View>

                {/* Sección de Gestión de Tareas Directas */}
                <View style={styles.tasksHeaderRow}>
                  <Text style={styles.modalSubTitle}>Tareas Asignadas</Text>
                  {isCurrentAdmin && (
                    <TouchableOpacity style={styles.addTaskInlineBtn} onPress={handleCreateTaskForMember}>
                      <Text style={styles.addTaskInlineText}>＋ Asignar Tarea</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {memberTasks.length === 0 ? (
                  <Text style={styles.noTasksText}>Este participante no tiene tareas asignadas en este grupo.</Text>
                ) : (
                  memberTasks.map(task => (
                    <View key={task.id} style={styles.taskInlineCard}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={[styles.taskInlineTitle, task.status === 'completed' && styles.taskCompletedStrike]}>
                          {task.title}
                        </Text>
                        <Text style={styles.taskInlineDesc}>{task.description}</Text>
                      </View>
                      
                      <View style={styles.taskInlineActions}>
                        <TouchableOpacity 
                          style={[styles.taskActionBtn, task.status === 'completed' ? styles.btnUndo : styles.btnCheck]}
                          onPress={() => handleToggleCompleteTask(task.id, task.status)}
                        >
                          <Text style={styles.taskActionBtnText}>{task.status === 'completed' ? '↩️' : '✓'}</Text>
                        </TouchableOpacity>
                        
                        {isCurrentAdmin && (
                          <TouchableOpacity 
                            style={[styles.taskActionBtn, styles.btnTrash]}
                            onPress={() => handleDeleteTask(task.id)}
                          >
                            <Text style={styles.taskActionBtnText}>🗑️</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  requestsBanner: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestsBannerText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
  requestsBannerLink: {
    color: '#FFF',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    fontSize: 13,
  },
  headerSection: {
    backgroundColor: '#FFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    elevation: 1,
  },
titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  groupTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1C1C1E',
    flex: 1, // Evita que pise al botón si el nombre es muy largo
    paddingRight: 10,
  },
  deleteGroupBtn: {
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE0E0',
  },
  deleteGroupBtnText: {
    color: '#DC3545',
    fontSize: 12,
    fontWeight: '700',
  },
  groupDesc: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  groupIdText: {
    fontSize: 11,
    color: '#999',
    fontFamily: 'monospace',
  },
  listContainer: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
memberCardWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  memberCard: {
    flex: 1, // Hace que la tarjeta ocupe todo el espacio disponible dejando espacio al botón si existe
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  removeMemberButton: {
    width: 44,
    height: 48,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#FFE0E0',
  },
  removeIcon: {
    fontSize: 16,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    fontSize: 24,
    marginRight: 12,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  memberEmail: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminBadge: {
    backgroundColor: '#E1F5FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
  },
  adminBadgeText: {
    color: '#0288D1',
    fontSize: 11,
    fontWeight: '600',
  },
  gearIcon: {
    fontSize: 16,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeModalText: {
    fontSize: 20,
    color: '#999',
    paddingHorizontal: 8,
  },
  modalSubTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  statsDashboard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statBox: {
    backgroundColor: '#F8F9FA',
    flex: 1,
    marginHorizontal: 4,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  statBoxNum: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statBoxLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  tasksHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addTaskInlineBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addTaskInlineText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  noTasksText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 13,
    marginVertical: 16,
  },
  taskInlineCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  taskInlineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  taskCompletedStrike: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  taskInlineDesc: {
    fontSize: 12,
    color: '#666',
  },
  taskInlineActions: {
    flexDirection: 'row',
  },
  taskActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  btnCheck: { backgroundColor: '#34C759' },
  btnUndo: { backgroundColor: '#8E8E93' },
  btnTrash: { backgroundColor: '#FF3B30' },
  taskActionBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  idContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#F8F9FA',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  groupIdText: {
    fontSize: 12,
    color: '#555',
    fontFamily: 'monospace',
    flex: 1,
    paddingRight: 8,
  },
  headerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerInlineBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 6,
  },
  shareBtn: {
    backgroundColor: '#34C759', // Verde estilo WhatsApp / Éxito
  },
  headerInlineBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
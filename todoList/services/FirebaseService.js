// Servicios de Firebase para manejo de tareas
import '@react-native-firebase/app';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const db = firestore();

// ============ SERVICIOS DE TAREAS ============

export const TaskService = {
  // Crear tarea
  async createTask(taskData) {
    try {

      const docRef = await db.collection('tasks').add({
        ...taskData,
        userId: taskData.userId || auth().currentUser.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'pending'
      });
      return { id: docRef.id, ...taskData };
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  },

  // Obtener tareas del usuario
  async getUserTasks(userId) {
    try {
      const snapshot = await db
        .collection('tasks')
        .where('userId', '==', userId)
        .where('status', '!=', 'deleted')
        .orderBy('status', 'desc') 
        .orderBy('priority', 'asc')
        .orderBy('dueDate', 'asc')
        .get();
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching user tasks:', error);
      return [];
    }
  },

  // Obtener tareas de un grupo
  async getGroupTasks(groupId) {
    try {
      const snapshot = await db
        .collection('tasks')
        .where('groupId', '==', groupId)
        .where('status', '!=', 'deleted')
        .get();
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching group tasks:', error);
      return [];
    }
  },

  // Obtener tareas de un usuario en un grupo específico
  async getUserGroupTasks(userId, groupId) {
    try {
      const snapshot = await db
        .collection('tasks')
        .where('userId', '==', userId)
        .where('groupId', '==', groupId)
        .where('status', '!=', 'deleted')
        .get();
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching user group tasks:', error);
      return [];
    }
  },

  // Actualizar tarea
  async updateTask(taskId, updates) {
    try {
      await db.collection('tasks').doc(taskId).update({
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },

  // Marcar tarea como completada
  async completeTask(taskId) {
    try {
      await db.collection('tasks').doc(taskId).update({
        status: 'completed',
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error completing task:', error);
      throw error;
    }
  },

  // Eliminar tarea (soft delete)
  async deleteTask(taskId) {
    try {
      await db.collection('tasks').doc(taskId).delete();
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },

  // Filtrar tareas por tipo
  async getTasksByType(userId, type) {
    try {
      const snapshot = await db
        .collection('tasks')
        .where('userId', '==', userId)
        .where('type', '==', type)
        .where('status', '!=', 'deleted')
        .get();
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching tasks by type:', error);
      return [];
    }
  },

  // Filtrar tareas por prioridad
  async getTasksByPriority(userId, priority) {
    try {
      const snapshot = await db
        .collection('tasks')
        .where('userId', '==', userId)
        .where('priority', '==', priority)
        .where('status', '!=', 'deleted')
        .get();
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching tasks by priority:', error);
      return [];
    }
  },


  async getTaskDetail(taskId) {
    try {
      if (!taskId) throw new Error('Se requiere un taskId válido');

      const taskDoc = await firestore()
        .collection('tasks') // Asegúrate de que coincida con el nombre exacto de tu colección (ej. 'tasks' o 'tareas')
        .doc(taskId)
        .get();

      if (!taskDoc.exists) {
        throw new Error('La tarea solicitada no existe');
      }

      // Devolvemos los datos del documento inyectándole el ID del nodo para facilitar su uso en la IU
      return {
        id: taskDoc.id,
        ...taskDoc.data(),
      };
    } catch (error) {
      console.error('Error in TaskService.getTaskDetail:', error);
      throw error;
    }
  },

};

// ============ SERVICIOS DE GRUPOS ============

export const GroupService = {

  // Reseteo diario 
async checkAndResetDailyTasks (groupId){
    try {
      const groupRef = firestore().collection('workgroups').doc(groupId);
      const groupDoc = await groupRef.get();

      if (!groupDoc.exists) return;

      const groupData = groupDoc.data();
      const todayStr = new Date().toLocaleDateString('es-ES'); // Ejemplo: "19/6/2026"
      
      // Si ya se hizo el reseteo hoy, no hacemos nada y salimos
      if (groupData.lastDailyReset === todayStr) {
        console.log('Las tareas diarias ya fueron reseteadas hoy.');
        return;
      }

      console.log('Nuevo día detectado. Reseteando tareas diarias...');

      // 1. Buscamos las tareas diarias completadas de ESTE grupo
      const tasksSnapshot = await firestore()
        .collection('tasks')
        .where('groupId', '==', groupId)
        .where('type', '==', 'daily')
        .where('status', '==', 'completed')
        .get();

      const batch = firestore().batch();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      // 2. Si hay tareas completadas, las preparamos para pasarlas a 'pending'
      if (!tasksSnapshot.empty) {
        tasksSnapshot.docs.forEach((doc) => {
          batch.update(firestore().collection('tasks').doc(doc.id), {
            status: 'pending',
            dueDate: tomorrow,
            updatedAt: new Date()
          });
        });
      }

      // 3. Marcamos el grupo como "reseteado hoy" para que el siguiente usuario no repita el proceso
      batch.update(groupRef, {
        lastDailyReset: todayStr
      });

      // Ejecutamos todo en bloque de forma atómica
      await batch.commit();
      console.log('Reseteo diario completado con éxito de forma gratuita.');

    } catch (error) {
      console.error('Error en el reseteo diario alternativo:', error);
    }
  },




  // Crear grupo
  async createGroup(groupData) {
    try {
      const userId = auth().currentUser.uid;
      const docRef = await db.collection('workgroups').add({
        ...groupData,
        createdBy: userId,
        admin: userId,
        members: [userId],
        joinRequests: [],
        createdAt: new Date()
      });

      // Agregar usuario como admin en groupMembers
      await db
        .collection('groupMembers')
        .doc(docRef.id)
        .collection('members')
        .doc(userId)
        .set({
          joinedAt: new Date(),
          role: 'admin'
        });

      return { id: docRef.id, ...groupData };
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  },

  // Obtener grupos del usuario
  async getUserGroups(userId) {
    try {
      const snapshot = await db
        .collection('workgroups')
        .where('members', 'array-contains', userId)
        .get();
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching user groups:', error);
      return [];
    }
  },

  // Obtener detalles de grupo
  async getGroupDetail(groupId) {
    try {
      const doc = await db.collection('workgroups').doc(groupId).get();
      if (!doc.exists) {
        throw new Error('Grupo no encontrado');
      }
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Error fetching group detail:', error);
      throw error;
    }
  },

  // Solicitar unirse a grupo
  async requestJoinGroup(groupId, userId,email) {
    try {
      const group = await db.collection('workgroups').doc(groupId).get();
      const joinRequests = group.data().joinRequests || [];
      
      joinRequests.push({
        userId,
        email,
        status: 'pending',
        requestedAt: new Date()
      });

      await db.collection('workgroups').doc(groupId).update({
        joinRequests
      });
    } catch (error) {
      console.error('Error requesting to join group:', error);
      throw error;
    }
  },

  // Aceptar solicitud de unión
  async acceptJoinRequest(groupId, userId) {
    try {
      const group = await db.collection('workgroups').doc(groupId).get();
      const members = group.data().members || [];
      let joinRequests = group.data().joinRequests || [];

      if (!members.includes(userId)) {
        members.push(userId);
      }

      joinRequests = joinRequests.map(req => {
        if (req.userId === userId) {
          return { ...req, status: 'accepted' };
        }
        return req;
      });

      await db.collection('workgroups').doc(groupId).update({
        members,
      });

      await db.collection('workgroups')
        .doc(groupId)
        .collection('joinRequests')
        .doc(userId) // El ID de la solicitud concreta
        .delete();

      // Agregar usuario a groupMembers
      await db
        .collection('groupMembers')
        .doc(groupId)
        .collection('members')
        .doc(userId)
        .set({
          joinedAt: new Date(),
          role: 'member'
        });
    } catch (error) {
      console.error('Error accepting join request:', error);
      throw error;
    }
  },

  // Rechazar solicitud de unión
  async rejectJoinRequest(groupId, userId) {
    try {
      const group = await db.collection('workgroups').doc(groupId).get();
      let joinRequests = group.data().joinRequests || [];

      joinRequests = joinRequests.map(req => {
        if (req.userId === userId) {
          return { ...req, status: 'rejected' };
        }
        return req;
      });

       await db.collection('workgroups')
        .doc(groupId)
        .collection('joinRequests')
        .doc(userId) // El ID de la solicitud concreta
        .delete();
        
    } catch (error) {
      console.error('Error rejecting join request:', error);
      throw error;
    }
  },

  // Obtener solicitudes pendientes
  async getPendingRequests(groupId) {
    try {
      const doc = await db.collection('workgroups').doc(groupId).get();
      const joinRequests = doc.data().joinRequests || [];
      return joinRequests.filter(req => req.status === 'pending');
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      return [];
    }
  },

async removeMember(groupId, userId) {
  try {
    if (!groupId || !userId) {
      throw new Error('Se requiere un groupId y un userId válidos');
    }

    const batch = firestore().batch();

    // 1. Referencia para quitar al usuario del array de miembros del grupo
    const groupRef = firestore().collection('workgroups').doc(groupId);
    batch.update(groupRef, {
      members: firestore.FieldValue.arrayRemove(userId)
    });

    // 2. Buscar todas las tareas de este grupo asignadas a este usuario para eliminarlas
    const tasksSnapshot = await firestore()
      .collection('tasks')
      .where('groupId', '==', groupId)
      .where('userId', '==', userId) // Filtra las tareas que le pertenecían a él
      .get();

    // Añadimos cada borrado de tarea al mismo viaje (batch)
    tasksSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    const memberRef = firestore().collection('groupMembers').doc(groupId).collection('members').doc(userId);
    batch.delete(memberRef);

    // 3. Ejecutamos todas las operaciones de golpe
    await batch.commit();

    console.log(`Usuario ${userId} y sus tareas asignadas eliminados con éxito del grupo ${groupId}`);
  } catch (error) {
    console.error('Error in GroupService.removeMember:', error);
    throw error;
  }
},

async deleteGroup(groupId) {
  try {
    if (!groupId) throw new Error('Se requiere un groupId válido');

    const batch = firestore().batch();

    // 1. Referencia para eliminar el documento del grupo principal
    const groupRef = firestore().collection('workgroups').doc(groupId);
    batch.delete(groupRef);

    // 2. Buscar todas las tareas vinculadas a este grupo
    const tasksSnapshot = await firestore()
      .collection('tasks')
      .where('groupId', '==', groupId)
      .get();

    // Añadimos el borrado en cascada de cada tarea al lote
    tasksSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // 3. Confirmamos la transacción atómica
    await batch.commit();

    console.log(`Grupo ${groupId} y sus ${tasksSnapshot.size} tareas asociadas han sido eliminados por completo.`);
  } catch (error) {
    console.error('Error in GroupService.deleteGroup:', error);
    throw error;
  }
},
  
  
};

// ============ SERVICIOS DE USUARIOS ============

export const UserService = {
  // Crear perfil de usuario
  async createUserProfile(userId, userData) {
    try {
      await db.collection('users').doc(userId).set({
        email: userData.email,
        name: userData.name || userData.email.split('@')[0],
        avatar: userData.avatar || '',
        createdAt: new Date()
      });
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  },

  // Obtener perfil de usuario
  async getUserProfile(userId) {
    try {
      const doc = await db.collection('users').doc(userId).get();
      if (!doc.exists) {
        return null;
      }
      console.log('Perfil de usuario encontrado:', doc);
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  },

  // Obtener miembros de un grupo
  async getGroupMembers(groupId) {
    try {
      const snapshot = await db
        .collection('groupMembers')
        .doc(groupId)
        .collection('members')
        .get();

      const memberIds = snapshot.docs.map(doc => doc.id);
      
      // Obtener datos de cada miembro
      const members = [];
      for (const memberId of memberIds) {
        const profile = await this.getUserProfile(memberId);
        if (profile) {
          const roleDoc = snapshot.docs.find(doc => doc.id === memberId);
          members.push({
            ...profile,
            role: roleDoc.data().role
          });
        }
      }
      
      return members;
    } catch (error) {
      console.error('Error fetching group members:', error);
      return [];
    }
  },

  // Obtener estadísticas de un miembro en el grupo
  async getMemberStats(groupId, userId) {
    try {
      const tasks = await TaskService.getUserGroupTasks(userId, groupId);
      
      const pending = tasks.filter(t => t.status === 'pending').length;
      const completed = tasks.filter(t => t.status === 'completed').length;
      const total = tasks.length;

      return {
        total,
        pending,
        completed,
        completionRate: total > 0 ? (completed / total * 100).toFixed(1) : 0
      };
    } catch (error) {
      console.error('Error fetching member stats:', error);
      return { total: 0, pending: 0, completed: 0, completionRate: 0 };
    }
  }
};

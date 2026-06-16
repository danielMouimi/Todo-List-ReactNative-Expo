import React, { useState, useEffect } from 'react';
import '@react-native-firebase/app';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { GroupService, UserService } from '../../services/FirebaseService';

export default function GroupRequests() {
  const navigation = useNavigation();
  const route = useRoute();
  const { groupId } = route.params || {};

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null); // Evita pulsaciones dobles concurrentes

  useEffect(() => {
    if (!groupId) {
      Alert.alert('Error', 'Parámetro de grupo no detectado.');
      navigation.goBack();
      return;
    }
    fetchPendingRequests();
  }, [groupId]);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      // 1. Obtener solicitudes del servicio de grupos (retorna arrays de {userId, status, requestedAt})
      const pendingRaw = await GroupService.getPendingRequests(groupId);
      
      // 2. Cruzar datos con perfiles de usuarios para mostrar nombres reales en la lista
      const fullHydratedRequests = [];
      for (const req of pendingRaw) {
        const userProfile = await UserService.getUserProfile(req.userId);

        console.log(`Solicitud de ${userProfile ? userProfile.email : 'Usuario Desconocido'} (ID: ${req.userId}) con estado ${req.status}}`);
        if (userProfile) {
          fullHydratedRequests.push({
            ...req,
            userEmail: userProfile.email,
          });
        } else {
          // Fallback por si el perfil no se encontrara
          fullHydratedRequests.push({
            ...req,
            userEmail: 'Sin correo disponible',
          });
        }
      }
      setRequests(fullHydratedRequests);
    } catch (error) {
      console.error('Error fetching hydrated requests:', error);
      Alert.alert('Error', 'No se pudieron recuperar las solicitudes');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (userId, userEmail) => {
    try {
      setActioningId(userId);
      await GroupService.acceptJoinRequest(groupId, userId);
      Alert.alert('Completado', `Se ha aceptado a ${userEmail} en el grupo.`);
      // Limpieza y recarga del estado local sin salir de la pantalla
      setRequests(prev => prev.filter(req => req.userId !== userId));
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un problema al aceptar al participante');
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = (userId, userEmail) => {
    Alert.alert(
      'Rechazar Solicitud',
      `¿Estás seguro de que quieres denegar el acceso a ${userEmail}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Denegar',
          style: 'destructive',
          onPress: async () => {
            try {
              setActioningId(userId);
              await GroupService.rejectJoinRequest(groupId, userId);
              setRequests(prev => prev.filter(req => req.userId !== userId));
            } catch (error) {
              Alert.alert('Error', 'No se pudo rechazar la solicitud');
            } finally {
              setActioningId(null);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF9500" />
        <Text style={{ marginTop: 8 }}>Cargando buzón de peticiones...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerInfo}>
        <Text style={styles.title}>Solicitudes de Acceso</Text>
        <Text style={styles.subtitle}>
          Aquí puedes admitir o descartar los aspirantes que han introducido el ID único de tu grupo de trabajo.
        </Text>
      </View>

      {requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📬</Text>
          <Text style={styles.emptyText}>Buzón limpio</Text>
          <Text style={styles.emptySubtext}>No hay solicitudes pendientes de validación en este momento.</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>Volver al detalle</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.requestCard}>
              <View style={styles.userInfo}>
                <Text style={styles.avatar}>👤</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.userEmail}>Email: {item.userEmail}</Text>
                </View>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.btn, styles.btnReject]}
                  onPress={() => handleReject(item.userId, item.userEmail)}
                  disabled={actioningId !== null}
                >
                  <Text style={styles.btnRejectText}>Denegar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btn, styles.btnAccept]}
                  onPress={() => handleAccept(item.userId, item.userEmail)}
                  disabled={actioningId !== null}
                >
                  {actioningId === item.userId ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.btnAcceptText}>Admitir</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
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
  headerInfo: {
    backgroundColor: '#FFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  listContent: {
    padding: 16,
  },
  requestCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    fontSize: 28,
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  userEmail: {
    fontSize: 12,
    color: '#000000',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  btnReject: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  btnRejectText: {
    color: '#FF3B30',
    fontSize: 13,
    fontWeight: '600',
  },
  btnAccept: {
    backgroundColor: '#34C759',
  },
  btnAcceptText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  backBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
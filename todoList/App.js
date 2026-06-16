import * as React from 'react';
import '@react-native-firebase/app';
import { Text, View, StyleSheet, ActivityIndicator, Alert, SafeAreaView, TouchableOpacity } from 'react-native';
import {
  createStaticNavigation,
  useNavigation,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Button } from '@react-navigation/elements';

// Auth Screens
import LoginScreen from './components/LoginScreen.js';
import RegisterScreen from './components/RegisterScreen.js';
import VerificationScreen from './components/VerificationScreen.js';

// Task Screens
import PersonalTasks from './components/PersonalTasks.js';
import CreateTask from './components/Tasks/CreateTask.js';
import TodoList from './components/TodoList.js';
import TaskDetail from './components/Tasks/TaskDetail.js';

// Group Screens
import GroupsList from './components/Groups/GroupsList.js';
import CreateGroup from './components/Groups/CreateGroup.js';
import JoinGroup from './components/Groups/JoinGroup.js';
import GroupRequests from './components/Groups/GroupRequests.js';
import GroupDetail from './components/Groups/GroupDetail.js';

import { useEffect, useState } from 'react';

import auth from '@react-native-firebase/auth';



function HomeScreen() {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleCheckVerification = async () => {
    setChecking(true);
    try {
      if (user) {
        await user.reload();
        const updatedUser = auth().currentUser;
        setUser(updatedUser);
        
        if (updatedUser?.emailVerified) {
          Alert.alert('¡Éxito!', 'Tu correo ha sido verificado correctamente.');
        } else {
          Alert.alert('Pendiente', 'Aún no hemos detectado la verificación. Revisa tu bandeja de entrada.');
        }
        setTick(tick => tick + 1);
      }
    } catch (error) {
      Alert.alert('Error', 'Hubo un problema al comprobar el estado.');
    } finally {
      setChecking(false);
    }
  };

  const handleResendEmail = async () => {
    try {
      await user?.sendEmailVerification();
      Alert.alert('Enviado', 'Te hemos reenviado el enlace de verificación.');
    } catch (error) {
      Alert.alert('Error', 'Espera un momento antes de solicitar otro envío.');
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.loadingText}>Sincronizando...</Text>
      </View>
    );
  }


//caso 1: Usuario no autenticado
if (!user) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>

        <View style={styles.appHeader}>
          <Text style={styles.appLogo}>✓</Text>
          <Text style={styles.appTitle}>Tareas Juncaril</Text>
          <Text style={styles.appSubtitle}>
            Gestión colaborativa de tareas y equipos
          </Text>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>
            Organiza tu trabajo sin esfuerzo
          </Text>

          <Text style={styles.heroDescription}>
            Crea grupos de trabajo, asigna tareas, controla plazos
            y mantén a todo tu equipo sincronizado desde cualquier lugar.
          </Text>

          <View style={styles.featureContainer}>
            <Text style={styles.featureItem}>
              👥 Gestión de equipos
            </Text>

            <Text style={styles.featureItem}>
              📝 Tareas compartidas
            </Text>

            <Text style={styles.featureItem}>
              📅 Organización diaria, semanal y mensual
            </Text>

            <Text style={styles.featureItem}>
              🔒 Espacios privados para cada grupo
            </Text>
          </View>
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.primaryButtonText}>
              Iniciar Sesión
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.secondaryButtonText}>
              Crear Cuenta
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

if (!user.emailVerified) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>

        <View style={styles.appHeader}>
          <Text style={styles.appLogo}>📧</Text>
          <Text style={styles.appTitle}>Verificación requerida</Text>
          <Text style={styles.appSubtitle}>
            Un último paso para acceder a Tareas Juncaril: confirma tu correo electrónico.
          </Text>
        </View>

        <View style={styles.verificationCard}>

          <Text style={styles.verificationTitle}>
            Revisa tu bandeja de entrada
          </Text>

          <Text style={styles.verificationDescription}>
            Hemos enviado un correo de verificación a:
          </Text>

          <Text style={styles.verificationEmail}>
            {user.email}
          </Text>

          <Text style={styles.verificationHelp}>
            Una vez confirmes tu dirección de correo podrás acceder
            a todas las funciones de gestión de tareas y grupos.
          </Text>

        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              checking && styles.disabledButton,
            ]}
            onPress={handleCheckVerification}
            disabled={checking}
          >
            <Text style={styles.primaryButtonText}>
              {checking
                ? 'Comprobando...'
                : 'Ya he verificado mi cuenta'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleResendEmail}
          >
            <Text style={styles.secondaryButtonText}>
              Reenviar correo
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={async () => {
              await auth().signOut();
              navigation.navigate('Home');
            }}
          >
            <Text style={styles.logoutButtonText}>
              Cerrar sesión
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

  // CASO 3: Usuario autenticado y verificado
return (
  <SafeAreaView style={styles.container}>
    <View style={styles.content}>

      <View style={styles.appHeader}>
        <Text style={styles.appLogo}>✓</Text>
        <Text style={styles.appTitle}>Tareas Juncaril</Text>
        <Text style={styles.appSubtitle}>
          Gestión colaborativa de tareas y equipos
        </Text>
      </View>

      <View style={styles.dashboardCard}>
        <Text style={styles.dashboardGreeting}>
          Bienvenido de nuevo
        </Text>

        <Text style={styles.dashboardEmail}>
          {user.email}
        </Text>

        <Text style={styles.dashboardDescription}>
          Organiza tareas personales, coordina equipos de trabajo
          y mantén el control de todos tus proyectos desde un único lugar.
        </Text>
      </View>

      <View style={styles.quickActions}>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() =>
            navigation.navigate('MainTabs', { screen: 'TodoList' })
          }
        >
          <Text style={styles.actionIcon}>📝</Text>
          <Text style={styles.actionTitle}>Mis Tareas</Text>
          <Text style={styles.actionDescription}>
            Gestiona tus tareas diarias
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() =>
            navigation.navigate('MainTabs', { screen: 'TodoList' })
          }
        >
          <Text style={styles.actionIcon}>📋</Text>
          <Text style={styles.actionTitle}>Mis Tareas Grupales</Text>
          <Text style={styles.actionDescription}>
            Gestiona tus tareas en equipo
          </Text>
        </TouchableOpacity>

        {/* Fila compartida */}
        <View style={styles.actionRow}>

          <TouchableOpacity
            style={[styles.actionCard, styles.halfCard]}
            onPress={() =>
              navigation.navigate('MainTabs', { screen: 'Groups' })
            }
          >
            <Text style={styles.actionIcon}>👥</Text>
            <Text style={styles.actionTitle}>Grupos</Text>
            <Text style={styles.actionDescription}>
              Gestiona tus Grupos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, styles.halfCard]}
              onPress={async () => {
                Alert.alert('Cerrar Sesión', '¿Estás seguro de que quieres salir?', [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Sí, salir', style: 'destructive', onPress: async () => {
                    await auth().signOut();
                    navigation.navigate('Home');
                  }}
                ]);
              }}
          >
            <Text style={styles.actionIcon}>🚪</Text>
            <Text style={styles.actionTitle}>Salir</Text>
            <Text style={styles.actionDescription}>
              Cerrar sesión
            </Text>
          </TouchableOpacity>

        </View>
        </View>

    </View>
  </SafeAreaView>
);
}

// Navegador de pestañas inferior (Bottom Tabs)
const MainTabs = createBottomTabNavigator({
  screens: {
    PersonalTasks: {
      screen: TodoList,
      options: {
        title: 'Tareas',
        tabBarLabel: 'Tareas',
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📝</Text>,
      },
    },
    Tasks: {
      screen: PersonalTasks,
      options: {
        title: 'Tareas',
        tabBarLabel: 'Tareas del grupo',
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📋</Text>,
      },
    },
    Groups: {
      screen: GroupsList,
      options: {
        title: 'Grupos',
        tabBarLabel: 'Grupos',
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>👥</Text>,
      },
    },
    Logout: {
      screen: () => null,
      options: {
        title: 'Salir',
        tabBarLabel: 'Salir',
        tabBarIcon: () => <Text style={{ fontSize: 20 }}>🚪</Text>,
      },
      listeners: ({ navigation }) => ({
        tabPress: (e) => {
          e.preventDefault();
          Alert.alert('Cerrar Sesión', '¿Estás seguro de que quieres salir?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Sí, salir', style: 'destructive', onPress: () => auth().signOut() },
          ]);
        },
      }),
    },
  },
});

// Root Stack Configurator dinámico
function getRootStack(user) {
  return createNativeStackNavigator({
    initialRouteName: 'Home',
    screens: {
      Home: {
        screen: HomeScreen,
        options: { headerShown: false },
      },
      ...(user && user.emailVerified ? {
        MainTabs: {
          screen: MainTabs,
          options: { headerShown: false },
        },
        CreateTask: { screen: CreateTask, options: { title: 'Nueva Tarea' } },
        CreateGroup: { screen: CreateGroup, options: { title: 'Nuevo Grupo' } },
        JoinGroup: { screen: JoinGroup, options: { title: 'Unirse al Grupo' } },
        GroupRequests: { screen: GroupRequests, options: { title: 'Solicitudes' } },
        GroupDetail: { screen: GroupDetail, options: { title: 'Detalles' } },
        TaskDetail: { screen: TaskDetail, options: { title: 'Detalles de la Tarea' } },
        TodoList: { screen: TodoList, options: { title: 'Mis Tareas' } },
        PersonalTasks: { screen: PersonalTasks, options: { title: 'Tareas Personales' } },
        GroupsList: { screen: GroupsList, options: { title: 'Mis Grupos' } },
      } : {
        Login: { screen: LoginScreen, options: { headerShown: false } },
        Register: { screen: RegisterScreen, options: { headerShown: false } },
      }),
    },
  });
}

// Estilos Minimalistas, Profesionales y Premium
const styles = StyleSheet.create({
  appHeader: {
  alignItems: 'center',
  marginTop: 30,
},

appLogo: {
  fontSize: 50,
  marginBottom: 10,
},

appTitle: {
  fontSize: 34,
  fontWeight: '800',
  color: '#111827',
},

appSubtitle: {
  fontSize: 15,
  color: '#6B7280',
  marginTop: 5,
},

dashboardCard: {
  backgroundColor: '#FFFFFF',
  borderRadius: 24,
  padding: 24,
  marginTop: 40,

  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 6,
  },
  shadowOpacity: 0.08,
  shadowRadius: 12,

  elevation: 5,
},

dashboardGreeting: {
  fontSize: 14,
  color: '#6B7280',
  textTransform: 'uppercase',
  letterSpacing: 1,
},

dashboardEmail: {
  fontSize: 22,
  fontWeight: '700',
  color: '#111827',
  marginTop: 8,
},

dashboardDescription: {
  marginTop: 12,
  fontSize: 15,
  color: '#6B7280',
  lineHeight: 24,
},

quickActions: {
  marginTop: 25,
  gap: 15,
},

actionCard: {
  backgroundColor: '#FFFFFF',
  borderRadius: 20,
  padding: 20,

  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 4,
  },
  shadowOpacity: 0.06,
  shadowRadius: 10,

  elevation: 4,
},
actionRow: {
  flexDirection: 'row',
  gap: 15,
},

halfCard: {
  flex: 1,
},

actionIcon: {
  fontSize: 28,
},

actionTitle: {
  fontSize: 18,
  fontWeight: '700',
  color: '#111827',
  marginTop: 10,
},

actionDescription: {
  fontSize: 14,
  color: '#6B7280',
  marginTop: 5,
},
heroCard: {
  backgroundColor: '#FFFFFF',
  borderRadius: 24,
  padding: 24,
  marginTop: 40,

  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 6,
  },
  shadowOpacity: 0.08,
  shadowRadius: 12,

  elevation: 5,
},

heroTitle: {
  fontSize: 26,
  fontWeight: '800',
  color: '#111827',
  marginBottom: 15,
},

heroDescription: {
  fontSize: 15,
  lineHeight: 24,
  color: '#6B7280',
  marginBottom: 25,
},

featureContainer: {
  gap: 14,
},

featureItem: {
  fontSize: 15,
  color: '#374151',
  fontWeight: '500',
},

verificationCard: {
  backgroundColor: '#FFFFFF',
  borderRadius: 24,
  padding: 24,
  marginTop: 40,

  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 6,
  },
  shadowOpacity: 0.08,
  shadowRadius: 12,

  elevation: 5,
},

verificationTitle: {
  fontSize: 24,
  fontWeight: '700',
  color: '#111827',
  marginBottom: 15,
},

verificationDescription: {
  fontSize: 15,
  color: '#6B7280',
},

verificationEmail: {
  fontSize: 18,
  fontWeight: '700',
  color: '#2563EB',
  marginVertical: 15,
},

verificationHelp: {
  fontSize: 15,
  color: '#6B7280',
  lineHeight: 24,
},

secondaryButton: {
  backgroundColor: '#FFFFFF',
  borderWidth: 1,
  borderColor: '#E5E7EB',
  paddingVertical: 16,
  borderRadius: 16,
  alignItems: 'center',
},

secondaryButtonText: {
  color: '#111827',
  fontWeight: '600',
  fontSize: 16,
},

logoutButton: {
  alignItems: 'center',
  paddingVertical: 12,
},

logoutButtonText: {
  color: '#EF4444',
  fontWeight: '600',
  fontSize: 15,
},

disabledButton: {
  opacity: 0.7,
},
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA', // Fondo claro roto, evita el blanco puro agresivo
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#8E8E93',
    letterSpacing: -0.3,
  },
  headerSection: {
    marginTop: 60,
  },
  brandTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1C1C1E',
    letterSpacing: -1,
    marginBottom: 12,
  },
  brandSubtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  welcomeTitle: {
    fontSize: 40,
    fontWeight: '300',
    color: '#1C1C1E',
  },
  welcomeEmail: {
    fontSize: 22,
    fontWeight: '600',
    color: '#007AFF',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  buttonGroup: {
    marginBottom: 20,
    gap: 12, // Crea separación consistente sin usar margenes duros
  },
  primaryButton: {
    backgroundColor: '#1C1C1E', // Botón principal negro para look premium/minimalista
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  }
});



export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Escuchamos a Firebase globalmente en la app
    const unsubscribe = auth().onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Mientras Firebase responde, mostramos una pantalla de carga general
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8EAED' }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10 }}>Cargando sistema...</Text>
      </View>
    );
  }
const Navigation = createStaticNavigation(getRootStack(user));

  return <Navigation />;
}

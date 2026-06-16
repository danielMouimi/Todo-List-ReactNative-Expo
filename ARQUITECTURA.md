# Arquitectura TODO-List con Grupos de Trabajo

## 1. ESTRUCTURA DE FIRESTORE

### Collections:

```
/users/{userId}
  - email: string
  - name: string
  - avatar: string
  - createdAt: timestamp

/workgroups/{groupId}
  - name: string
  - description: string
  - createdBy: userId
  - createdAt: timestamp
  - members: array<userId>
  - admin: userId
  - joinRequests: array<{userId, status: 'pending'|'accepted'|'rejected'}>

/tasks/{taskId}
  - title: string
  - description: string
  - userId: string (quien la tiene asignada)
  - groupId: string (si es de grupo, null si es personal)
  - assignedBy: userId (quién la asignó, solo en tareas de grupo)
  - status: 'pending' | 'completed' | 'deleted'
  - priority: 'low' | 'medium' | 'high' (con colores)
  - type: 'daily' | 'weekly' | 'monthly'
  - dueDate: timestamp
  - createdAt: timestamp
  - updatedAt: timestamp
  - color: '#FF5252' | '#FFC400' | '#69F0AE'

/groupMembers/{groupId}/{userId}
  - joinedAt: timestamp
  - role: 'admin' | 'member'
```

## 2. COLORES POR PRIORIDAD

- **HIGH (Rojo)**: #FF5252
- **MEDIUM (Amarillo)**: #FFC400
- **LOW (Verde)**: #69F0AE

## 3. COMPONENTES A CREAR

```
components/
├── LoginScreen.js (✓ Existe)
├── RegisterScreen.js (✓ Existe)
├── HomeScreen/
│   ├── PersonalTasks.js (mis tareas personales)
│   ├── GroupsList.js (lista de mis grupos)
│   └── CreateGroup.js (crear grupo)
├── GroupManagement/
│   ├── GroupDetail.js (ver detalles del grupo)
│   ├── GroupMembers.js (ver miembros)
│   ├── AdminPanel.js (panel de administrador)
│   ├── MemberStats.js (estadísticas de miembro)
│   └── JoinRequests.js (solicitudes de unión)
├── TaskManagement/
│   ├── TaskForm.js (crear/editar tarea)
│   ├── TaskList.js (lista de tareas con filtros)
│   ├── TaskDetail.js (detalle de tarea)
│   └── TaskFilters.js (filtros: tipo, prioridad, estado)
└── Common/
    ├── PriorityBadge.js
    ├── TaskCard.js
    └── LoadingScreen.js
```

## 4. FLUJOS PRINCIPALES

### A. Usuario personal con tareas
1. Ver mis tareas (diarias, semanales, mensuales)
2. Crear tarea personal
3. Filtrar por tipo y prioridad
4. Marcar como completada/eliminar

### B. Grupo de trabajo
1. Crear grupo → Invitar usuarios
2. Los usuarios ven solicitud y pueden aceptar/rechazar
3. Admin ve panel con todos los miembros
4. Admin puede asignar tareas a miembros
5. Admin ve estadísticas de cada miembro

### C. Admin de grupo
- Aceptar/rechazar solicitudes de unión
- Ver estadísticas: tareas completadas, pendientes, etc.
- Asignar tareas a miembros específicos
- Ver historial de actividad

## 5. ESTADOS Y TRANSICIONES

**Tarea**: pending → completed → deleted
**Solicitud de unión**: pending → accepted/rejected
**Usuario en grupo**: Sin grupo → Solicitud pendiente → Miembro → Admin

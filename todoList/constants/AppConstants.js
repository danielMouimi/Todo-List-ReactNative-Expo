// Constantes de la aplicación

export const PRIORITY_LEVELS = {
  HIGH: {
    value: 'high',
    label: 'Alta',
    color: '#FF5252',
    hex: '#FF5252'
  },
  MEDIUM: {
    value: 'medium',
    label: 'Media',
    color: '#FFC400',
    hex: '#FFC400'
  },
  LOW: {
    value: 'low',
    label: 'Baja',
    color: '#69F0AE',
    hex: '#69F0AE'
  }
};

export const TASK_TYPES = {
  DAILY: {
    value: 'daily',
    label: 'Diaria',
    icon: '☀️'
  },
  WEEKLY: {
    value: 'weekly',
    label: 'Semanal',
    icon: '📅'
  },
  MONTHLY: {
    value: 'monthly',
    label: 'Mensual',
    icon: '📊'
  }
};

export const TASK_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  DELETED: 'deleted'
};

export const USER_ROLES = {
  ADMIN: 'admin',
  MEMBER: 'member'
};

export const JOIN_REQUEST_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected'
};

export const getPriorityColor = (priority) => {
  return PRIORITY_LEVELS[priority.toUpperCase()]?.color || '#969696';
};

export const getTaskTypeLabel = (type) => {
  return TASK_TYPES[type.toUpperCase()]?.label || type;
};

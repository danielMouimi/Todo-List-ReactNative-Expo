import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PRIORITY_LEVELS } from '../../constants/AppConstants';

export default function PriorityBadge({ priority, size = 'small' }) {
  const priorityData = PRIORITY_LEVELS[priority.toUpperCase()];
  
  if (!priorityData) return null;

  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: priorityData.color,
          padding: isSmall ? 4 : 8,
          borderRadius: isSmall ? 4 : 8,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            fontSize: isSmall ? 10 : 12,
            fontWeight: isSmall ? '600' : '700',
          },
        ]}
      >
        {priorityData.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    textAlign: 'center',
  },
});

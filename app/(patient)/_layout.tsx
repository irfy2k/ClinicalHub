import { Tabs } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

export default function PatientLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
        headerStyle: {
          backgroundColor: theme.colors.background,
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTintColor: theme.colors.textLight,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <FontAwesome size={24} name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Appointments',
          tabBarIcon: ({ color }) => <FontAwesome size={24} name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="medications"
        options={{
          title: 'Medications',
          tabBarIcon: ({ color }) => <FontAwesome size={24} name="medkit" color={color} />,
        }}
      />
      <Tabs.Screen
        name="ehr"
        options={{
          title: 'Vault',
          tabBarIcon: ({ color }) => <FontAwesome size={24} name="folder-open" color={color} />,
        }}
      />
      <Tabs.Screen
        name="finances"
        options={{
          title: 'Finances',
          tabBarIcon: ({ color }) => <FontAwesome size={24} name="credit-card" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <FontAwesome size={24} name="user-circle" color={color} />,
        }}
      />
    </Tabs>
  );
}

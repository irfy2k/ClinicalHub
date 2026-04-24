import { Tabs } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

export default function DoctorLayout() {
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
        name="queue"
        options={{
          title: 'Queue',
          tabBarIcon: ({ color }) => <FontAwesome size={24} name="list" color={color} />,
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
        name="prescriptions"
        options={{
          title: 'Prescriptions',
          tabBarIcon: ({ color }) => <FontAwesome size={24} name="pencil-square-o" color={color} />,
        }}
      />
      <Tabs.Screen
        name="telemedicine"
        options={{
          title: 'Calls',
          tabBarIcon: ({ color }) => <FontAwesome size={24} name="video-camera" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <FontAwesome size={24} name="user-md" color={color} />,
        }}
      />
    </Tabs>
  );
}

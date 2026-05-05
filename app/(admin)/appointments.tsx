import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import { Services } from '../../services';
import { Appointment, User } from '../../types/database';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function AdminAppointmentsScreen() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [nameCache, setNameCache] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAppointments = useCallback(async (data: Appointment[]) => {
    const sorted = data.sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());
    setAppointments(sorted);

    const uniqueIds = new Set<string>();
    sorted.forEach((appt) => {
      if (appt.patient_id) uniqueIds.add(appt.patient_id);
      if (appt.doctor_id) uniqueIds.add(appt.doctor_id);
    });

    const missing = [...uniqueIds].filter((id) => !nameCache[id]);
    if (missing.length) {
      const entries = await Promise.all(
        missing.map(async (id) => {
          const profile = (await Services.auth.getUser(id)) as User | null;
          return [id, profile?.name || 'Unknown'] as const;
        })
      );
      setNameCache((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
    }
    setLoading(false);
    setRefreshing(false);
  }, [nameCache]);

  useFocusEffect(
    useCallback(() => {
      const unsubscribe = Services.appointment.onAll(loadAppointments);
      return unsubscribe;
    }, [loadAppointments])
  );

  const onRefresh = () => {
    setRefreshing(true);
    setRefreshing(false);
  };

  const handleDelete = (appt: Appointment) => {
    Alert.alert('Delete Appointment', 'This will permanently remove the appointment. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await Services.appointment.deleteAppointment(appt.id);
          setAppointments((prev) => prev.filter((item) => item.id !== appt.id));
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-background">
      <View className="px-6 pt-6 pb-2 bg-background">
        <Text className="text-textMuted text-sm tracking-wider uppercase mb-1">Admin Portal</Text>
        <Text className="text-2xl font-bold text-textLight">All Appointments</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 24, paddingTop: 8 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#85B523" />}
      >
        {loading ? (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color="#85B523" />
            <Text className="text-textMuted mt-4">Loading appointments...</Text>
          </View>
        ) : appointments.length === 0 ? (
          <View className="items-center justify-center py-20">
            <FontAwesome name="calendar" size={48} color="#2F333A" />
            <Text className="text-textMuted mt-4">No appointments found</Text>
          </View>
        ) : (
          appointments.map((appt) => (
            <Card key={appt.id} className="mb-4">
              <Text className="text-textLight font-bold text-lg">{appt.patient_name || nameCache[appt.patient_id] || 'Patient'}</Text>
              <Text className="text-textMuted text-sm">Doctor: {appt.doctor_name || nameCache[appt.doctor_id] || 'Doctor'}</Text>
              <Text className="text-textMuted text-sm mt-1">{new Date(appt.scheduled_at).toLocaleString()}</Text>
              <Text className="text-textMuted text-xs mt-2 uppercase">Status: {appt.status}</Text>
              <Button label="Delete" variant="danger" className="mt-3" onPress={() => handleDelete(appt)} />
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

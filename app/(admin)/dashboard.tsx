import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Services } from '../../services';
import { Card } from '../../components/ui/Card';
import { useRouter } from 'expo-router';

export default function AdminDashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAppointments: 0,
    activePrescriptions: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState<any[]>([]);
  const [recentPrescriptions, setRecentPrescriptions] = useState<any[]>([]);

  const syncStats = useCallback((users: any[], appointments: any[], prescriptions: any[]) => {
    const userMap = new Map(users.map((u: any) => [u.id, u.name]));

    const sortedAppointments = appointments
      .sort((a: any, b: any) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime())
      .slice(0, 5)
      .map((appt: any) => ({
        ...appt,
        patientLabel: appt.patient_name || userMap.get(appt.patient_id) || 'Patient',
        doctorLabel: appt.doctor_name || userMap.get(appt.doctor_id) || 'Doctor',
      }));

    const sortedPrescriptions = prescriptions
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map((presc: any) => ({
        ...presc,
        patientLabel: presc.patient_name || userMap.get(presc.patient_id) || 'Patient',
        doctorLabel: presc.doctor_name || userMap.get(presc.doctor_id) || 'Doctor',
      }));

    setStats({
      totalUsers: users.length,
      totalAppointments: appointments.length,
      activePrescriptions: prescriptions.filter((p: any) => p.is_active).length,
    });
    setRecentAppointments(sortedAppointments);
    setRecentPrescriptions(sortedPrescriptions);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let latestUsers: any[] = [];
      let latestAppointments: any[] = [];
      let latestPrescriptions: any[] = [];

      const unsubUsers = Services.auth.onAllUsers((users) => {
        latestUsers = users;
        syncStats(latestUsers, latestAppointments, latestPrescriptions);
      });
      const unsubAppointments = Services.appointment.onAll((appointments) => {
        latestAppointments = appointments;
        syncStats(latestUsers, latestAppointments, latestPrescriptions);
      });
      const unsubPrescriptions = Services.prescription.onAll((prescriptions) => {
        latestPrescriptions = prescriptions;
        syncStats(latestUsers, latestAppointments, latestPrescriptions);
      });

      return () => {
        unsubUsers();
        unsubAppointments();
        unsubPrescriptions();
      };
    }, [syncStats])
  );

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 24 }}>
      <View className="mb-8">
        <Text className="text-textMuted text-sm tracking-wider uppercase mb-1">Admin Portal</Text>
        <Text className="text-2xl font-bold text-textLight">System Overview</Text>
      </View>

      <View className="flex-row flex-wrap justify-between gap-y-4">
        <Card className="w-[48%] p-4 items-center">
          <View className="w-12 h-12 rounded-full bg-primary/20 items-center justify-center mb-3">
            <FontAwesome name="users" size={20} color="#3B82F6" />
          </View>
          <Text className="text-textLight font-bold text-xl">{stats.totalUsers}</Text>
          <Text className="text-textMuted text-xs mt-1">Total Users</Text>
        </Card>

        <Card className="w-[48%] p-4 items-center">
          <View className="w-12 h-12 rounded-full bg-green-500/20 items-center justify-center mb-3">
            <FontAwesome name="calendar" size={20} color="#10B981" />
          </View>
          <Text className="text-textLight font-bold text-xl">{stats.totalAppointments}</Text>
          <Text className="text-textMuted text-xs mt-1">Appointments</Text>
        </Card>

        <Card className="w-[48%] p-4 items-center">
          <View className="w-12 h-12 rounded-full bg-purple-500/20 items-center justify-center mb-3">
            <FontAwesome name="pencil-square-o" size={20} color="#8B5CF6" />
          </View>
          <Text className="text-textLight font-bold text-xl">{stats.activePrescriptions}</Text>
          <Text className="text-textMuted text-xs mt-1">Prescriptions</Text>
        </Card>

        <TouchableOpacity 
          className="w-[48%]"
          onPress={() => router.push('/(admin)/users')}
        >
          <Card className="p-4 items-center border-primary/50">
            <View className="w-12 h-12 rounded-full bg-surfaceLight items-center justify-center mb-3">
              <FontAwesome name="arrow-right" size={20} color="#94A3B8" />
            </View>
            <Text className="text-primary font-bold text-lg">Manage Users</Text>
            <Text className="text-textMuted text-xs mt-1">View All Records</Text>
          </Card>
        </TouchableOpacity>
      </View>

      <View className="mt-8">
        <Text className="text-textLight font-bold mb-4">Recent Appointments</Text>
        {recentAppointments.length === 0 ? (
          <Text className="text-textMuted">No appointments yet.</Text>
        ) : (
          recentAppointments.map((appt) => (
            <Card key={appt.id} className="mb-3">
              <Text className="text-textLight font-bold">{appt.patientLabel}</Text>
              <Text className="text-textMuted text-sm">Doctor: {appt.doctorLabel}</Text>
              <Text className="text-textMuted text-xs mt-1">{new Date(appt.scheduled_at).toLocaleString()}</Text>
            </Card>
          ))
        )}
      </View>

      <View className="mt-6">
        <Text className="text-textLight font-bold mb-4">Recent Prescriptions</Text>
        {recentPrescriptions.length === 0 ? (
          <Text className="text-textMuted">No prescriptions yet.</Text>
        ) : (
          recentPrescriptions.map((presc) => (
            <Card key={presc.id} className="mb-3">
              <Text className="text-textLight font-bold">{presc.medication_name}</Text>
              <Text className="text-textMuted text-sm">Doctor: {presc.doctorLabel}</Text>
              <Text className="text-textMuted text-sm">Patient: {presc.patientLabel}</Text>
            </Card>
          ))
        )}
      </View>
    </ScrollView>
  );
}

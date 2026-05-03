import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Services } from '../../services';
import { Appointment } from '../../types/database';
import { Card } from '../../components/ui/Card';
import clsx from 'clsx';
import { useRouter } from 'expo-router';

export default function DoctorAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<'Upcoming' | 'Past'>('Upcoming');
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadAppointments();
  }, [user]);

  const loadAppointments = async () => {
    if (!user) return;
    try {
      const data = await Services.appointment.getByDoctor(user.id);
      setAppointments(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load appointments.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAppointments();
  };

  const filteredAppointments = appointments.filter(appt => {
    const isPast = new Date(appt.scheduled_at) < new Date();
    if (filter === 'Upcoming') return !isPast && appt.status !== 'cancelled' && appt.status !== 'completed';
    return isPast || appt.status === 'completed' || appt.status === 'cancelled';
  });

  return (
    <View className="flex-1 bg-background">
      <View className="px-6 pt-6 pb-4 bg-background z-10">
        <Text className="text-3xl font-bold text-textLight mb-2">Master Schedule</Text>
        <Text className="text-textMuted text-sm mb-4">View your full calendar mapping.</Text>
        
        <View className="flex-row rounded-lg bg-surfaceLight p-1">
           <TouchableOpacity 
             className={clsx("flex-1 py-2 items-center rounded-md", filter === 'Upcoming' && "bg-surface border border-borderDark")}
             onPress={() => setFilter('Upcoming')}
           >
             <Text className={clsx("font-bold", filter === 'Upcoming' ? "text-textLight" : "text-textMuted")}>Upcoming</Text>
           </TouchableOpacity>
           <TouchableOpacity 
             className={clsx("flex-1 py-2 items-center rounded-md", filter === 'Past' && "bg-surface border border-borderDark")}
             onPress={() => setFilter('Past')}
           >
             <Text className={clsx("font-bold", filter === 'Past' ? "text-textLight" : "text-textMuted")}>Past</Text>
           </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={{ padding: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#85B523" />}
      >
        {isLoading ? (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color="#85B523" />
            <Text className="text-textMuted mt-4">Loading schedule...</Text>
          </View>
        ) : filteredAppointments.length === 0 ? (
          <View className="items-center justify-center py-20">
            <FontAwesome name="calendar-times-o" size={48} color="#2F333A" />
            <Text className="text-textMuted mt-4">No appointments found</Text>
          </View>
        ) : (
          filteredAppointments.map(appt => (
            <Card key={appt.id} className="mb-4">
              <View className="flex-row justify-between items-start mb-3">
                <View>
                  <Text className="text-primary text-xs font-bold uppercase tracking-wider mb-1">{appt.status}</Text>
                  <Text className="text-textLight font-bold text-lg">{appt.patient_name || 'Patient'}</Text>
                  <Text className="text-textMuted text-sm">MRN-{appt.patient_id.substring(0, 6).toUpperCase()}</Text>
                </View>
                <View className="bg-surfaceLight px-3 py-1.5 rounded-lg border border-borderDark items-center">
                  <Text className="text-textLight font-bold">{new Date(appt.scheduled_at).getDate()}</Text>
                  <Text className="text-textMuted text-xs uppercase">{new Date(appt.scheduled_at).toLocaleString('default', { month: 'short' })}</Text>
                </View>
              </View>
              
              <View className="h-px bg-borderDark mb-3 w-full" />
              
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center">
                  <FontAwesome name="clock-o" size={14} color="#94A3B8" />
                  <Text className="text-textMuted text-sm ml-2">
                    {new Date(appt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                {filter === 'Upcoming' && (
                   <TouchableOpacity onPress={() => router.push(`/(doctor)/queue`)}>
                     <Text className="text-primary font-bold text-sm">Manage in Queue</Text>
                   </TouchableOpacity>
                )}
              </View>

              <View className="mt-4 pt-4 border-t border-borderDark">
                  <Text className="text-textMuted text-xs font-semibold mb-1 uppercase tracking-wider">Patient Symptoms</Text>
                  <Text className="text-textLight text-sm leading-5">
                    {appt.notes || 'No preliminary notes provided.'}
                  </Text>
              </View>

              {appt.status !== 'completed' && appt.status !== 'cancelled' && (
                <View className="mt-4 pt-4 border-t border-borderDark flex-row justify-between items-center">
                   <Text className="text-textMuted text-xs mb-1">Engage Patient</Text>
                   <View className="flex-row gap-2">
                     <TouchableOpacity 
                       className="w-10 h-10 bg-surfaceLight border border-borderDark rounded-full items-center justify-center"
                       onPress={() => router.push(`/chat/${appt.id}` as any)}
                     >
                       <FontAwesome name="commenting" size={16} color="#E2E8F0" />
                     </TouchableOpacity>
                   </View>
                </View>
              )}
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

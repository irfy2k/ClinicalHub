import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
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
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const router = useRouter();

  useFocusEffect(
    React.useCallback(() => {
      loadAppointments();
    }, [user])
  );

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
                   <View className="flex-1">
                     <Text className="text-textMuted text-xs mb-1">Clinical Context</Text>
                     {appt.photo_data ? (
                       <TouchableOpacity onPress={() => setPreviewPhoto(appt.photo_data!)} className="flex-row items-center">
                         <FontAwesome name="image" size={14} color="#85B523" />
                         <Text className="text-primary font-semibold text-sm ml-2">View Symptom Photo</Text>
                       </TouchableOpacity>
                     ) : (
                       <Text className="text-textMuted text-sm italic">No photo attached</Text>
                     )}
                   </View>
                   <View className="flex-row gap-2">
                     <TouchableOpacity 
                       className="w-12 h-12 bg-surfaceLight border border-borderDark rounded-xl items-center justify-center relative"
                       onPress={() => router.push(`/chat/${appt.id}` as any)}
                     >
                       {(appt.unread_count_doctor || 0) > 0 && (
                         <View className="absolute -top-1 -right-1 bg-primary w-5 h-5 rounded-full items-center justify-center border-2 border-surface">
                           <Text className="text-background text-[10px] font-bold">{appt.unread_count_doctor || 0}</Text>
                         </View>
                       )}
                       <FontAwesome name="commenting" size={18} color="#E2E8F0" />
                     </TouchableOpacity>
                     <TouchableOpacity 
                       className="h-12 bg-primary/20 border border-primary rounded-xl px-4 items-center justify-center"
                       onPress={() => router.push(`/(doctor)/queue`)}
                     >
                        <Text className="text-primary font-bold text-sm">Manage</Text>
                     </TouchableOpacity>
                   </View>
                </View>
              )}
            </Card>
          ))
        )}
      </ScrollView>

      {/* Photo Preview Modal */}
      <Modal visible={!!previewPhoto} transparent animationType="fade">
        <View className="flex-1 bg-black/90 items-center justify-center p-6">
           <TouchableOpacity 
             className="absolute top-12 right-6 z-10 w-10 h-10 bg-white/10 rounded-full items-center justify-center"
             onPress={() => setPreviewPhoto(null)}
           >
             <FontAwesome name="close" size={20} color="white" />
           </TouchableOpacity>
           <View className="w-full h-[70%] bg-surface rounded-3xl overflow-hidden">
             {previewPhoto && (
               <View style={{ width: '100%', height: '100%' }}>
                  <View className="flex-1 items-center justify-center bg-zinc-900">
                     <FontAwesome name="image" size={80} color="#2F333A" />
                     <Text className="text-textMuted mt-4">Symptom Photo from Patient</Text>
                  </View>
               </View>
             )}
           </View>
        </View>
      </Modal>
    </View>
  );
}

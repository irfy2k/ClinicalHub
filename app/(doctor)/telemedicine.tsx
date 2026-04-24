import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Linking, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { mockUsers } from '../../services/mock/mockData';
import { Services } from '../../services';
import { Appointment } from '../../types/database';

export default function TelemedicineScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [activeAppointment, setActiveAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const checkActiveSlot = async () => {
      const appts = await Services.appointment.getByDoctor(user.id);
      const now = Date.now();
      const current = appts.find(a => {
        if (a.status === 'cancelled' || a.status === 'completed') return false;
        
        const apptTime = new Date(a.scheduled_at).getTime();
        // Allow call initiation 15 minutes prior, and up to 30 mins after scheduled block.
        return now >= (apptTime - 15 * 60000) && now <= (apptTime + 30 * 60000);
      });
      setActiveAppointment(current || null);
      setLoading(false);
    };
    checkActiveSlot();
  }, [user]);

  // Match the patient based on the active appointment
  const activePatient = activeAppointment 
     ? mockUsers.find(u => u.id === activeAppointment.patient_id) 
     : null;

  const initiateNativeCall = () => {
    if (!activePatient?.phone_number) {
      Alert.alert('Error', 'Patient phone number is not available.');
      return;
    }
    const url = `tel:${activePatient.phone_number}`;
    Linking.canOpenURL(url)
      .then(supported => {
        if (!supported) {
          Alert.alert('Unsupported', 'Phone dialer is not supported on this device/simulator.');
        } else {
          return Linking.openURL(url);
        }
      })
      .catch(err => console.error('An error occurred', err));
  };

  if (loading) {
     return <View className="flex-1 bg-black" />;
  }

  return (
    <View className="flex-1 bg-black">
       <View className="absolute inset-0 items-center justify-center">
         {!activeAppointment ? (
           <View className="items-center px-10">
             <FontAwesome name="lock" size={80} color="#2F333A" className="mb-6" />
             <Text className="text-red-400 font-bold text-xl mb-2 text-center mt-6">Restricted Access</Text>
             <Text className="text-textMuted text-center">
               You do not have any confirmed appointments scheduled within this current 30-minute time block. Video calls can only be initiated during an active patient block.
             </Text>
           </View>
         ) : (
           <>
             {/* Patient Video Placeholder */}
             <FontAwesome name="user" size={120} color="#2F333A" />
             <Text className="text-textMuted mt-4 text-lg text-center">
               {activePatient?.name || 'Patient'} is waiting.
             </Text>
             <Text className="text-textMuted text-sm text-center">
               ({activePatient?.phone_number || 'No Phone Registered'})
             </Text>
             
             <TouchableOpacity 
                className="mt-6 bg-primary px-6 py-3 rounded-full flex-row items-center shadow-lg"
                onPress={initiateNativeCall}
             >
                <FontAwesome name="external-link" size={18} color="#121417" />
                <Text className="text-background font-bold ml-2">Initiate Native Video Call</Text>
             </TouchableOpacity>
           </>
         )}
       </View>
       
       <View className="absolute top-12 left-6 right-6 flex-row justify-between items-center z-10">
          <View className="bg-background/80 px-4 py-2 rounded-full border border-borderDark flex-row items-center">
             <View className={`w-2 h-2 rounded-full mr-2 ${activeAppointment ? 'bg-primary' : 'bg-red-500'}`} />
             <Text className="text-textLight font-bold">{activeAppointment ? 'Active Session' : 'Locked'}</Text>
          </View>
          <TouchableOpacity 
             className="bg-surfaceLight/80 p-3 rounded-full border border-borderDark"
             onPress={() => router.push('/(doctor)/queue')}
          >
             <FontAwesome name="compress" size={16} color="#E2E8F0" />
          </TouchableOpacity>
       </View>

       {/* Doctor PIP */}
       <View className="absolute right-6 bottom-32 w-24 h-32 bg-surface border-2 border-borderDark rounded-xl overflow-hidden items-center justify-center shadow-lg">
          <Image 
            source={{ uri: user?.avatar_url || 'https://i.pravatar.cc/150?u=doctor' }}
            className="w-full h-full opacity-80"
            resizeMode="cover"
          />
       </View>

       <View className="absolute bottom-10 left-0 right-0 flex-row justify-center items-center gap-x-6">
          <TouchableOpacity className="w-14 h-14 bg-surfaceLight rounded-full items-center justify-center border border-borderDark opacity-50">
             <FontAwesome name="microphone-slash" size={24} color="#E2E8F0" />
          </TouchableOpacity>
          <TouchableOpacity 
             className="w-16 h-16 bg-red-500 rounded-full items-center justify-center shadow-lg"
             onPress={() => router.push('/(doctor)/queue')}
          >
             <FontAwesome name="phone" size={28} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
          </TouchableOpacity>
          <TouchableOpacity className="w-14 h-14 bg-surfaceLight rounded-full items-center justify-center border border-borderDark opacity-50">
             <FontAwesome name="video-camera" size={24} color="#E2E8F0" />
          </TouchableOpacity>
       </View>
    </View>
  );
}

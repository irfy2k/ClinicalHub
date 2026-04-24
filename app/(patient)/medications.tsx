import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Services } from '../../services';
import { Card } from '../../components/ui/Card';
import clsx from 'clsx';

export default function MedicationsScreen() {
  const { user } = useAuth();
  const [medications, setMedications] = useState<any[]>([]);
  const [adherenceScore, setAdherenceScore] = useState(85);

  useEffect(() => {
    // In a real scenario, fetch medications based on user
    setMedications([
      { id: 1, name: 'Amoxicillin', dosage: '500mg', time: '08:00 AM', status: 'taken', type: 'pill' },
      { id: 2, name: 'Lisinopril', dosage: '10mg', time: '01:00 PM', status: 'pending', type: 'pill' },
      { id: 3, name: 'Atorvastatin', dosage: '20mg', time: '08:00 PM', status: 'upcoming', type: 'pill' },
    ]);
  }, [user]);

  const toggleStatus = (id: number) => {
    setMedications(meds => meds.map(m => {
      if (m.id === id) {
        let nextStatus = 'taken';
        if (m.status === 'taken') nextStatus = 'skipped';
        else if (m.status === 'skipped') nextStatus = 'pending';
        return { ...m, status: nextStatus };
      }
      return m;
    }));
  };

  return (
    <View className="flex-1 bg-background">
      <View className="px-6 pt-6 pb-2 bg-background z-10">
        <Text className="text-3xl font-bold text-textLight mb-6">Medications</Text>
        
        <Card className="flex-row items-center p-4 bg-surfaceLight border-borderDark mb-4">
          <View className="mr-6 relative items-center justify-center">
            {/* Visual adherence ring mock */}
            <View className="w-16 h-16 rounded-full border-4 border-primary items-center justify-center">
              <Text className="text-textLight font-bold text-sm">{adherenceScore}%</Text>
            </View>
          </View>
          <View className="flex-1">
            <Text className="text-textLight font-bold text-lg">Weekly Adherence</Text>
            <Text className="text-textMuted text-sm leading-5">You're doing great! Keep taking your prescribed medications on time.</Text>
          </View>
        </Card>

        <Text className="text-textLight font-bold mt-4 mb-2">Today's Schedule</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 4 }}>
        {medications.map(med => (
          <Card key={med.id} className="mb-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className={clsx(
                "w-12 h-12 rounded-full items-center justify-center mr-4 border",
                med.status === 'taken' ? "bg-primary/20 border-primary" : 
                med.status === 'skipped' ? "bg-red-500/20 border-red-500" : 
                "bg-surfaceLight border-borderDark"
              )}>
                <FontAwesome 
                  name="medkit" 
                  size={20} 
                  color={
                    med.status === 'taken' ? '#85B523' : 
                    med.status === 'skipped' ? '#EF4444' : '#94A3B8'
                  } 
                />
              </View>
              <View>
                <Text className="text-textLight font-bold text-lg">{med.name} <Text className="text-textMuted font-normal text-sm">{med.dosage}</Text></Text>
                <Text className="text-textMuted text-sm mt-1">{med.time}</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              className={clsx(
                "px-4 py-2 rounded-lg border",
                med.status === 'taken' ? "border-primary bg-primary/10" : 
                med.status === 'skipped' ? "border-red-500 bg-red-500/10" : 
                "border-borderDark bg-surfaceLight"
              )}
              onPress={() => toggleStatus(med.id)}
            >
              <Text className={clsx(
                "font-bold text-sm",
                med.status === 'taken' ? "text-primary" : 
                med.status === 'skipped' ? "text-red-500" : 
                "text-textMuted"
              )}>
                {med.status === 'taken' ? 'Taken' : med.status === 'skipped' ? 'Skipped' : 'Mark'}
              </Text>
            </TouchableOpacity>
          </Card>
        ))}

        <Text className="text-textLight font-bold mt-6 mb-4">Active Prescriptions</Text>
        
        <Card className="mb-4">
          <View className="flex-row justify-between items-start mb-2">
            <View>
              <Text className="text-textLight font-bold text-lg">Amoxicillin</Text>
              <Text className="text-textMuted">Dr. Sarah Jenkins</Text>
            </View>
            <View className="bg-primary/20 px-2 py-1 rounded border border-primary">
              <Text className="text-primary text-xs font-bold uppercase tracking-wider">2 Refills</Text>
            </View>
          </View>
          <Text className="text-textMuted text-sm mt-2">Take 1 pill every 12 hours for 7 days.</Text>
        </Card>
        
      </ScrollView>
    </View>
  );
}

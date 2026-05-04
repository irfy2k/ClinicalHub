import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import { Services } from '../../services';
import { Prescription, User } from '../../types/database';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function AdminPrescriptionsScreen() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [nameCache, setNameCache] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPrescriptions = useCallback(async () => {
    try {
      const data = await Services.prescription.getAll();
      const sorted = data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setPrescriptions(sorted);

      const uniqueIds = new Set<string>();
      sorted.forEach((presc) => {
        if (presc.patient_id) uniqueIds.add(presc.patient_id);
        if (presc.doctor_id) uniqueIds.add(presc.doctor_id);
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
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [nameCache]);

  useFocusEffect(
    useCallback(() => {
      loadPrescriptions();
    }, [loadPrescriptions])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadPrescriptions();
  };

  const handleDelete = (presc: Prescription) => {
    Alert.alert('Delete Prescription', 'This will permanently remove the prescription. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await Services.prescription.deletePrescription(presc.id);
          setPrescriptions((prev) => prev.filter((item) => item.id !== presc.id));
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-background">
      <View className="px-6 pt-6 pb-2 bg-background">
        <Text className="text-textMuted text-sm tracking-wider uppercase mb-1">Admin Portal</Text>
        <Text className="text-2xl font-bold text-textLight">All Prescriptions</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 24, paddingTop: 8 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#85B523" />}
      >
        {loading ? (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color="#85B523" />
            <Text className="text-textMuted mt-4">Loading prescriptions...</Text>
          </View>
        ) : prescriptions.length === 0 ? (
          <View className="items-center justify-center py-20">
            <FontAwesome name="pencil-square-o" size={48} color="#2F333A" />
            <Text className="text-textMuted mt-4">No prescriptions found</Text>
          </View>
        ) : (
          prescriptions.map((presc) => (
            <Card key={presc.id} className="mb-4">
              <Text className="text-textLight font-bold text-lg">{presc.medication_name}</Text>
              <Text className="text-textMuted text-sm">Doctor: {presc.doctor_name || nameCache[presc.doctor_id] || 'Doctor'}</Text>
              <Text className="text-textMuted text-sm">Patient: {presc.patient_name || nameCache[presc.patient_id] || 'Patient'}</Text>
              <Text className="text-textMuted text-sm mt-1">Dosage: {presc.dosage}</Text>
              <Text className="text-textMuted text-xs mt-2 uppercase">Status: {presc.is_active ? 'active' : 'inactive'}</Text>
              <Button label="Delete" variant="danger" className="mt-3" onPress={() => handleDelete(presc)} />
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

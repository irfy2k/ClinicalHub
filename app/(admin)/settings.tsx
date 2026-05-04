import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Services } from '../../services';

export default function AdminSettingsScreen() {
  const { logout } = useAuth();
  const [lookup, setLookup] = useState('');
  const [isFixing, setIsFixing] = useState(false);

  const handleRebuildFinances = async () => {
    if (!lookup.trim()) {
      Alert.alert('Missing input', 'Enter a patient UID or email.');
      return;
    }
    setIsFixing(true);
    try {
      const users = await Services.auth.getAllUsers();
      const match = users.find((u) => u.id === lookup.trim() || u.email.toLowerCase() === lookup.trim().toLowerCase());
      if (!match) {
        Alert.alert('Not found', 'No user found with that UID or email.');
        return;
      }
      const count = await Services.finance.rebuildMedicationExpensesForPatient(match.id);
      Alert.alert('Done', `Rebuilt medication expenses for ${match.name}. Items: ${count}.`);
      setLookup('');
    } catch {
      Alert.alert('Error', 'Failed to rebuild medication expenses.');
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 24 }}>
      <Text className="text-2xl font-bold text-textLight mb-8">System Settings</Text>

      <Card className="mb-6">
        <Text className="text-textLight font-bold mb-4">Account</Text>
        <TouchableOpacity className="flex-row items-center py-3 border-b border-borderDark">
          <FontAwesome name="user" size={18} color="#94A3B8" className="mr-4 w-6" />
          <Text className="text-textLight">Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-row items-center py-3 border-b border-borderDark">
          <FontAwesome name="lock" size={18} color="#94A3B8" className="mr-4 w-6" />
          <Text className="text-textLight">Security & Privacy</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          className="flex-row items-center py-3"
          onPress={logout}
        >
          <FontAwesome name="sign-out" size={18} color="#EF4444" className="mr-4 w-6" />
          <Text className="text-red-500">Log Out</Text>
        </TouchableOpacity>
      </Card>

      <Card className="mb-6">
        <Text className="text-textLight font-bold mb-4">General</Text>
        <TouchableOpacity className="flex-row items-center py-3 border-b border-borderDark">
          <FontAwesome name="globe" size={18} color="#94A3B8" className="mr-4 w-6" />
          <Text className="text-textLight">Language</Text>
          <Text className="text-textMuted ml-auto text-sm">English</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-row items-center py-3">
          <FontAwesome name="bell" size={18} color="#94A3B8" className="mr-4 w-6" />
          <Text className="text-textLight">Notifications</Text>
        </TouchableOpacity>
      </Card>

      <Card className="mb-6">
        <Text className="text-textLight font-bold mb-4">Finance Repair</Text>
        <Text className="text-textMuted text-xs mb-3">Rebuild medication expenses from active prescriptions.</Text>
        <Input
          placeholder="Patient UID or email"
          value={lookup}
          onChangeText={setLookup}
        />
        <Button
          label={isFixing ? 'Rebuilding...' : 'Rebuild Medication Expenses'}
          onPress={handleRebuildFinances}
          disabled={isFixing}
          fullWidth
        />
      </Card>

      <Text className="text-center text-textMuted text-xs mt-4">SMD-Project Admin v1.0.0</Text>
    </ScrollView>
  );
}

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import { Services } from '../../services';
import { Card } from '../../components/ui/Card';
import { DefaultAvatar } from '../../components/ui/DefaultAvatar';
import { Input } from '../../components/ui/Input';
import { User } from '../../types/database';

export default function AdminUsersScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const allUsers = await Services.auth.getAllUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [loadUsers])
  );

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const renderUserItem = ({ item }: { item: User }) => (
    <Card className="mb-3 p-4 flex-row items-center">
      <DefaultAvatar uri={item.avatar_url} size={40} />
      <View className="ml-4 flex-1">
        <Text className="text-textLight font-bold">{item.name}</Text>
        <Text className="text-textMuted text-xs">{item.email}</Text>
      </View>
      <View className="items-end">
        <View className={`px-2 py-1 rounded-full ${
          item.role === 'admin' ? 'bg-red-500/20' : 
          item.role === 'doctor' ? 'bg-blue-500/20' : 'bg-green-500/20'
        }`}>
          <Text className={`text-[10px] font-bold uppercase ${
            item.role === 'admin' ? 'text-red-500' : 
            item.role === 'doctor' ? 'text-blue-500' : 'text-green-500'
          }`}>{item.role}</Text>
        </View>
      </View>
    </Card>
  );

  return (
    <View className="flex-1 bg-background p-6">
      <View className="mb-6">
        <Text className="text-2xl font-bold text-textLight mb-4">User Management</Text>
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3B82F6" className="mt-20" />
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderUserItem}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center mt-20">
              <FontAwesome name="user-times" size={40} color="#2F333A" />
              <Text className="text-textMuted mt-4">No users found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

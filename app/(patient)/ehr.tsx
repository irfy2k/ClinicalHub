import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function MedicalVaultScreen() {
  const [documents] = useState([
    { id: 1, title: 'Complete Blood Count (CBC)', date: 'Oct 24, 2023', type: 'Lab Result', doctor: 'Dr. Sarah Jenkins' },
    { id: 2, title: 'Chest X-Ray Report', date: 'Sep 12, 2023', type: 'Imaging', doctor: 'Dr. Marcus Thorne' },
    { id: 3, title: 'Annual Physical Summary', date: 'Aug 05, 2023', type: 'Clinical Note', doctor: 'Dr. Sarah Jenkins' },
  ]);

  const [activeFilter, setActiveFilter] = useState('All Records');

  const filteredDocs = documents.filter(doc => {
    if (activeFilter === 'All Records') return true;
    if (activeFilter === 'Labs' && doc.type === 'Lab Result') return true;
    if (activeFilter === 'Imaging' && doc.type === 'Imaging') return true;
    if (activeFilter === 'Notes' && doc.type === 'Clinical Note') return true;
    return false;
  });

  const FilterButton = ({ label }: { label: string }) => (
    <TouchableOpacity 
      className={activeFilter === label ? "bg-primary px-4 py-2 rounded-full mr-2" : "bg-surfaceLight border border-borderDark px-4 py-2 rounded-full mr-2"}
      onPress={() => setActiveFilter(label)}
    >
       <Text className={activeFilter === label ? "text-background font-bold" : "text-textLight font-semibold"}>
         {label}
       </Text>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-background">
      <View className="px-6 pt-6 pb-2 bg-background z-10">
        <Text className="text-3xl font-bold text-textLight mb-2">Medical Vault</Text>
        <Text className="text-textMuted text-sm mb-6">Securely access your clinical records, lab results, and imaging reports.</Text>
        
        {/* Quick Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          <FilterButton label="All Records" />
          <FilterButton label="Labs" />
          <FilterButton label="Imaging" />
          <FilterButton label="Notes" />
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 8 }}>
        {filteredDocs.length === 0 ? (
          <View className="items-center justify-center py-20">
            <FontAwesome name="folder-open-o" size={48} color="#2F333A" />
            <Text className="text-textMuted mt-4">No records found for this category</Text>
          </View>
        ) : (
          filteredDocs.map(doc => (
            <Card key={doc.id} className="mb-4">
            <View className="flex-row items-start justify-between mb-2">
               <View className="flex-1 pr-4">
                  <View className="flex-row items-center mb-1">
                    <FontAwesome name={doc.type === 'Lab Result' ? 'flask' : doc.type === 'Imaging' ? 'film' : 'file-text-o'} size={12} color="#85B523" />
                    <Text className="text-primary text-xs font-bold uppercase tracking-wider ml-2">{doc.type}</Text>
                  </View>
                  <Text className="text-textLight font-bold text-lg mb-1">{doc.title}</Text>
                  <Text className="text-textMuted text-sm">Ordered by {doc.doctor}</Text>
               </View>
               <View className="bg-surfaceLight border border-borderDark rounded-lg px-3 py-1 items-center">
                  <Text className="text-textLight font-bold">{doc.date.split(' ')[1].replace(',', '')}</Text>
                  <Text className="text-textMuted text-xs uppercase">{doc.date.split(' ')[0]}</Text>
               </View>
            </View>
            
            <View className="flex-row justify-end mt-4 pt-4 border-t border-borderDark">
               <TouchableOpacity 
                 className="flex-row items-center bg-surfaceLight border border-borderDark rounded-lg px-4 py-2 mr-3"
                 onPress={() => alert('Download document intent: PDF Mock')}
               >
                 <FontAwesome name="download" size={14} color="#E2E8F0" />
               </TouchableOpacity>
               <Button 
                 label="View Report" 
                 variant="secondary" 
                 className="py-2"
                 onPress={() => alert('Preview document intent')}
               />
            </View>
          </Card>
          ))
        )}
        
        <View className="items-center py-8">
           <FontAwesome name="lock" size={24} color="#2F333A" />
           <Text className="text-textMuted text-xs mt-3 text-center px-8">All documents are secured with end-to-end encryption compliant with HIPAA standards.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Services } from '../../services';
import { DocumentRecord, DocumentType } from '../../types/database';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import * as ImagePicker from 'expo-image-picker';

const FILE_TYPE_LABELS: Record<DocumentType, string> = {
  prescription: 'Prescription',
  lab_result: 'Lab Result',
  report: 'Report',
  other: 'Other',
};

const FILE_TYPE_ICONS: Record<DocumentType, string> = {
  prescription: 'file-text-o',
  lab_result: 'flask',
  report: 'file-o',
  other: 'paperclip',
};

type FilterKey = 'All Records' | 'Labs' | 'Prescriptions' | 'Reports';

export default function MedicalVaultScreen() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('All Records');

  const loadDocuments = useCallback(async () => {
    if (!user) return;
    const docs = await Services.document.getByPatient(user.id);
    setDocuments(docs);
  }, [user]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const filteredDocs = documents.filter(doc => {
    if (activeFilter === 'All Records') return true;
    if (activeFilter === 'Labs' && doc.file_type === 'lab_result') return true;
    if (activeFilter === 'Prescriptions' && doc.file_type === 'prescription') return true;
    if (activeFilter === 'Reports' && doc.file_type === 'report') return true;
    return false;
  });

  const handleUpload = async () => {
    if (!user) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const fileName = asset.fileName || `document_${Date.now()}.jpg`;
      const storagePath = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;

      await Services.document.create({
        patient_id: user.id,
        uploaded_by: user.id,
        file_name: fileName,
        file_type: 'other',
        storage_path: storagePath,
        file_size_bytes: asset.fileSize || 0,
      });

      loadDocuments();
      Alert.alert('Success', 'Document uploaded successfully.');
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const FilterButton = ({ label }: { label: FilterKey }) => (
    <TouchableOpacity
      className={activeFilter === label
        ? "bg-primary px-4 py-2 rounded-full mr-2"
        : "bg-surfaceLight border border-borderDark px-4 py-2 rounded-full mr-2"}
      onPress={() => setActiveFilter(label)}
    >
      <Text className={activeFilter === label
        ? "text-background font-bold"
        : "text-textLight font-semibold"}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-background">
      <View className="px-6 pt-6 pb-2 bg-background z-10">
        <Text className="text-3xl font-bold text-textLight mb-2">Medical Vault</Text>
        <Text className="text-textMuted text-sm mb-6">Securely access your clinical records, lab results, and prescriptions.</Text>

        {/* Quick Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          <FilterButton label="All Records" />
          <FilterButton label="Labs" />
          <FilterButton label="Prescriptions" />
          <FilterButton label="Reports" />
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
                    <FontAwesome
                      name={FILE_TYPE_ICONS[doc.file_type] as any}
                      size={12}
                      color="#85B523"
                    />
                    <Text className="text-primary text-xs font-bold uppercase tracking-wider ml-2">
                      {FILE_TYPE_LABELS[doc.file_type]}
                    </Text>
                  </View>
                  <Text className="text-textLight font-bold text-lg mb-1">
                    {doc.file_name.replace(/_/g, ' ').replace('.pdf', '')}
                  </Text>
                  <Text className="text-textMuted text-sm">
                    {doc.uploaded_by === user?.id ? 'Uploaded by you' : 'Uploaded by provider'}
                    {doc.file_size_bytes ? ` • ${formatFileSize(doc.file_size_bytes)}` : ''}
                  </Text>
                </View>
                <View className="bg-surfaceLight border border-borderDark rounded-lg px-3 py-1 items-center">
                  <Text className="text-textLight font-bold">
                    {new Date(doc.created_at).getDate()}
                  </Text>
                  <Text className="text-textMuted text-xs uppercase">
                    {new Date(doc.created_at).toLocaleString('default', { month: 'short' })}
                  </Text>
                </View>
              </View>

              <View className="flex-row justify-end mt-4 pt-4 border-t border-borderDark">
                <TouchableOpacity
                  className="flex-row items-center bg-surfaceLight border border-borderDark rounded-lg px-4 py-2 mr-3"
                  onPress={() => Alert.alert('Download', `Downloading ${doc.file_name}...`)}
                >
                  <FontAwesome name="download" size={14} color="#E2E8F0" />
                </TouchableOpacity>
                <Button
                  label="View Report"
                  variant="secondary"
                  className="py-2"
                  onPress={() => Alert.alert('Preview', `Opening ${doc.file_name} in viewer...`)}
                />
              </View>
            </Card>
          ))
        )}

        <View className="items-center py-8">
          <FontAwesome name="lock" size={24} color="#2F333A" />
          <Text className="text-textMuted text-xs mt-3 text-center px-8">
            All documents are secured with end-to-end encryption compliant with HIPAA standards.
          </Text>
        </View>
      </ScrollView>

      {/* Upload FAB */}
      <View className="absolute bottom-6 right-6">
        <TouchableOpacity
          className="w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg"
          onPress={handleUpload}
        >
          <FontAwesome name="cloud-upload" size={22} color="#121417" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function FinancesScreen() {
  const [invoices] = useState([
    { id: 1, title: 'Annual Wellness Visit', date: 'Oct 20, 2023', amount: 150.00, status: 'Paid', invoiceNo: 'INV-2023-001' },
    { id: 2, title: 'Lab Panel - Comprehensive', date: 'Sep 15, 2023', amount: 85.50, status: 'Pending', invoiceNo: 'INV-2023-042' },
    { id: 3, title: 'Prescription Refill - Metformin', date: 'Aug 28, 2023', amount: 12.00, status: 'Paid', invoiceNo: 'INV-2023-089' },
  ]);

  const [activeFilter, setActiveFilter] = useState('All');

  const filteredInvoices = invoices.filter(inv => {
    if (activeFilter === 'All') return true;
    return inv.status === activeFilter;
  });

  const FilterButton = ({ label }: { label: string }) => (
    <TouchableOpacity 
      className={activeFilter === label ? "bg-primary px-6 py-2 rounded-full mr-2" : "bg-surfaceLight border border-borderDark px-6 py-2 rounded-full mr-2"}
      onPress={() => setActiveFilter(label)}
    >
       <Text className={activeFilter === label ? "text-background font-bold" : "text-textLight font-semibold"}>
         {label}
       </Text>
    </TouchableOpacity>
  );

  const totalOutstanding = invoices
    .filter(inv => inv.status === 'Pending')
    .reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <View className="flex-1 bg-background">
      <View className="px-6 pt-6 pb-2 bg-background z-10">
        <Text className="text-3xl font-bold text-textLight mb-2">Finances</Text>
        <Text className="text-textMuted text-sm mb-6">Manage your medical billing, insurance claims, and payment history.</Text>
        
        {/* Summary Card */}
        <Card className="mb-6 bg-surfaceLight border-primary/20">
            <View className="flex-row justify-between items-center">
                <View>
                    <Text className="text-textMuted text-xs uppercase tracking-widest mb-1">Total Outstanding</Text>
                    <Text className="text-3xl font-bold text-textLight">${totalOutstanding.toFixed(2)}</Text>
                </View>
                <Button label="Pay All" className="px-6" />
            </View>
        </Card>

        {/* Quick Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          <FilterButton label="All" />
          <FilterButton label="Pending" />
          <FilterButton label="Paid" />
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 8 }}>
        {filteredInvoices.length === 0 ? (
          <View className="items-center justify-center py-20">
            <FontAwesome name="file-text-o" size={48} color="#2F333A" />
            <Text className="text-textMuted mt-4">No invoices found</Text>
          </View>
        ) : (
          filteredInvoices.map(invoice => (
            <Card key={invoice.id} className="mb-4">
              <View className="flex-row items-start justify-between mb-2">
                <View className="flex-1 pr-4">
                  <View className="flex-row items-center mb-1">
                    <FontAwesome 
                      name={invoice.status === 'Paid' ? 'check-circle' : 'clock-o'} 
                      size={12} 
                      color={invoice.status === 'Paid' ? '#85B523' : '#EAB308'} 
                    />
                    <Text className={`text-xs font-bold uppercase tracking-wider ml-2 ${invoice.status === 'Paid' ? 'text-primary' : 'text-yellow-500'}`}>
                      {invoice.status}
                    </Text>
                  </View>
                  <Text className="text-textLight font-bold text-lg mb-1">{invoice.title}</Text>
                  <Text className="text-textMuted text-sm">{invoice.invoiceNo} • {invoice.date}</Text>
                </View>
                <View>
                  <Text className="text-textLight font-bold text-xl">${invoice.amount.toFixed(2)}</Text>
                </View>
              </View>
              
              <View className="flex-row justify-end mt-4 pt-4 border-t border-borderDark">
                 <TouchableOpacity 
                   className="flex-row items-center bg-surfaceLight border border-borderDark rounded-lg px-4 py-2 mr-3"
                   onPress={() => alert('Download Invoice')}
                 >
                   <FontAwesome name="download" size={14} color="#E2E8F0" />
                 </TouchableOpacity>
                 {invoice.status === 'Pending' && (
                   <Button 
                     label="Pay Now" 
                     variant="secondary" 
                     className="py-2 px-6"
                     onPress={() => alert('Payment Gateaway Mock')}
                   />
                 )}
              </View>
            </Card>
          ))
        )}
        
        <View className="items-center py-8">
           <FontAwesome name="shield" size={24} color="#2F333A" />
           <Text className="text-textMuted text-xs mt-3 text-center px-8">Payments are processed securely. We accept all major credit cards and insurance providers.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

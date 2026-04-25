import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Services } from '../../services';
import { HealthExpense, ExpenseType } from '../../types/database';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import Svg, { Path, Circle } from 'react-native-svg';
import clsx from 'clsx';

// Expense type config
const EXPENSE_CONFIG: Record<ExpenseType, { label: string; color: string; icon: string }> = {
  consultation: { label: 'Consultations', color: '#85B523', icon: 'stethoscope' },
  medication: { label: 'Medications', color: '#3B82F6', icon: 'medkit' },
  lab: { label: 'Lab Work', color: '#A855F7', icon: 'flask' },
  other: { label: 'Other', color: '#F59E0B', icon: 'ellipsis-h' },
};

type FilterKey = 'All' | ExpenseType;

// Simple pie chart component using react-native-svg
function PieChart({ data }: { data: { type: ExpenseType; amount: number }[] }) {
  const total = data.reduce((sum, d) => sum + d.amount, 0);
  if (total === 0) return null;

  const size = 160;
  const radius = 64;
  const center = size / 2;
  const innerRadius = 40;

  let currentAngle = -Math.PI / 2; // Start from top

  const slices = data.filter(d => d.amount > 0).map(d => {
    const sliceAngle = (d.amount / total) * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;

    const x1 = center + radius * Math.cos(startAngle);
    const y1 = center + radius * Math.sin(startAngle);
    const x2 = center + radius * Math.cos(endAngle);
    const y2 = center + radius * Math.sin(endAngle);

    const ix1 = center + innerRadius * Math.cos(startAngle);
    const iy1 = center + innerRadius * Math.sin(startAngle);
    const ix2 = center + innerRadius * Math.cos(endAngle);
    const iy2 = center + innerRadius * Math.sin(endAngle);

    const largeArc = sliceAngle > Math.PI ? 1 : 0;

    const path = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${ix2} ${iy2}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1}`,
      'Z'
    ].join(' ');

    currentAngle = endAngle;

    return {
      path,
      color: EXPENSE_CONFIG[d.type].color,
      type: d.type,
      percentage: Math.round((d.amount / total) * 100),
    };
  });

  return (
    <View className="items-center">
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((slice, i) => (
          <Path key={i} d={slice.path} fill={slice.color} />
        ))}
        <Circle cx={center} cy={center} r={innerRadius - 2} fill="#1A1D21" />
      </Svg>
      <View className="absolute" style={{ top: size / 2 - 16, alignItems: 'center' }}>
        <Text className="text-textLight font-bold text-lg">${total.toFixed(0)}</Text>
        <Text className="text-textMuted text-[10px] uppercase">Total</Text>
      </View>
    </View>
  );
}

export default function FinancesScreen() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<HealthExpense[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('All');
  const [isAdding, setIsAdding] = useState(false);

  // Add Expense form state
  const [newType, setNewType] = useState<ExpenseType>('consultation');
  const [newAmount, setNewAmount] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const loadExpenses = useCallback(async () => {
    if (!user) return;
    const data = await Services.expense.getByPatient(user.id);
    setExpenses(data);
  }, [user]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  // Aggregate by type for pie chart
  const aggregated = (['consultation', 'medication', 'lab', 'other'] as ExpenseType[]).map(type => ({
    type,
    amount: expenses
      .filter(e => e.expense_type === type)
      .reduce((sum, e) => sum + e.amount, 0),
  }));

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  const filteredExpenses = expenses
    .filter(e => activeFilter === 'All' || e.expense_type === activeFilter)
    .sort((a, b) => new Date(b.date_incurred).getTime() - new Date(a.date_incurred).getTime());

  const handleAddExpense = async () => {
    if (!user || !newAmount || !newDescription) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    await Services.expense.create({
      patient_id: user.id,
      expense_type: newType,
      amount: parseFloat(newAmount),
      description: newDescription,
      date_incurred: new Date().toISOString(),
    });

    setNewAmount('');
    setNewDescription('');
    setNewType('consultation');
    setIsAdding(false);
    loadExpenses();
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const FilterButton = ({ label, value }: { label: string; value: FilterKey }) => (
    <TouchableOpacity
      className={activeFilter === value
        ? "bg-primary px-4 py-2 rounded-full mr-2"
        : "bg-surfaceLight border border-borderDark px-4 py-2 rounded-full mr-2"}
      onPress={() => setActiveFilter(value)}
    >
      <Text className={activeFilter === value
        ? "text-background font-bold"
        : "text-textLight font-semibold"}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-background">
      <View className="px-6 pt-6 pb-2 bg-background z-10">
        <Text className="text-3xl font-bold text-textLight mb-2">Finances</Text>
        <Text className="text-textMuted text-sm mb-4">Track your healthcare spending by category.</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 4 }}>
        {/* Pie Chart Dashboard */}
        <Card className="mb-6">
          <View className="flex-row items-center justify-between">
            {/* Chart */}
            <PieChart data={aggregated} />

            {/* Legend */}
            <View className="flex-1 ml-6">
              {aggregated.map(item => (
                <View key={item.type} className="flex-row items-center mb-3">
                  <View
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: EXPENSE_CONFIG[item.type].color }}
                  />
                  <View className="flex-1">
                    <Text className="text-textMuted text-xs">{EXPENSE_CONFIG[item.type].label}</Text>
                    <Text className="text-textLight font-bold">${item.amount.toFixed(2)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View className="h-px bg-borderDark my-4" />

          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-textMuted text-xs uppercase tracking-widest mb-1">Total Spending</Text>
              <Text className="text-2xl font-bold text-textLight">${totalSpent.toFixed(2)}</Text>
            </View>
            <Button label="+ Add" className="px-6" onPress={() => setIsAdding(true)} />
          </View>
        </Card>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          <FilterButton label="All" value="All" />
          <FilterButton label="Consults" value="consultation" />
          <FilterButton label="Meds" value="medication" />
          <FilterButton label="Labs" value="lab" />
          <FilterButton label="Other" value="other" />
        </ScrollView>

        {/* Transaction List */}
        <Text className="text-textLight font-bold mb-4">Transaction History</Text>

        {filteredExpenses.length === 0 ? (
          <View className="items-center justify-center py-16">
            <FontAwesome name="file-text-o" size={48} color="#2F333A" />
            <Text className="text-textMuted mt-4">No expenses found</Text>
          </View>
        ) : (
          filteredExpenses.map(expense => {
            const config = EXPENSE_CONFIG[expense.expense_type];
            return (
              <Card key={expense.id} className="mb-3">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center mr-3"
                      style={{ backgroundColor: config.color + '20' }}
                    >
                      <FontAwesome name={config.icon as any} size={16} color={config.color} />
                    </View>
                    <View className="flex-1 pr-4">
                      <Text className="text-textLight font-bold" numberOfLines={1}>{expense.description}</Text>
                      <View className="flex-row items-center mt-1">
                        <Text className="text-xs font-bold uppercase tracking-wider mr-2" style={{ color: config.color }}>
                          {config.label}
                        </Text>
                        <Text className="text-textMuted text-xs">• {formatDate(expense.date_incurred)}</Text>
                      </View>
                    </View>
                  </View>
                  <Text className="text-textLight font-bold text-lg">${expense.amount.toFixed(2)}</Text>
                </View>
              </Card>
            );
          })
        )}

        <View className="items-center py-8">
          <FontAwesome name="shield" size={24} color="#2F333A" />
          <Text className="text-textMuted text-xs mt-3 text-center px-8">
            Financial data is encrypted and stored securely. We do not share your data with third parties.
          </Text>
        </View>
      </ScrollView>

      {/* Add Expense Modal */}
      <Modal visible={isAdding} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-background pt-12 px-6">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-2xl font-bold text-textLight">Add Expense</Text>
            <TouchableOpacity onPress={() => setIsAdding(false)}>
              <FontAwesome name="close" size={24} color="#E2E8F0" />
            </TouchableOpacity>
          </View>

          {/* Type Selection */}
          <Text className="text-textMuted text-xs uppercase tracking-wider font-bold mb-3">Expense Type</Text>
          <View className="flex-row flex-wrap gap-2 mb-6">
            {(Object.entries(EXPENSE_CONFIG) as [ExpenseType, typeof EXPENSE_CONFIG[ExpenseType]][]).map(([type, config]) => (
              <TouchableOpacity
                key={type}
                className={clsx(
                  "flex-row items-center px-4 py-3 rounded-xl border",
                  newType === type ? "border-primary bg-primary/20" : "border-borderDark bg-surfaceLight"
                )}
                onPress={() => setNewType(type)}
              >
                <FontAwesome name={config.icon as any} size={14} color={newType === type ? '#85B523' : '#94A3B8'} />
                <Text className={clsx("ml-2 font-bold text-sm", newType === type ? "text-primary" : "text-textMuted")}>
                  {config.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            label="Amount ($)"
            placeholder="e.g. 75.00"
            value={newAmount}
            onChangeText={setNewAmount}
            keyboardType="decimal-pad"
          />

          <Input
            label="Description"
            placeholder="e.g. Annual checkup co-pay"
            value={newDescription}
            onChangeText={setNewDescription}
          />

          <Button label="Save Expense" fullWidth onPress={handleAddExpense} className="mt-4" />
        </View>
      </Modal>
    </View>
  );
}

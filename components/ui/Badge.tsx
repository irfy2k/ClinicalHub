import { View, Text } from 'react-native';
import clsx from 'clsx';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
}

export function Badge({ label, variant = 'default' }: BadgeProps) {
  const variants = {
    success: "bg-emerald-100 text-emerald-800",
    warning: "bg-amber-100 text-amber-800",
    danger: "bg-red-100 text-red-800",
    info: "bg-sky-100 text-sky-800",
    default: "bg-slate-100 text-slate-800",
  };

  const bgClass = variants[variant].split(' ')[0];
  const textClass = variants[variant].split(' ')[1];

  return (
    <View className={clsx("px-2 py-1 rounded-full self-start", bgClass)}>
      <Text className={clsx("text-xs font-semibold", textClass)}>{label}</Text>
    </View>
  );
}

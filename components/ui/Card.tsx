import { View, ViewProps } from 'react-native';
import { clsx } from 'clsx';

export function Card({ children, className, ...props }: ViewProps) {
  return (
    <View 
      className={clsx("bg-surface rounded-2xl p-5 border border-borderDark", className)} 
      {...props}
    >
      {children}
    </View>
  );
}

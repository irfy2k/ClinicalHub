import { TouchableOpacity, Text, TouchableOpacityProps } from 'react-native';
import { clsx } from 'clsx';

interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'light';
  fullWidth?: boolean;
}

export function Button({ label, variant = 'primary', fullWidth = false, className, ...props }: ButtonProps) {
  const baseClasses = "py-4 px-6 rounded-xl items-center justify-center flex-row";
  const widthClass = fullWidth ? "w-full" : "self-start";
  
  const variants = {
    primary: "bg-textLight", // Off-white button like in the login screen "Sign In ->"
    secondary: "bg-surfaceLight border border-borderDark",
    danger: "bg-red-500/20 border border-red-500/50",
    ghost: "bg-transparent",
    light: "bg-textLight",
  };
  
  const textVariants = {
    primary: "text-background font-bold text-base",
    secondary: "text-textLight font-semibold text-base",
    danger: "text-red-400 font-bold text-base",
    ghost: "text-textMuted font-semibold text-base",
    light: "text-background font-bold text-base",
  };

  return (
    <TouchableOpacity 
      className={clsx(
        baseClasses, 
        widthClass, 
        variants[variant], 
        props.disabled && "opacity-50",
        className
      )} 
      activeOpacity={0.7}
      {...props}
    >
      <Text className={textVariants[variant]}>{label}</Text>
    </TouchableOpacity>
  );
}

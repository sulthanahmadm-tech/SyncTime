import { motion } from 'framer-motion';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  variant?: 'smooth' | 'pop';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
  disabled?: boolean;
}

export const Checkbox = ({ 
  checked, 
  onChange, 
  variant = 'smooth',
  size = 'md',
  label,
  className = '',
  disabled = false
}: CheckboxProps) => {

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled) {
      onChange(!checked);
    }
  };

  const dimensions = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4'
  };

  return (
    <label 
      className={`flex items-center gap-3 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      onClick={handleToggle}
    >
      <div className="relative flex items-center justify-center">
        {variant === 'pop' ? (
          <motion.div
            initial={false}
            animate={{
              backgroundColor: checked ? '#10b981' : 'transparent', // emerald-500
              borderColor: checked ? '#10b981' : '#4b5563', // emerald-500 or gray-600
              scale: checked ? [1, 1.2, 1] : 1
            }}
            transition={{ duration: 0.2 }}
            className={`${dimensions[size]} border-2 rounded shrink-0 flex items-center justify-center`}
          >
            <motion.svg
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 20 }}
              className={`${iconSizes[size]} text-white`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </motion.svg>
          </motion.div>
        ) : (
          <div
            className={`${dimensions[size]} border-2 rounded shrink-0 flex items-center justify-center transition-all duration-200
              ${checked 
                ? 'bg-emerald-500 border-emerald-500 dark:bg-emerald-500 dark:border-emerald-500' 
                : 'bg-white border-gray-300 dark:bg-gray-800 dark:border-gray-600'
              }`}
          >
            <svg
              className={`${iconSizes[size]} text-white transition-opacity duration-200 ${checked ? 'opacity-100' : 'opacity-0'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
      {label && (
        <span className="text-gray-700 dark:text-gray-300 font-medium select-none text-sm">
          {label}
        </span>
      )}
    </label>
  );
};

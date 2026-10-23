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
              scale: checked ? [1, 1.15, 1] : 1
            }}
            transition={{ duration: 0.18 }}
            className={`${dimensions[size]} border-[1.5px] rounded-[5px] shrink-0 flex items-center justify-center transition-colors duration-150 ${
              checked
                ? 'bg-[#007AFF] border-[#007AFF] dark:bg-[#0A84FF] dark:border-[#0A84FF]'
                : 'bg-transparent border-[#8E8E93]/60'
            }`}
          >
            <motion.svg
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
              transition={{ delay: 0.05, type: "spring", stiffness: 320, damping: 22 }}
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
            className={`${dimensions[size]} border-[1.5px] rounded-[6px] shrink-0 flex items-center justify-center transition-all duration-150
              ${checked 
                ? 'bg-[#007AFF] border-[#007AFF] dark:bg-[#0A84FF] dark:border-[#0A84FF]' 
                : 'bg-white border-black/20 dark:bg-[#2C2C2E] dark:border-white/20'
              }`}
          >
            <svg
              className={`${iconSizes[size]} text-white transition-opacity duration-150 ${checked ? 'opacity-100' : 'opacity-0'}`}
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
        <span className="text-[#1D1D1F] dark:text-[#E5E5EA] font-medium select-none text-[13px]">
          {label}
        </span>
      )}
    </label>
  );
};


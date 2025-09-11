import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-gray-700 text-sm font-bold mb-2">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          <input
            ref={ref}
            className={cn(
              'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors',
              icon && 'pr-10',
              error && 'border-red-400',
              className
            )}
            {...props}
          />
          
          {icon && (
            <i className={cn(
              'absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400',
              icon
            )} />
          )}
        </div>
        
        {error && (
          <p className="text-red-500 text-xs mt-1">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

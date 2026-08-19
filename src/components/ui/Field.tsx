import { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

const fieldClasses =
  'w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-ink-700 dark:bg-ink-800 dark:text-white dark:placeholder:text-ink-500';

interface WrapperProps {
  label: string;
  children: ReactNode;
  required?: boolean;
}

function FieldWrapper({ label, children, required }: WrapperProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-200">
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </span>
      {children}
    </label>
  );
}

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function InputField({ label, required, className = '', ...props }: InputFieldProps) {
  return (
    <FieldWrapper label={label} required={required}>
      <input className={`${fieldClasses} ${className}`} required={required} {...props} />
    </FieldWrapper>
  );
}

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

export function TextareaField({ label, required, className = '', ...props }: TextareaFieldProps) {
  return (
    <FieldWrapper label={label} required={required}>
      <textarea className={`${fieldClasses} min-h-[80px] resize-y ${className}`} required={required} {...props} />
    </FieldWrapper>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string; label: string }[];
}

export function SelectField({ label, required, options, className = '', ...props }: SelectFieldProps) {
  return (
    <FieldWrapper label={label} required={required}>
      <select className={`${fieldClasses} ${className}`} required={required} {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
}

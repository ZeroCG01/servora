import React, { forwardRef } from 'react';

export const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    icon: Icon,
    className = '',
    type = 'text',
    required = false,
    ...props
  },
  ref
) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-semibold text-brand-900 mb-1.5 uppercase tracking-wider">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative rounded-xl shadow-xs">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-400">
            <Icon className="h-4 w-4" />
          </div>
        )}

        <input
          ref={ref}
          type={type}
          className={`block w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-brand-950 placeholder-brand-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:bg-brand-50 disabled:cursor-not-allowed ${
            Icon ? 'pl-10' : ''
          } ${
            error
              ? 'border-rose-400 text-rose-900 focus:border-rose-500 focus:ring-rose-400'
              : 'border-brand-200 hover:border-brand-300 focus:border-brand-500 focus:ring-brand-400'
          } ${className}`}
          {...props}
        />
      </div>

      {error ? (
        <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-brand-500">{helperText}</p>
      ) : null}
    </div>
  );
});

export default Input;


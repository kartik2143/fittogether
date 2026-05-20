const variants = {
  primary:   'bg-brand-600 text-white active:bg-brand-700 shadow-sm',
  secondary: 'bg-[#F2F2F7] dark:bg-[#2C2C2E] text-gray-800 dark:text-gray-100 active:bg-[#E5E5EA] dark:active:bg-[#3A3A3C]',
  danger:    'bg-red-500 text-white active:bg-red-600 shadow-sm',
  ghost:     'text-brand-600 dark:text-brand-400 active:bg-brand-50 dark:active:bg-brand-900/30',
}

const sizes = {
  sm: 'px-3 py-1.5 text-footnote rounded-apple',
  md: 'px-4 py-2   text-subhead rounded-apple',
  lg: 'px-5 py-3.5 text-callout  rounded-apple-lg font-semibold tracking-tight',
}

export function Button({ children, variant = 'primary', size = 'md', className = '', disabled, loading, ...props }) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 font-medium
        transition-all duration-100 active:scale-[0.98]
        focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500
        disabled:opacity-40 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      )}
      {children}
    </button>
  )
}

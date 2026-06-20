const fieldBase = `
  w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white
  placeholder:text-gray-400 transition-all duration-150
  focus:outline-none focus:ring-2 focus:ring-brand-500/70 focus:border-brand-400
`

export function Input({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[13px] font-semibold text-gray-700">{label}</label>
      )}
      <input
        {...props}
        className={`
          ${fieldBase}
          disabled:bg-gray-50 disabled:text-gray-500
          ${error ? 'border-red-400 bg-red-50' : 'border-gray-200'}
          ${className}
        `}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

export function Textarea({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[13px] font-semibold text-gray-700">{label}</label>
      )}
      <textarea
        {...props}
        className={`
          ${fieldBase} resize-none
          ${error ? 'border-red-400 bg-red-50' : 'border-gray-200'}
          ${className}
        `}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[13px] font-semibold text-gray-700">{label}</label>
      )}
      <select
        {...props}
        className={`
          ${fieldBase}
          ${error ? 'border-red-400' : 'border-gray-200'}
          ${className}
        `}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

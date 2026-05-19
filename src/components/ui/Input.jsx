// Apple-style filled inputs — no border, gray fill, focus darkens the fill
const base = `
  w-full px-3.5 py-3 rounded-apple text-[17px] leading-tight
  bg-[#F2F2F7] text-gray-900 placeholder-gray-400
  focus:outline-none focus:bg-[#E8E8ED]
  disabled:opacity-40
  transition-colors duration-150
`

export function Input({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-footnote font-medium text-gray-500 uppercase tracking-wide px-0.5">
          {label}
        </label>
      )}
      <input {...props} className={`${base} ${error ? 'ring-2 ring-red-400' : ''} ${className}`} />
      {error && <p className="text-footnote text-red-500 px-0.5">{error}</p>}
    </div>
  )
}

export function Textarea({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-footnote font-medium text-gray-500 uppercase tracking-wide px-0.5">
          {label}
        </label>
      )}
      <textarea
        {...props}
        className={`${base} resize-none ${error ? 'ring-2 ring-red-400' : ''} ${className}`}
      />
      {error && <p className="text-footnote text-red-500 px-0.5">{error}</p>}
    </div>
  )
}

export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-footnote font-medium text-gray-500 uppercase tracking-wide px-0.5">
          {label}
        </label>
      )}
      <select
        {...props}
        className={`${base} appearance-none ${error ? 'ring-2 ring-red-400' : ''} ${className}`}
      >
        {children}
      </select>
      {error && <p className="text-footnote text-red-500 px-0.5">{error}</p>}
    </div>
  )
}

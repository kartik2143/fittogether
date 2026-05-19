// Apple semantic color badges — soft tinted fills
const variants = {
  green:  'bg-green-500/12  text-green-700',
  yellow: 'bg-yellow-500/12 text-yellow-700',
  red:    'bg-red-500/12    text-red-600',
  blue:   'bg-blue-500/12   text-blue-700',
  gray:   'bg-gray-500/10   text-gray-600',
}

export function Badge({ children, variant = 'gray', className = '' }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-caption-1 font-semibold tracking-tight ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}

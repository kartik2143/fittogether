const variants = {
  // "green" kept as an alias but mapped to warm sage so completed/success
  // states read as done without the old brand green.
  green: 'bg-sage-100 text-sage-700',
  sage: 'bg-sage-100 text-sage-700',
  brand: 'bg-brand-100 text-brand-700',
  yellow: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-700',
  blue: 'bg-blue-100 text-blue-700',
  gray: 'bg-gray-100 text-gray-700',
}

export function Badge({ children, variant = 'gray', className = '' }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}

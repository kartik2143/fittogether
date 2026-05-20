// Apple semantic color badges — soft tinted fills
const variants = {
  green:  'bg-green-500/12  text-green-700  dark:bg-green-500/20  dark:text-green-400',
  yellow: 'bg-yellow-500/12 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400',
  red:    'bg-red-500/12    text-red-600    dark:bg-red-500/20    dark:text-red-400',
  blue:   'bg-blue-500/12   text-blue-700   dark:bg-blue-500/20   dark:text-blue-400',
  gray:   'bg-gray-500/10   text-gray-600   dark:bg-gray-500/20   dark:text-gray-400',
}

export function Badge({ children, variant = 'gray', className = '' }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-caption-1 font-semibold tracking-tight ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}

export function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-white rounded-2xl border border-gray-200/70 shadow-card ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

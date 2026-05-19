export function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-white rounded-apple-lg shadow-apple-card ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

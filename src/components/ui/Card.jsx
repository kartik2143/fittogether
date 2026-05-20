export function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-white dark:bg-[#1C1C1E] rounded-apple-lg shadow-apple-card dark:shadow-none ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

// Purpose: Reusable button with primary, secondary, and danger variants.
const variantClasses = {
  primary: 'bg-[#0A7C6E] text-white hover:bg-[#096D62]',
  secondary: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

const Button = ({ children, variant = 'primary', className = '', ...props }) => (
  <button
    className={`rounded px-4 py-2 transition disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant] || variantClasses.primary} ${className}`}
    {...props}
  >
    {children}
  </button>
);
export default Button;

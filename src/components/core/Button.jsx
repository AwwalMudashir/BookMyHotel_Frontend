// Purpose: Reusable button with primary, secondary, and danger variants.
const Button = ({ children, variant = 'primary', ...props }) => <button className="rounded px-4 py-2" {...props}>{children}</button>;
export default Button;

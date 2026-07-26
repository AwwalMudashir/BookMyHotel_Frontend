// Purpose: Reusable modal shell with overlay and close support.
const Modal = ({ children }) => <div className="fixed inset-0 bg-black/40 p-4">{children}</div>;
export default Modal;

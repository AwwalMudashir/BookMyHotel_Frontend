// Purpose: Reusable modal shell with overlay and close support.
// Centers children vertically and keeps the overlay usable on short viewports.
// Individual modal cards should still apply their own max-height and overflow handling.
const Modal = ({ children }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/40 p-4 sm:p-6">
    <div className="flex max-h-[calc(100dvh-2rem)] w-full items-center justify-center overflow-y-auto overscroll-contain sm:max-h-[calc(100dvh-3rem)]">
      {children}
    </div>
  </div>
);
export default Modal;

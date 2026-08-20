import PolicyInfoModal from './PolicyInfoModal';

// Purpose: Cancellation confirmation dialog for a customer's booking.
const CancelModal = ({ booking, payment, submitting, onConfirm, onClose }) => {
  if (!booking) return null;

  return (
    <PolicyInfoModal
      context="cancellation"
      booking={booking}
      payment={payment}
      busy={submitting}
      onClose={onClose}
      onContinue={onConfirm}
      continueLabel={submitting ? 'Cancelling…' : 'Yes, cancel booking'}
    />
  );
};

export default CancelModal;

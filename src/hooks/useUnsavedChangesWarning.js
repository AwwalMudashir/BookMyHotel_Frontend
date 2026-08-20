import { useEffect } from 'react';

// Browsers intentionally display their own wording for beforeunload prompts.
// Setting returnValue is still required to trigger that confirmation dialog.
const useUnsavedChangesWarning = (hasUnsavedChanges) => {
  useEffect(() => {
    if (!hasUnsavedChanges) return undefined;

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);
};

export default useUnsavedChangesWarning;

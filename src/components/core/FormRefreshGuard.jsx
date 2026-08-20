import { useEffect } from 'react';

const getForm = (target) => target?.closest?.('form') || null;

const serializeForm = (form) => JSON.stringify(
  Array.from(form.elements)
    .filter((control) => ['INPUT', 'SELECT', 'TEXTAREA'].includes(control.tagName))
    .map((control, index) => {
      if (control.type === 'checkbox' || control.type === 'radio') {
        return [index, control.type, control.checked, control.value];
      }
      if (control.type === 'file') {
        return [
          index,
          control.type,
          Array.from(control.files || []).map((file) => [file.name, file.size, file.lastModified]),
        ];
      }
      return [index, control.type, control.value];
    }),
);

// Tracks ordinary HTML forms centrally so admin, manager, profile, contact, review,
// and authentication forms all receive the same refresh/close protection.
const FormRefreshGuard = () => {
  useEffect(() => {
    const baselines = new Map();
    const dirtyForms = new Set();

    const shouldTrack = (form) => form && form.dataset.disableRefreshWarning !== 'true';

    const handleFocus = (event) => {
      const form = getForm(event.target);
      if (!shouldTrack(form) || baselines.has(form)) return;
      baselines.set(form, serializeForm(form));
    };

    const handleChange = (event) => {
      const form = getForm(event.target);
      if (!shouldTrack(form)) return;

      const baseline = baselines.get(form);
      if (baseline === undefined || serializeForm(form) !== baseline) dirtyForms.add(form);
      else dirtyForms.delete(form);
    };

    const handleReset = (event) => {
      const form = event.target;
      window.setTimeout(() => {
        dirtyForms.delete(form);
        if (form.isConnected) baselines.set(form, serializeForm(form));
        else baselines.delete(form);
      }, 0);
    };

    const handleCommitted = (event) => {
      const form = event.target?.matches?.('form') ? event.target : getForm(event.target);
      if (!shouldTrack(form)) return;
      dirtyForms.delete(form);
      baselines.set(form, serializeForm(form));
    };

    const hasConnectedDirtyForm = () => {
      for (const form of dirtyForms) {
        if (!form.isConnected) {
          dirtyForms.delete(form);
          baselines.delete(form);
          continue;
        }

        const baseline = baselines.get(form);
        if (baseline !== undefined && serializeForm(form) === baseline) {
          dirtyForms.delete(form);
          continue;
        }
        return true;
      }
      return false;
    };

    const handleBeforeUnload = (event) => {
      if (!hasConnectedDirtyForm()) return;
      event.preventDefault();
      event.returnValue = '';
    };

    document.addEventListener('focusin', handleFocus, true);
    document.addEventListener('input', handleChange, true);
    document.addEventListener('change', handleChange, true);
    document.addEventListener('reset', handleReset, true);
    document.addEventListener('form:committed', handleCommitted, true);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('focusin', handleFocus, true);
      document.removeEventListener('input', handleChange, true);
      document.removeEventListener('change', handleChange, true);
      document.removeEventListener('reset', handleReset, true);
      document.removeEventListener('form:committed', handleCommitted, true);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return null;
};

export default FormRefreshGuard;

import { useSyncExternalStore } from 'react';

const useWindowFocus = () => {
  return useSyncExternalStore(
    (callback) => {
      window.addEventListener('focus', callback);
      window.addEventListener('blur', callback);
      return () => {
        window.removeEventListener('focus', callback);
        window.removeEventListener('blur', callback);
      };
    },
    () => document.hasFocus(),
    () => true,
  );
};

export default useWindowFocus;

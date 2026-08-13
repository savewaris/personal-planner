import { useState, useCallback } from "react";

/**
 * Custom hook to manage auto-dismissing toast notification messages
 */
export function useToast(defaultDuration = 3000) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback(
    (message: string, duration = defaultDuration) => {
      setToastMessage(message);
      setTimeout(() => {
        setToastMessage(null);
      }, duration);
    },
    [defaultDuration]
  );

  const clearToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  return {
    toastMessage,
    showToast,
    clearToast,
  };
}

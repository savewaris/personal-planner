import { useEffect } from "react";

/**
 * Custom hook to listen for keyboard shortcuts (e.g. Cmd+K or Ctrl+K)
 *
 * @param targetKey The key to listen for (e.g. "k")
 * @param onTrigger Callback executed when Meta/Ctrl + key is pressed
 */
export function useKeyboardShortcut(targetKey: string, onTrigger: () => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === targetKey.toLowerCase()) {
        e.preventDefault();
        onTrigger();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [targetKey, onTrigger]);
}

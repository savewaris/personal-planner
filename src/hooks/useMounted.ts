import { useState, useEffect } from "react";

/**
 * Custom hook to verify whether component is mounted on client side (SSR safety check)
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}

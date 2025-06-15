
import * as React from "react";

/**
 * Detects if the device is a "real" mobile device (phone/tablet), not just a small window.
 * Returns true only if both:
 * - innerWidth is less than 768px (breakpoint), and
 * - User agent contains iPhone, Android, iPad, or other mobile indicators.
 */
export function useIsRealMobile() {
  const [isRealMobile, setIsRealMobile] = React.useState<boolean>(false);

  React.useEffect(() => {
    const check = () => {
      const isSmall = window.innerWidth < 768;
      const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
      // Check for classic mobile user agent fragments
      const uaIsMobile =
        /iPhone|Android|Mobile|iPad|iPod|Opera Mini|IEMobile|BlackBerry|webOS/i.test(ua);
      setIsRealMobile(isSmall && uaIsMobile);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isRealMobile;
}

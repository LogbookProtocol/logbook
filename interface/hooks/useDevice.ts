'use client';

import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

interface DeviceInfo {
  device: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  hasTouch: boolean;
}

export function useDevice(): DeviceInfo {
  const [device, setDevice] = useState<DeviceType>('desktop');
  const [hasTouch, setHasTouch] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setDevice('mobile');
      } else if (width < 1024) {
        setDevice('tablet');
      } else {
        setDevice('desktop');
      }
    };

    const checkTouch = () => {
      setHasTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };

    checkDevice();
    checkTouch();

    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return {
    device,
    isMobile: device === 'mobile',
    isTablet: device === 'tablet',
    isDesktop: device === 'desktop',
    hasTouch,
  };
}

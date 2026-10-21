'use client';

import React from 'react';
import { PortalAuthProvider } from './PortalAuthProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return <PortalAuthProvider usePrivyMode={false}>{children}</PortalAuthProvider>;
}

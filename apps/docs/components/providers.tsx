'use client';
import { ThemeProvider, Toaster, TooltipProvider } from '@bindshq/stance-react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <TooltipProvider>
        {children}
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}

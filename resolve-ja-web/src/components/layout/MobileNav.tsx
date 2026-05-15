'use client';

import { X } from 'lucide-react';
import { AppArea, AppSidebar } from '@/components/layout/AppSidebar';
import { Button } from '@/components/ui/button';

type MobileNavProps = {
  area: AppArea;
  open: boolean;
  onClose: () => void;
};

export function MobileNav({ area, open, onClose }: MobileNavProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Fechar menu"
        onClick={onClose}
      />
      <div className="absolute inset-y-0 left-0 w-[88%] max-w-80 bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
          <p className="text-sm font-medium">Navegação</p>
          <Button size="icon-sm" variant="ghost" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>
        <AppSidebar area={area} className="border-r-0" onNavigate={onClose} />
      </div>
    </div>
  );
}

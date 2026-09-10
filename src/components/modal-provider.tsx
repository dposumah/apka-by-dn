'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type ModalContextType = {
  confirm: (message: string, title?: string, confirmText?: string, cancelText?: string) => Promise<boolean>;
  alert: (message: string, title?: string) => Promise<void>;
};

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'alert' | 'confirm';
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    resolve: ((value: boolean | void) => void) | null;
  }>({
    isOpen: false,
    type: 'alert',
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: 'Batal',
    resolve: null,
  });

  const confirm = (message: string, title = 'Konfirmasi', confirmText = 'Ya, Lanjutkan', cancelText = 'Batal'): Promise<boolean> => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        type: 'confirm',
        title,
        message,
        confirmText,
        cancelText,
        resolve: resolve as any,
      });
    });
  };

  const alert = (message: string, title = 'Informasi'): Promise<void> => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        type: 'alert',
        title,
        message,
        confirmText: 'OK',
        cancelText: '',
        resolve: resolve as any,
      });
    });
  };

  const handleClose = (value: boolean) => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
    if (modalState.resolve) {
      modalState.resolve(value);
    }
  };

  return (
    <ModalContext.Provider value={{ confirm, alert }}>
      {children}
      <Dialog open={modalState.isOpen} onOpenChange={(open) => {
        if (!open) handleClose(false);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{modalState.title}</DialogTitle>
            <DialogDescription className="pt-2">{modalState.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end gap-2 mt-4">
            {modalState.type === 'confirm' && (
              <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                {modalState.cancelText}
              </Button>
            )}
            <Button type="button" onClick={() => handleClose(true)}>
              {modalState.confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModalContext.Provider>
  );
}

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

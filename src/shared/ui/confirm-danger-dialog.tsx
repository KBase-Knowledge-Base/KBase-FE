import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './dialog';
import { Button } from './button';
import { Input } from './input';
import { AlertTriangle } from 'lucide-react';

export interface ConfirmDangerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  confirmMatch?: string; // If provided, user must type this string to enable confirm
  confirmMatchPlaceholder?: string;
  isConfirming?: boolean;
  onConfirm: () => void;
}

export const ConfirmDangerDialog: React.FC<ConfirmDangerDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Xóa vĩnh viễn',
  confirmMatch,
  confirmMatchPlaceholder,
  isConfirming = false,
  onConfirm,
}) => {
  const [matchInput, setMatchInput] = useState('');

  const isMatchValid = !confirmMatch || matchInput.trim() === confirmMatch.trim();

  const handleConfirm = () => {
    if (!isMatchValid) return;
    onConfirm();
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isConfirming) {
      if (!newOpen) setMatchInput('');
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-semantic-danger-bg border border-semantic-danger-border flex items-center justify-center text-semantic-danger shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription className="mt-2 text-ink-muted">
            {description}
          </DialogDescription>
        </DialogHeader>

        {confirmMatch && (
          <div className="space-y-2 mt-2">
            <p className="text-xs text-ink-muted">
              Để xác nhận, vui lòng nhập <span className="font-semibold text-ink font-mono">{confirmMatch}</span> vào ô bên dưới:
            </p>
            <Input
              value={matchInput}
              onChange={(e) => setMatchInput(e.target.value)}
              placeholder={confirmMatchPlaceholder || confirmMatch}
              autoFocus
            />
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isConfirming}
          >
            Hủy
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleConfirm}
            isLoading={isConfirming}
            disabled={!isMatchValid || isConfirming}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

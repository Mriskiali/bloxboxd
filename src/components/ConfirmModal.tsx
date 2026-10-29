import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ConfirmModal: React.FC = () => {
  const { confirmDialog, closeConfirm, language } = useApp();

  useEffect(() => {
    if (!confirmDialog) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeConfirm();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmDialog, closeConfirm]);

  if (!confirmDialog) return null;

  const {
    title,
    message,
    confirmText = language === 'id' ? 'Ya, Lanjutkan' : 'Yes, Continue',
    cancelText = language === 'id' ? 'Batal' : 'Cancel',
    isDestructive = false,
    onConfirm
  } = confirmDialog;

  const handleConfirm = () => {
    onConfirm();
    closeConfirm();
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={closeConfirm}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-panel border border-line rounded-[3px] p-5 shadow-[0_16px_36px_rgba(0,0,0,0.65)] space-y-4"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start gap-3.5">
          <div className={`p-2.5 rounded-[3px] flex-shrink-0 ${
            isDestructive ? 'bg-red-500/15 text-red-400 border border-red-500/25' : 'bg-orange/15 text-orange border border-orange/25'
          }`}>
            {isDestructive ? <Trash2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>

          <div className="flex-1 min-w-0 pr-2">
            <h3 className="text-sm font-bold text-white tracking-tight">
              {title}
            </h3>
            <p className="mt-1 text-xs text-ink leading-relaxed">
              {message}
            </p>
          </div>

          <button
            type="button"
            onClick={closeConfirm}
            className="text-muted hover:text-white p-1 rounded-[2px] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-line">
          <button
            type="button"
            onClick={closeConfirm}
            className="bb-btn bb-btn-ghost text-xs cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`px-4 py-2 rounded-[2px] font-semibold text-xs transition-colors cursor-pointer ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_2px_8px_rgba(220,38,38,0.35)]'
                : 'bb-btn bb-btn-primary'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

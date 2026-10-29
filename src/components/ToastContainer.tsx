import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-5 sm:bottom-5 z-[110] flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map(toast => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-[3px] shadow-[0_12px_28px_rgba(0,0,0,0.65)] border text-xs leading-snug transition-all transform animate-in slide-in-from-bottom-2 duration-150 ${
              isSuccess
                ? 'bg-[#101f16] border-green/30 text-green-200'
                : isError
                ? 'bg-[#261314] border-red-500/35 text-red-200'
                : 'bg-[#151c27] border-blue-500/30 text-blue-200'
            }`}
            role="status"
          >
            <div className="mt-0.5 flex-shrink-0">
              {isSuccess && <CheckCircle2 className="w-4 h-4 text-green" />}
              {isError && <AlertCircle className="w-4 h-4 text-red-400" />}
              {!isSuccess && !isError && <Info className="w-4 h-4 text-blue-400" />}
            </div>

            <div className="flex-1 font-medium text-white/90">
              {toast.message}
            </div>

            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-muted hover:text-white p-0.5 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

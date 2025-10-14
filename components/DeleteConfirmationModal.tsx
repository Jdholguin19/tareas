import React from 'react';
import { Icon } from './Icon';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  taskTitle: string;
  isDeleting?: boolean;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  taskTitle,
  isDeleting = false
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center p-2 sm:p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-white rounded-xl sm:rounded-2xl shadow-xl w-full max-w-sm p-4 sm:p-6 animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Icon name="close" className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-slate-800 mb-2">Eliminar tarea</h2>
            <p className="text-sm text-slate-600 mb-4">
              ¿Estás seguro de que quieres eliminar "<span className="font-medium text-slate-800">{taskTitle}</span>"?
              Esta acción no se puede deshacer.
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end items-center space-y-2 sm:space-y-0 sm:space-x-3 space-y-reverse">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="w-full sm:w-auto px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-400 font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 font-medium flex items-center justify-center transition-colors"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Eliminando...
              </>
            ) : (
              'Eliminar'
            )}
          </button>
        </div>
      </div>

      <style>{`
        .animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

import React, { useEffect, useState } from 'react';

type DialogType = 'success' | 'error' | 'confirm' | 'info';

interface AppDialogProps {
    isOpen: boolean;
    onClose: () => void;
    type?: DialogType;
    title: string;
    message: string;
    onConfirm?: () => void;
    // Legacy mapping (optional, for backward compatibility if needed, though we will align to the new request)
    primaryButtonText?: string;
    secondaryActionText?: string;
    onPrimaryAction?: () => void; // mapped to onConfirm
}

export default function AppDialog({
    isOpen,
    onClose,
    type = 'success',
    title,
    message,
    onConfirm,
    primaryButtonText,
    onPrimaryAction
}: AppDialogProps) {
    const [show, setShow] = useState(isOpen);

    useEffect(() => {
        setShow(isOpen);
    }, [isOpen]);

    if (!show) return null;

    const handleConfirm = () => {
        if (onConfirm) onConfirm();
        else if (onPrimaryAction) onPrimaryAction();
        else onClose();
    };

    const getIcon = () => {
        switch (type) {
            case 'success': return 'check_circle';
            case 'error': return 'error';
            case 'confirm':
            case 'info': return 'event_busy'; // Using event_busy for cancel/confirm by default as per request visual
        }
    };

    const getIconBgClass = () => {
        switch (type) {
            case 'success': return 'bg-green-100 dark:bg-green-900/20 text-green-600';
            case 'error': return 'bg-red-100 dark:bg-red-900/20 text-status-red';
            case 'confirm': return 'bg-red-100 dark:bg-red-900/20 text-status-red'; // Confirm is usually destructive/warn in this context
            case 'info': return 'bg-blue-100 dark:bg-blue-900/20 text-blue-600';
        }
    };

    const getPrimaryButtonClass = () => {
        switch (type) {
            case 'confirm':
            case 'error':
                return 'bg-status-red hover:bg-red-600 shadow-red-500/20 text-white';
            case 'success':
                return 'bg-primary hover:bg-primary-dark text-black shadow-primary/20';
            case 'info':
                return 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20';
        }
    };

    const confirmLabel = primaryButtonText || (type === 'confirm' ? 'Sí, confirmar' : 'Aceptar');
    const cancelLabel = type === 'confirm' ? 'No, cancelar' : null;

    return (
        <div aria-labelledby="modal-title" aria-modal="true" className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" role="dialog">
            <div className="fixed inset-0 bg-background-dark/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            <div className="relative transform overflow-hidden rounded-2xl bg-card-light dark:bg-card-dark text-left shadow-2xl transition-all sm:w-full sm:max-w-lg border border-gray-100 dark:border-gray-700 animate-in zoom-in-95 duration-200">
                <div className="px-4 pb-4 pt-5 sm:p-8">
                    <div className="sm:flex sm:items-start">
                        <div className={`mx-auto flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-12 sm:w-12 ${getIconBgClass()}`}>
                            <span className="material-symbols-outlined text-2xl">{getIcon()}</span>
                        </div>
                        <div className="mt-3 text-center sm:ml-5 sm:mt-0 sm:text-left w-full">
                            <h3 className="text-xl font-bold leading-6 text-text-main dark:text-white" id="modal-title">
                                {title}
                            </h3>
                            <div className="mt-3">
                                <p className="text-sm text-text-sub dark:text-gray-400">
                                    {message}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 dark:bg-black/20 px-4 py-4 sm:flex sm:flex-row-reverse sm:px-8 gap-3">
                    <button
                        onClick={handleConfirm}
                        className={`inline-flex w-full justify-center rounded-lg px-5 py-2.5 text-sm font-bold shadow-lg transition-all ${getPrimaryButtonClass()} sm:w-auto`}
                        type="button"
                    >
                        {confirmLabel}
                    </button>
                    {(cancelLabel || type === 'confirm') && (
                        <button
                            onClick={onClose}
                            className="mt-3 inline-flex w-full justify-center rounded-lg bg-white dark:bg-transparent px-5 py-2.5 text-sm font-semibold text-text-main dark:text-gray-300 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 sm:mt-0 sm:w-auto transition-all"
                            type="button"
                        >
                            {cancelLabel || 'Cancelar'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

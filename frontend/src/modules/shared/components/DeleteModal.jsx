import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

const DeleteModal = ({ isOpen, onClose, onConfirm, title = "Delete?", description = "This action is permanent and cannot be undone." }) => {
    const [isDeleting, setIsDeleting] = useState(false);

    if (!isOpen) return null;

    const handleDelete = async () => {
        setIsDeleting(true);
        const result = await onConfirm();
        setIsDeleting(false);
        if (result?.success) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white relative z-10 w-full max-w-md rounded-[2rem] p-6 md:p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center text-center">
                    <div className="bg-red-50 p-4 rounded-full mb-6">
                        <AlertTriangle className="w-10 h-10 text-red-500" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-serif font-bold text-black mb-3">{title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed mb-8">
                        {description}
                    </p>
                    <div className="flex flex-col w-full gap-3">
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="w-full bg-red-500 text-white py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all disabled:opacity-50"
                        >
                            {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                        </button>
                        <button
                            onClick={onClose}
                            disabled={isDeleting}
                            className="w-full bg-gray-100 text-gray-600 py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-gray-200 transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteModal;

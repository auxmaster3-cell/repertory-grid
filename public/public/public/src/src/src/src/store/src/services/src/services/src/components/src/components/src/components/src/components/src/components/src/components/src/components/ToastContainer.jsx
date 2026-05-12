import React from 'react';
import useStore from '../store/useStore';

export default function ToastContainer() {
  const { toasts } = useStore();

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-2xl shadow-lg text-sm font-medium animate-fade-in max-w-sm ${
            toast.type === 'success' ? 'bg-success text-white' :
            toast.type === 'error' ? 'bg-secondary-500 text-white' :
            toast.type === 'warning' ? 'bg-amber-500 text-white' :
            'bg-primary-600 text-white'
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}

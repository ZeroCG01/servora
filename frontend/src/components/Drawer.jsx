import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  position = 'right',
  width = 'max-w-md',
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-brand-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div
        className={`fixed inset-y-0 ${
          position === 'right' ? 'right-0' : 'left-0'
        } flex max-w-full`}
      >
        <div
          className={`w-screen ${width} bg-white shadow-2xl border-l border-brand-100 flex flex-col transform transition-transform ease-in-out duration-300 animate-in slide-in-from-right`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-brand-100 bg-brand-50/50">
            <h3 className="text-lg font-bold text-brand-900">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-brand-400 hover:text-brand-700 hover:bg-brand-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default Drawer;

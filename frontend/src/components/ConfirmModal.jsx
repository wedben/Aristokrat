import React, { useEffect, useState } from 'react';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Подтверждение", 
  message = "Вы уверены?", 
  confirmText = "Да", 
  cancelText = "Отмена",
  type = "warning" 
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return '🗑️';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '❓';
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'danger':
        return {
          iconBg: 'bg-gradient-to-br from-rose-100 to-red-100',
          iconBorder: 'border-rose-200',
          confirmButton: 'bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white shadow-rose-200',
          titleColor: 'text-rose-800',
          messageColor: 'text-rose-700'
        };
      case 'warning':
        return {
          iconBg: 'bg-gradient-to-br from-amber-100 to-yellow-100',
          iconBorder: 'border-amber-200',
          confirmButton: 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-amber-200',
          titleColor: 'text-amber-800',
          messageColor: 'text-amber-700'
        };
      case 'info':
        return {
          iconBg: 'bg-gradient-to-br from-blue-100 to-indigo-100',
          iconBorder: 'border-blue-200',
          confirmButton: 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-blue-200',
          titleColor: 'text-blue-800',
          messageColor: 'text-blue-700'
        };
      default:
        return {
          iconBg: 'bg-gradient-to-br from-gray-100 to-slate-100',
          iconBorder: 'border-gray-200',
          confirmButton: 'bg-gradient-to-r from-gray-500 to-slate-500 hover:from-gray-600 hover:to-slate-600 text-white shadow-gray-200',
          titleColor: 'text-gray-800',
          messageColor: 'text-gray-700'
        };
    }
  };

  const styles = getStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black transition-all duration-300 ${
          isAnimating ? 'bg-opacity-50' : 'bg-opacity-0'
        }`}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`
        relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 
        transform transition-all duration-300 ease-out
        ${isAnimating ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}
        border border-gray-100
      `}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-6">
            <div className={`
              ${styles.iconBg} ${styles.iconBorder}
              w-12 h-12 rounded-full flex items-center justify-center
              border-2 shadow-lg
            `}>
              <span className="text-2xl animate-pulse">{getIcon()}</span>
            </div>
            <h3 className={`text-xl font-bold ${styles.titleColor}`}>{title}</h3>
          </div>
          
          {/* Message */}
          <div className="mb-8">
            <p className={`${styles.messageColor} leading-relaxed text-base`}>{message}</p>
          </div>
          
          {/* Actions */}
          <div className="flex space-x-3 justify-end">
            <button
              onClick={onClose}
              className="px-6 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200 font-medium hover:shadow-md transform hover:-translate-y-0.5"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`
                px-6 py-3 rounded-lg transition-all duration-200 font-medium 
                ${styles.confirmButton}
                shadow-lg hover:shadow-xl transform hover:-translate-y-0.5
                active:scale-95
              `}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;

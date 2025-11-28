import { useState } from 'react';
import ConfirmModal from '../components/ConfirmModal';

export const useConfirm = () => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Да',
    cancelText: 'Отмена',
    type: 'warning',
    onConfirm: null,
    onCancel: null
  });

  const confirm = (options) => {
    return new Promise((resolve) => {
      let resolved = false;
      
      const confirmHandler = () => {
        if (!resolved) {
          resolved = true;
          setModalState(prev => ({ ...prev, isOpen: false, onConfirm: null, onCancel: null }));
          resolve(true);
        }
      };
      
      const cancelHandler = () => {
        if (!resolved) {
          resolved = true;
          setModalState(prev => ({ ...prev, isOpen: false, onConfirm: null, onCancel: null }));
          resolve(false);
        }
      };
      
      setModalState({
        isOpen: true,
        title: options.title || 'Подтверждение',
        message: options.message || 'Вы уверены?',
        confirmText: options.confirmText || 'Да',
        cancelText: options.cancelText || 'Отмена',
        type: options.type || 'warning',
        onConfirm: confirmHandler,
        onCancel: cancelHandler
      });
    });
  };

  const handleConfirm = () => {
    if (modalState.onConfirm) {
      modalState.onConfirm();
    }
  };

  const handleCancel = () => {
    if (modalState.onCancel) {
      modalState.onCancel();
    }
  };

  const ConfirmModalComponent = () => (
    <ConfirmModal
      isOpen={modalState.isOpen}
      onClose={handleCancel}
      onConfirm={handleConfirm}
      title={modalState.title}
      message={modalState.message}
      confirmText={modalState.confirmText}
      cancelText={modalState.cancelText}
      type={modalState.type}
    />
  );

  return { confirm, ConfirmModalComponent };
};

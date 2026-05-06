import React, { useState, useEffect } from 'react';

const Toast = ({ message, type = 'info', duration = 5000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Анимация появления
    setIsAnimating(true);
    
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(), 1000); // Даем время для анимации исчезновения
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-gradient-to-r from-green-100 to-emerald-100',
          border: 'border-l-4 border-green-500',
          text: 'text-green-800',
          icon: 'text-green-600',
          shadow: 'shadow-green-200'
        };
      case 'error':
        return {
          bg: 'bg-gradient-to-r from-red-100 to-rose-100',
          border: 'border-l-4 border-red-500',
          text: 'text-red-800',
          icon: 'text-red-600',
          shadow: 'shadow-red-200'
        };
      case 'warning':
        return {
          bg: 'bg-gradient-to-r from-yellow-100 to-amber-100',
          border: 'border-l-4 border-yellow-500',
          text: 'text-yellow-800',
          icon: 'text-yellow-600',
          shadow: 'shadow-yellow-200'
        };
      case 'info':
      default:
        return {
          bg: 'bg-gradient-to-r from-blue-100 to-indigo-100',
          border: 'border-l-4 border-blue-500',
          text: 'text-blue-800',
          icon: 'text-blue-600',
          shadow: 'shadow-blue-200'
        };
    }
  };

  const styles = getStyles();

  return (
    <div
      className={`fixed top-4 right-4 z-50 transform transition-all duration-1000 ease-out ${
        isVisible 
          ? 'translate-x-0 opacity-100 scale-100' 
          : 'translate-x-full opacity-0 scale-95'
      } ${isAnimating ? 'animate-slide-in' : ''} ${!isVisible ? 'animate-fade-out' : ''}`}
      style={{
        animation: isAnimating ? 'slideInRight 0.6s ease-out' : undefined
      }}
    >
      <div className={`
        ${styles.bg} ${styles.border} ${styles.shadow}
        px-3 py-2 rounded-md shadow-lg flex items-center space-x-2 
        min-w-48 max-w-64 backdrop-blur-sm
        hover:shadow-xl transition-shadow duration-300
        border border-opacity-30
      `}>
        <span className={`text-sm ${styles.icon} animate-bounce`} style={{ animationDuration: '2s' }}>
          {getIcon()}
        </span>
        <span className={`flex-1 font-medium text-xs ${styles.text}`}>{message}</span>
      </div>
    </div>
  );
};

export default Toast;

import React from 'react';
import { Link } from 'react-router-dom';

const AccessDenied = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <p className="text-2xl">⚠️</p>
            </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Доступ запрещен
          </h1>
          <p className="text-gray-600 mb-6">
            У вас нет прав для доступа к этой странице. 
            Эта функция доступна только администраторам.
          </p>
          <div className="space-y-3">
            <Link
              to="/"
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors inline-block"
            >
              Вернуться к каталогу
            </Link>
            <Link
              to="/profile"
              className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors inline-block"
            >
              Мой профиль
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;

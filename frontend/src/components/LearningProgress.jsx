import React from 'react';
import { motion } from 'framer-motion';
import { FaBookOpen, FaGraduationCap, FaBullseye, FaClock, FaChartLine } from 'react-icons/fa';

const ProgressCard = ({ title, value, max, icon: Icon, color, description }) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  
  return (
    <motion.div 
      className="bg-white rounded-xl shadow-lg p-6"
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="text-white text-xl" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">из {max}</div>
        </div>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-3">
        <motion.div 
          className={`h-3 rounded-full ${color.replace('bg-', 'bg-gradient-to-r from-').replace('-600', '-500 to-').replace('-600', '-600')}`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percentage, 100)}%` }}
          transition={{ duration: 1, delay: 0.5 }}
        />
      </div>
      
      <div className="mt-2 text-sm text-gray-600">
        {percentage.toFixed(1)}% выполнено
      </div>
    </motion.div>
  );
};

const LearningProgress = ({ learnedCards, completedTests, totalCards, totalTests }) => {
  const totalAttempts = completedTests.reduce((sum, test) => sum + (test.attempts_count || 1), 0);
  
  const progressItems = [
    {
      title: 'Карточки',
      value: learnedCards,
      max: totalCards || 20, // Примерное количество карточек
      icon: FaBookOpen,
      color: 'bg-blue-600',
      description: 'Изученные карточки меню'
    },
    {
      title: 'Тесты',
      value: completedTests.length,
      max: totalTests || 10, // Примерное количество тестов
      icon: FaGraduationCap,
      color: 'bg-green-600',
      description: 'Пройденные тесты'
    },
    {
      title: 'Попытки',
      value: totalAttempts,
      max: 50, // Целевое количество попыток
      icon: FaBullseye,
      color: 'bg-purple-600',
      description: 'Общее количество попыток'
    }
  ];

  const overallProgress = progressItems.reduce((sum, item) => sum + (item.value / item.max), 0) / progressItems.length * 100;

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Общий прогресс */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl shadow-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 flex items-center">
              <FaChartLine className="text-indigo-600 mr-3" />
              Общий прогресс обучения
            </h3>
            <p className="text-gray-600 mt-1">Ваш прогресс в изучении меню и тестах</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-indigo-600">
              {overallProgress.toFixed(0)}%
            </div>
            <div className="text-gray-600">общий прогресс</div>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-4">
          <motion.div 
            className="bg-gradient-to-r from-indigo-500 to-purple-600 h-4 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(overallProgress, 100)}%` }}
            transition={{ duration: 1.5, delay: 0.3 }}
          />
        </div>
      </div>

      {/* Детальный прогресс */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {progressItems.map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
          >
            <ProgressCard {...item} />
          </motion.div>
        ))}
      </div>

      {/* Мотивационные сообщения */}
      <motion.div 
        className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl shadow-lg p-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <div className="text-center">
          {overallProgress >= 80 ? (
            <>
              <div className="text-4xl mb-2">🏆</div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Отличная работа!</h4>
              <p className="text-gray-600">Вы почти достигли мастерства в изучении меню!</p>
            </>
          ) : overallProgress >= 50 ? (
            <>
              <div className="text-4xl mb-2">🚀</div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Хороший прогресс!</h4>
              <p className="text-gray-600">Продолжайте в том же духе!</p>
            </>
          ) : overallProgress >= 25 ? (
            <>
              <div className="text-4xl mb-2">💪</div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Продолжайте!</h4>
              <p className="text-gray-600">Вы на правильном пути к успеху!</p>
            </>
          ) : (
            <>
              <div className="text-4xl mb-2">🌟</div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Начните обучение!</h4>
              <p className="text-gray-600">Изучайте карточки и проходите тесты для улучшения навыков!</p>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LearningProgress;

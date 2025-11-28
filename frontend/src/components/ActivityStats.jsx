import React from 'react';
import { motion } from 'framer-motion';
import { FaCalendarAlt, FaClock, FaArrowUp, FaFire, FaEye, FaBrain } from 'react-icons/fa';

const ActivityCard = ({ title, value, icon: Icon, color, trend, description }) => {
  return (
    <motion.div 
      className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="text-white text-xl" />
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          {trend && (
            <div className={`text-sm flex items-center ${
              trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'
            }`}>
              <FaArrowUp className={`mr-1 ${trend < 0 ? 'rotate-180' : ''}`} />
              {Math.abs(trend)}%
            </div>
          )}
        </div>
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </motion.div>
  );
};

const ActivityStats = ({ learnedCards, completedTests, totalAttempts }) => {
  // Симулируем данные активности за последние дни
  const weeklyActivity = [
    { day: 'Пн', cards: Math.floor(Math.random() * 5), tests: Math.floor(Math.random() * 3) },
    { day: 'Вт', cards: Math.floor(Math.random() * 5), tests: Math.floor(Math.random() * 3) },
    { day: 'Ср', cards: Math.floor(Math.random() * 5), tests: Math.floor(Math.random() * 3) },
    { day: 'Чт', cards: Math.floor(Math.random() * 5), tests: Math.floor(Math.random() * 3) },
    { day: 'Пт', cards: Math.floor(Math.random() * 5), tests: Math.floor(Math.random() * 3) },
    { day: 'Сб', cards: Math.floor(Math.random() * 5), tests: Math.floor(Math.random() * 3) },
    { day: 'Вс', cards: Math.floor(Math.random() * 5), tests: Math.floor(Math.random() * 3) }
  ];

  const totalWeeklyCards = weeklyActivity.reduce((sum, day) => sum + day.cards, 0);
  const totalWeeklyTests = weeklyActivity.reduce((sum, day) => sum + day.tests, 0);

  const activityStats = [
    {
      title: 'Карточки за неделю',
      value: totalWeeklyCards,
      icon: FaEye,
      color: 'bg-blue-600',
      trend: 12,
      description: 'Изученные карточки за последние 7 дней'
    },
    {
      title: 'Тесты за неделю',
      value: totalWeeklyTests,
      icon: FaBrain,
      color: 'bg-green-600',
      trend: 8,
      description: 'Пройденные тесты за последние 7 дней'
    },
    {
      title: 'Среднее время',
      value: '12 мин',
      icon: FaClock,
      color: 'bg-purple-600',
      trend: -5,
      description: 'Среднее время на изучение карточки'
    },
    {
      title: 'Активность',
      value: '85%',
      icon: FaFire,
      color: 'bg-orange-600',
      trend: 15,
      description: 'Уровень активности в обучении'
    }
  ];

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <FaCalendarAlt className="text-blue-600 mr-3" />
          Статистика активности
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {activityStats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <ActivityCard {...stat} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* График активности по дням */}
      <motion.div 
        className="bg-white rounded-2xl shadow-xl p-8"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <FaArrowUp className="text-green-600 mr-3" />
          Активность по дням недели
        </h3>
        
        <div className="space-y-4">
          {weeklyActivity.map((day, index) => (
            <motion.div 
              key={day.day}
              className="flex items-center space-x-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
            >
              <div className="w-12 text-sm font-medium text-gray-600">{day.day}</div>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-16 text-xs text-gray-500">Карточки</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <motion.div 
                      className="bg-blue-500 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(day.cards / 5) * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.7 + index * 0.1 }}
                    />
                  </div>
                  <div className="w-8 text-xs text-gray-600">{day.cards}</div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="w-16 text-xs text-gray-500">Тесты</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <motion.div 
                      className="bg-green-500 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(day.tests / 3) * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.8 + index * 0.1 }}
                    />
                  </div>
                  <div className="w-8 text-xs text-gray-600">{day.tests}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ActivityStats;

import React from 'react';
import { motion } from 'framer-motion';
import { FaTrophy, FaMedal, FaAward, FaRocket, FaLightbulb, FaStar, FaFire, FaBrain, FaBookOpen } from 'react-icons/fa';

const AchievementCard = ({ achievement, unlocked, progress = 0 }) => {
  const IconComponent = achievement.icon;
  
  return (
    <motion.div
      className={`p-6 rounded-xl border-2 transition-all duration-300 ${
        unlocked 
          ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300 shadow-lg' 
          : 'bg-gray-50 border-gray-200'
      }`}
      whileHover={{ scale: 1.05 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center space-x-4">
        <div className={`p-3 rounded-full ${
          unlocked 
            ? 'bg-gradient-to-r from-yellow-500 to-orange-500' 
            : 'bg-gray-300'
        }`}>
          <IconComponent className={`text-2xl ${
            unlocked ? 'text-white' : 'text-gray-500'
          }`} />
        </div>
        <div className="flex-1">
          <h3 className={`font-semibold ${
            unlocked ? 'text-gray-900' : 'text-gray-500'
          }`}>
            {achievement.title}
          </h3>
          <p className={`text-sm ${
            unlocked ? 'text-gray-600' : 'text-gray-400'
          }`}>
            {achievement.description}
          </p>
          {!unlocked && progress > 0 && (
            <div className="mt-2">
              <div className="bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {progress}% выполнено
              </p>
            </div>
          )}
        </div>
        {unlocked && (
          <div className="text-yellow-500">
            <FaStar className="text-xl" />
          </div>
        )}
      </div>
    </motion.div>
  );
};

const AchievementsSection = ({ learnedCards, completedTests, totalAttempts }) => {
  const achievements = [
    {
      id: 'first_card',
      title: 'Первые шаги',
      description: 'Изучите первую карточку',
      icon: FaLightbulb,
      condition: learnedCards >= 1,
      progress: Math.min((learnedCards / 1) * 100, 100)
    },
    {
      id: 'card_master',
      title: 'Мастер карточек',
      description: 'Изучите 10 карточек',
      icon: FaBookOpen,
      condition: learnedCards >= 10,
      progress: Math.min((learnedCards / 10) * 100, 100)
    },
    {
      id: 'card_expert',
      title: 'Эксперт карточек',
      description: 'Изучите 20 карточек',
      icon: FaBrain,
      condition: learnedCards >= 20,
      progress: Math.min((learnedCards / 20) * 100, 100)
    },
    {
      id: 'first_test',
      title: 'Первое испытание',
      description: 'Пройдите первый тест',
      icon: FaRocket,
      condition: completedTests >= 1,
      progress: Math.min((completedTests / 1) * 100, 100)
    },
    {
      id: 'test_champion',
      title: 'Чемпион тестов',
      description: 'Пройдите 5 тестов',
      icon: FaTrophy,
      condition: completedTests >= 5,
      progress: Math.min((completedTests / 5) * 100, 100)
    },
    {
      id: 'persistent',
      title: 'Упорный',
      description: 'Сделайте 20 попыток',
      icon: FaFire,
      condition: totalAttempts >= 20,
      progress: Math.min((totalAttempts / 20) * 100, 100)
    },
    {
      id: 'perfect_score',
      title: 'Идеальный результат',
      description: 'Пройдите тест без ошибок',
      icon: FaMedal,
      condition: false, // Нужно проверить в данных тестов
      progress: 0
    },
    {
      id: 'dedication',
      title: 'Преданность делу',
      description: 'Изучите 15 карточек и пройдите 3 теста',
      icon: FaAward,
      condition: learnedCards >= 15 && completedTests >= 3,
      progress: Math.min(((learnedCards / 15) + (completedTests / 3)) * 50, 100)
    }
  ];

  const unlockedCount = achievements.filter(a => a.condition).length;

  return (
    <motion.div 
      className="bg-white rounded-2xl shadow-xl p-8"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
          <FaTrophy className="text-yellow-600 mr-3" />
          Достижения
        </h3>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">
            {unlockedCount}/{achievements.length}
          </div>
          <div className="text-sm text-gray-600">разблокировано</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {achievements.map((achievement, index) => (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <AchievementCard
              achievement={achievement}
              unlocked={achievement.condition}
              progress={achievement.progress}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default AchievementsSection;

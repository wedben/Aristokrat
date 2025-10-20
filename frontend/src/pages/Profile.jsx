import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../hooks/useConfirm';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const Profile = () => {
  const { showSuccess, showError } = useToast();
  const { confirm, ConfirmModalComponent } = useConfirm();
  const [user, setUser] = useState(null);
  const [waiters, setWaiters] = useState([]);
  const [selectedWaiter, setSelectedWaiter] = useState(null);
  const [waiterActivity, setWaiterActivity] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [cardViews, setCardViews] = useState([]);
  const [learnedCards, setLearnedCards] = useState([]);
  const [completedTests, setCompletedTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchUser = async () => {
      try {
        const response = await api.get('/auth/me');
        setUser(response.data);
        
        // Если админ, загружаем статистику официантов
        if (response.data.role === 'admin') {
          await fetchWaitersStats();
        } else {
          // Если официант, загружаем изученные карточки и пройденные тесты
          await Promise.all([fetchLearnedCards(), fetchCompletedTests()]);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const fetchWaitersStats = async () => {
    try {
      const response = await api.get('/admin/users');
      setWaiters(response.data);
    } catch (error) {
      console.error('Error fetching waiters:', error);
    }
  };

  const fetchLearnedCards = async () => {
    try {
      const response = await api.get('/menu/progress/me');
      setLearnedCards(response.data.filter(card => card.is_learned));
    } catch (error) {
      console.error('Error fetching learned cards:', error);
    }
  };

  const fetchCompletedTests = async () => {
    try {
      const response = await api.get('/tests/progress/me');
      setCompletedTests(response.data);
    } catch (error) {
      console.error('Error fetching completed tests:', error);
    }
  };

  const fetchWaiterDetails = async (userId) => {
    try {
      const [activityResponse, resultsResponse, viewsResponse] = await Promise.all([
        api.get(`/admin/users/${userId}/activity`),
        api.get(`/admin/users/${userId}/test-results`),
        api.get(`/admin/users/${userId}/card-views`)
      ]);
      
      setWaiterActivity(activityResponse.data);
      setTestResults(resultsResponse.data);
      setCardViews(viewsResponse.data);
    } catch (error) {
      console.error('Error fetching waiter details:', error);
    }
  };

  const handleToggleUser = async (userId) => {
    try {
      await api.patch(`/admin/users/${userId}`, 
        { is_active: !waiters.find(w => w.user_id === userId)?.is_active }
      );
      await fetchWaitersStats();
    } catch (error) {
      console.error('Error toggling user:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    const confirmed = await confirm({
      title: 'Удаление пользователя',
      message: 'Вы уверены, что хотите удалить этого пользователя? Это действие нельзя отменить.',
      confirmText: 'Удалить',
      cancelText: 'Отмена',
      type: 'danger'
    });

    if (confirmed) {
      try {
        await api.delete(`/admin/users/${userId}`);
        await fetchWaitersStats();
        showSuccess('Пользователь успешно удален');
      } catch (error) {
        console.error('Error deleting user:', error);
        showError('Ошибка при удалении пользователя');
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Группируем тесты по test_id, оставляя только лучший результат
  const groupedTests = completedTests.reduce((acc, test) => {
    const testId = test.test_id;
    // Обновляем, если нет записи или новый результат лучше (меньше ошибок или больше баллов при равных ошибках)
    const currentErrors = acc[testId] ? acc[testId].max_score - acc[testId].score : Infinity;
    const newErrors = test.max_score - test.score;

    if (!acc[testId] || newErrors < currentErrors || (newErrors === currentErrors && test.score > acc[testId].score)) {
      acc[testId] = test;
    }
    return acc;
  }, {});

  const uniqueTests = Object.values(groupedTests);

  // Данные для диаграмм
  const testStatusData = uniqueTests.reduce((acc, test) => {
    const errorsMade = test.max_score - test.score;
    let status;
    if (errorsMade === 0) {
      status = 'Пройден';
    } else if (errorsMade <= (test.test?.max_errors_allowed || 0)) {
      status = 'Пройден с ошибками';
    } else {
      status = 'Не пройден';
    }
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(testStatusData).map(([name, value], index) => ({
    name,
    value,
    color: index === 0 ? '#10B981' : index === 1 ? '#F59E0B' : '#EF4444'
  }));

  const attemptsData = uniqueTests.map(test => ({
    name: test.test?.title || `Тест #${test.test_id}`,
    attempts: test.attempts_count || 1,
    score: test.score,
    maxScore: test.max_score
  }));

  // Данные для общей диаграммы прогресса
  const progressData = [
    { name: 'Изученные карточки', value: learnedCards.length, color: '#3B82F6' },
    { name: 'Пройденные тесты', value: uniqueTests.length, color: '#10B981' }
  ];

  // Отладочная информация
  console.log('Profile Debug:', {
    learnedCards: learnedCards.length,
    uniqueTests: uniqueTests.length,
    completedTests: completedTests.length,
    progressData,
    pieData,
    attemptsData,
    completedTestsData: completedTests,
    uniqueTestsData: uniqueTests
  });

  const waiterStatsData = waiters.map(waiter => ({
    name: waiter.full_name.split(' ')[0], // Только имя
    cardViews: waiter.total_card_views,
    testsCompleted: waiter.total_tests_completed,
    testsPassed: waiter.total_tests_passed
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {user.role === 'admin' ? 'Панель администратора' : 'Мой профиль'}
              </h1>
              <p className="text-gray-600">
                {user.first_name} {user.last_name} ({user.email})
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                🏠 Главная
              </button>
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {user.role === 'admin' ? (
          <div className="space-y-6">
            {/* Навигация */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex space-x-4">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 py-2 rounded-md font-medium ${
                    activeTab === 'overview' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  📊 Обзор
                </button>
                <button
                  onClick={() => setActiveTab('employees')}
                  className={`px-4 py-2 rounded-md font-medium ${
                    activeTab === 'employees' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  👥 Сотрудники
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`px-4 py-2 rounded-md font-medium ${
                    activeTab === 'activity' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  📈 Активность
                </button>
              </div>
            </div>

            {/* Обзор */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Статистика сотрудников */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Статистика сотрудников</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{waiters.length}</div>
                      <div className="text-sm text-gray-600">Всего сотрудников</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {waiters.filter(w => w.is_active).length}
                      </div>
                      <div className="text-sm text-gray-600">Активных</div>
                    </div>
                  </div>
                  
                  {waiters.length > 0 && (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={waiterStatsData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="cardViews" fill="#3B82F6" name="Просмотры карточек" />
                          <Bar dataKey="testsCompleted" fill="#10B981" name="Завершенные тесты" />
                          <Bar dataKey="testsPassed" fill="#F59E0B" name="Пройденные тесты" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Активность по дням */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Активность сотрудников</h3>
                  {waiters.length > 0 ? (
                    <div className="space-y-3">
                      {waiters.slice(0, 5).map(waiter => (
                        <div key={waiter.user_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium text-gray-900">{waiter.full_name}</div>
                            <div className="text-sm text-gray-600">
                              {waiter.total_card_views} просмотров, {waiter.total_tests_completed} тестов
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-medium ${
                              waiter.is_active ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {waiter.is_active ? 'Активен' : 'Заблокирован'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {waiter.last_activity ? 
                                new Date(waiter.last_activity).toLocaleDateString('ru-RU') : 
                                'Нет данных'
                              }
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">Нет зарегистрированных сотрудников</p>
                  )}
                </div>
              </div>
            )}

            {/* Сотрудники */}
            {activeTab === 'employees' && (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Управление сотрудниками</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сотрудник</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Просмотры</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Тесты</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {waiters.map((waiter) => (
                        <tr key={waiter.user_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{waiter.full_name}</div>
                              <div className="text-sm text-gray-500">{waiter.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              waiter.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {waiter.is_active ? 'Активен' : 'Заблокирован'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {waiter.total_card_views}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {waiter.total_tests_passed}/{waiter.total_tests_completed}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedWaiter(waiter);
                                  fetchWaiterDetails(waiter.user_id);
                                  setActiveTab('activity');
                                }}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Детали
                              </button>
                              <button
                                onClick={() => handleToggleUser(waiter.user_id)}
                                className={`${
                                  waiter.is_active 
                                    ? 'text-yellow-600 hover:text-yellow-900' 
                                    : 'text-green-600 hover:text-green-900'
                                }`}
                              >
                                {waiter.is_active ? 'Заблокировать' : 'Разблокировать'}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(waiter.user_id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Удалить
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Активность */}
            {activeTab === 'activity' && selectedWaiter && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Детальная активность: {selectedWaiter.full_name}
                  </h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Результаты тестов */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Результаты тестов</h4>
                      <div className="space-y-2">
                        {testResults.slice(0, 5).map((result) => (
                          <div key={result.id} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Тест #{result.test_id}</span>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                result.is_passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {result.is_passed ? 'Пройден' : 'Не пройден'}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {result.score}/{result.max_score} ({result.attempts_count || 1} попыток)
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Просмотры карточек */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Просмотры карточек</h4>
                      <div className="space-y-2">
                        {cardViews.slice(0, 5).map((view) => (
                          <div key={view.id} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Карточка #{view.card_id}</span>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                view.learned ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {view.learned ? 'Изучена' : 'Просмотрена'}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {view.viewed_count} раз
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Профиль официанта
          <div className="space-y-6">
            {/* Компактная статистика */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">{learnedCards.length}</div>
                  <div className="text-sm text-gray-600">Изученных карточек</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">{uniqueTests.length}</div>
                  <div className="text-sm text-gray-600">Пройденных тестов</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600">
                    {completedTests.reduce((sum, test) => sum + (test.attempts_count || 1), 0)}
                  </div>
                  <div className="text-sm text-gray-600">Всего попыток</div>
                </div>
              </div>
            </div>

            {/* Диаграммы */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Общий прогресс */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Общий прогресс</h3>
                <div className="h-64">
                  {progressData.some(item => item.value > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={progressData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {progressData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <div className="text-4xl mb-2">📊</div>
                        <p>Нет данных для отображения</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Статус тестов */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Статус тестов</h3>
                <div className="h-64">
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <div className="text-4xl mb-2">📈</div>
                        <p>Нет пройденных тестов</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Попытки по тестам */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Попытки по тестам</h3>
              <div className="h-64">
                {attemptsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={attemptsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="attempts" fill="#8B5CF6" name="Попытки" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <div className="text-4xl mb-2">📊</div>
                      <p>Нет данных о попытках</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Детальная таблица тестов */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Результаты тестов</h3>
              </div>
              {uniqueTests.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Название теста</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Описание</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Результат</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Попытки</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {uniqueTests.map((test) => {
                        const errorsMade = test.max_score - test.score;
                        let statusColor, statusText;
                        if (errorsMade === 0) {
                          statusColor = 'bg-green-100 text-green-800';
                          statusText = 'Пройден';
                        } else if (errorsMade <= (test.test?.max_errors_allowed || 0)) {
                          statusColor = 'bg-yellow-100 text-yellow-800';
                          statusText = 'Пройден с ошибками';
                        } else {
                          statusColor = 'bg-red-100 text-red-800';
                          statusText = 'Не пройден';
                        }

                        return (
                          <tr key={test.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {test.test?.title || `Тест #${test.test_id}`}
                              </div>
                              <div className="text-sm text-gray-500">
                                {test.score}/{test.max_score} баллов
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 max-w-xs">
                                {test.test?.description || 'Описание отсутствует'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColor}`}>
                                {statusText}
                              </span>
                              {test.test?.max_errors_allowed > 0 && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Допустимо ошибок: {test.test.max_errors_allowed}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {test.attempts_count || 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {test.completed_at ? 
                                new Date(test.completed_at).toLocaleDateString('ru-RU') : 
                                'Нет данных'
                              }
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-6 py-8 text-center text-gray-500">
                  <div className="text-4xl mb-2">📝</div>
                  <p>Нет пройденных тестов</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <ConfirmModalComponent />
    </div>
  );
};

export default Profile;
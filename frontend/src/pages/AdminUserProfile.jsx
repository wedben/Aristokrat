import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useToast } from "../contexts/ToastContext";
import { useConfirm } from "../hooks/useConfirm";
import {
  FaUser, FaBookOpen, FaGraduationCap, FaChartBar,
  FaHome, FaSignOutAlt, FaMedal, FaTrophy, FaAward,
  FaRocket, FaLightbulb, FaCalendarAlt, FaTimes, FaBan, FaCheck, FaTrash
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../styles/calendar.css';

const AdminUserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const { confirm, ConfirmModalComponent } = useConfirm();

  const [user, setUser] = useState(null);
  const [cardViews, setCardViews] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [activity, setActivity] = useState([]);
  const [allNewCards, setAllNewCards] = useState([]);
  const [allTests, setAllTests] = useState([]);
  const [newLearnedCards, setNewLearnedCards] = useState([]);
  const [allLearnedCards, setAllLearnedCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTestsModal, setShowTestsModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showCardsModal, setShowCardsModal] = useState(false);
  const [showDayActivityModal, setShowDayActivityModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDayActivity, setSelectedDayActivity] = useState([]);
  const [activityPercentage, setActivityPercentage] = useState(0);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [activityData, setActivityData] = useState(new Map());
  const [cardLearnedDates, setCardLearnedDates] = useState(new Set());

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Получаем список пользователей, чтобы найти нужного
        const usersRes = await api.get("/admin/users");
        const foundUser = usersRes.data.find(u => u.user_id === parseInt(userId));
        
        if (!foundUser) {
          showError("Пользователь не найден");
          navigate("/admin/users");
          return;
        }

        setUser(foundUser);

        // Получаем данные пользователя
        const [cardViewsRes, testResultsRes, activityRes, newCardsRes, testsRes, learnedCardsRes] = await Promise.all([
          api.get(`/admin/users/${userId}/card-views`),
          api.get(`/admin/users/${userId}/test-results`),
          api.get(`/admin/users/${userId}/activity`),
          api.get("/cards"),
          api.get("/tests/"),
          api.get(`/admin/users/${userId}/learned-cards`).catch(() => ({ data: { new_cards: [] } })),
        ]);

        setCardViews(cardViewsRes.data);
        setTestResults(testResultsRes.data);
        setActivity(activityRes.data);
        setAllNewCards(newCardsRes.data);
        setAllTests(testsRes.data);

        // Изученные карточки
        const learnedData = learnedCardsRes.data || { new_cards: [] };
        const newLearnedCards = learnedData.new_cards.map(c => ({ ...c, isOld: false }));
        setNewLearnedCards(newLearnedCards);
        
        // Объединяем все изученные карточки
        const allLearned = [...newLearnedCards];
        setAllLearnedCards(allLearned);

        // Получаем даты, когда пользователь изучил карточки
        const learnedDatesSet = new Set();
        
        // Из NewCardProgress (новые карточки)
        const newProgress = await api.get(`/admin/users/${userId}/new-card-progress`).catch(() => ({ data: [] }));
        newProgress.data.forEach((p) => {
          if (p.is_learned && p.learned_at) {
            const date = new Date(p.learned_at);
            const dateKey = date.toDateString();
            learnedDatesSet.add(dateKey);
          }
        });
        
        setCardLearnedDates(learnedDatesSet);

        // Генерируем данные активности на основе реальных данных
        const activityMap = new Map();
        activityRes.data.forEach((act) => {
          const date = new Date(act.created_at);
          const dateKey = date.toDateString();
          
          // Если уже есть активность в этот день, увеличиваем интенсивность
          if (activityMap.has(dateKey)) {
            const existing = activityMap.get(dateKey);
            existing.count += 1;
            // Интенсивность: 1 = низкая (1-2 действия), 2 = средняя (3-5 действий), 3 = высокая (6+ действий)
            existing.intensity = existing.count <= 2 ? 1 : existing.count <= 5 ? 2 : 3;
          } else {
            activityMap.set(dateKey, {
              date: date,
              active: true,
              intensity: 1,
              count: 1
            });
          }
        });
        setActivityData(activityMap);

        // Вычисляем процент активности
        // Используем первую активность как дату регистрации
        const sortedActivities = [...activityRes.data].sort((a, b) => 
          new Date(a.created_at) - new Date(b.created_at)
        );
        const registrationDate = sortedActivities.length > 0 
          ? new Date(sortedActivities[0].created_at)
          : new Date(); // Fallback
        
        const today = new Date();
        // Устанавливаем время на начало дня для корректного расчета
        today.setHours(0, 0, 0, 0);
        const regDate = new Date(registrationDate);
        regDate.setHours(0, 0, 0, 0);
        
        const daysSinceRegistration = Math.max(1, Math.ceil((today - regDate) / (1000 * 60 * 60 * 24)));
        const activeDays = learnedDatesSet.size;
        // Процент активности = (активные дни / дни с регистрации) * 100
        const percentage = daysSinceRegistration > 0 
          ? Math.round((activeDays / daysSinceRegistration) * 100)
          : 0;
        setActivityPercentage(percentage);
      } catch (err) {
        console.error(err);
        showError("Ошибка загрузки профиля пользователя");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, navigate, showError]);

  const handleToggleActive = async () => {
    const confirmed = await confirm({
      title: user.is_active 
        ? "Заблокировать пользователя?" 
        : "Разблокировать пользователя?",
      message: user.is_active
        ? "Пользователь не сможет войти в систему"
        : "Пользователь сможет войти в систему"
    });
    
    if (!confirmed) return;

    try {
      setToggleLoading(true);
      const response = await api.patch(`/admin/users/${userId}/toggle-active`);
      setUser(prev => ({ ...prev, is_active: response.data.is_active }));
      showSuccess(
        response.data.is_active 
          ? "Пользователь разблокирован" 
          : "Пользователь заблокирован"
      );
    } catch (err) {
      console.error(err);
      showError("Ошибка при изменении статуса пользователя");
    } finally {
      setToggleLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    // Проверяем, что пользователь заблокирован
    if (user.is_active) {
      showError("Сначала нужно заблокировать пользователя перед удалением");
      return;
    }

    const confirmed = await confirm({
      title: "Удалить пользователя?",
      message: "Это действие необратимо. Все данные пользователя будут удалены безвозвратно.",
      confirmText: "Удалить",
      cancelText: "Отмена",
      type: "danger"
    });
    
    if (!confirmed) return;

    try {
      setDeleteLoading(true);
      await api.delete(`/admin/users/${userId}`);
      showSuccess("Пользователь успешно удален");
      // Перенаправляем на страницу списка пользователей
      setTimeout(() => {
        navigate("/admin/users");
      }, 1500);
    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.detail || "Ошибка при удалении пользователя";
      showError(errorMessage);
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Нет данных';
    // JavaScript автоматически конвертирует UTC в локальное время при создании Date объекта
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  };

  const handleDayClick = (value) => {
    const dateKey = value.toDateString();
    const dayActivities = activity.filter(act => {
      const actDate = new Date(act.created_at);
      return actDate.toDateString() === dateKey;
    });
    
    // Сортируем по времени (от старых к новым)
    dayActivities.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    
    setSelectedDate(value);
    setSelectedDayActivity(dayActivities);
    setShowDayActivityModal(true);
  };

  const getTestStatusBadge = (testResult) => {
    const errorsMade = testResult.max_score - testResult.score;
    if (errorsMade === 0) {
      return <span className="badge bg-success">✅ Пройден</span>;
    } else {
      // Нужно получить max_errors_allowed из теста
      const test = allTests.find(t => t.id === testResult.test_id);
      const maxErrorsAllowed = test?.max_errors_allowed || 0;
      if (errorsMade <= maxErrorsAllowed) {
        return <span className="badge bg-warning">⚠️ Пройден с ошибками</span>;
      } else {
        return <span className="badge bg-danger">❌ Не пройден</span>;
      }
    }
  };

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Загрузка...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-danger" role="alert">
          Пользователь не найден
        </div>
        <Link to="/admin/users" className="btn btn-primary">
          ← Назад к списку пользователей
        </Link>
      </div>
    );
  }

  // Подсчитываем изученные карточки для статистики
  const learnedCardsCount = allLearnedCards.length;

  return (
    <div className="container-fluid py-4">
      <ConfirmModalComponent />
      
      {/* Заголовок */}
      <div className="row mb-3 mb-md-4">
        <div className="col-12">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
            <div className="flex-grow-1">
              <Link to="/admin/users" className="btn btn-outline-secondary btn-sm mb-2 mb-md-3 w-100 w-md-auto">
                ← Назад к списку пользователей
              </Link>
              <h1 className="display-5 fw-bold text-primary mb-2">
                👤 Профиль пользователя
              </h1>
              <p className="lead text-muted d-none d-md-block">{user.full_name}</p>
              <p className="text-muted d-md-none">{user.full_name}</p>
            </div>
            <div className="d-flex flex-column flex-md-row gap-2 w-100 w-md-auto">
              <button
                className={`btn ${user.is_active ? 'btn-danger' : 'btn-success'} ${toggleLoading ? 'disabled' : ''} w-100 w-md-auto`}
                onClick={handleToggleActive}
                disabled={toggleLoading}
              >
                {toggleLoading ? (
                  <span className="spinner-border spinner-border-sm me-2" />
                ) : user.is_active ? (
                  <><FaBan className="me-2" /><span className="d-none d-md-inline">Заблокировать</span><span className="d-md-none">Заблокировать</span></>
                ) : (
                  <><FaCheck className="me-2" /><span className="d-none d-md-inline">Разблокировать</span><span className="d-md-none">Разблокировать</span></>
                )}
              </button>
              {!user.is_active && (
                <button
                  className={`btn btn-danger ${deleteLoading ? 'disabled' : ''} w-100 w-md-auto`}
                  onClick={handleDeleteUser}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? (
                    <span className="spinner-border spinner-border-sm me-2" />
                  ) : (
                    <><FaTrash className="me-2" />Удалить</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Информация о пользователе */}
      <div className="row mb-3 mb-md-4">
        <div className="col-12 col-md-6 mb-3 mb-md-0">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="card-title fw-bold mb-3">📧 Контактная информация</h5>
              <div className="mb-2">
                <strong>Имя:</strong> {user.full_name}
              </div>
              <div className="mb-2">
                <strong>Email:</strong> {user.email}
              </div>
              {user.phone && (
                <div className="mb-2">
                  <strong>Телефон:</strong> {user.phone}
                </div>
              )}
              {user.address && (
                <div className="mb-2">
                  <strong>Адрес:</strong> {user.address}
                </div>
              )}
              <div className="mb-2">
                <strong>Статус:</strong>{' '}
                {(() => {
                  let statusText = '';
                  let statusClass = '';
                  if (user.is_active) {
                    statusText = '✅ Активен';
                    statusClass = 'bg-success';
                  } else if (user.is_pending_verification) {
                    statusText = '⏳ Ожидает верификации';
                    statusClass = 'bg-warning text-dark';
                  } else {
                    statusText = '❌ Заблокирован';
                    statusClass = 'bg-danger';
                  }
                  return (
                    <span className={`badge ${statusClass}`}>
                      {statusText}
                    </span>
                  );
                })()}
              </div>
              <div className="mb-2">
                <strong>Последняя активность:</strong> {formatDate(user.last_activity)}
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="card-title fw-bold mb-3">📊 Статистика</h5>
              <div className="row text-center">
                <div className="col-6">
                  <div className="h4 mb-1 text-primary fw-bold">{learnedCardsCount}</div>
                  <div className="small text-muted">Карточек изучено</div>
                </div>
                <div className="col-6">
                  <div className="h4 mb-1 text-info fw-bold">{user.total_tests_completed}</div>
                  <div className="small text-muted">Тестов завершено</div>
                  {user.total_tests_passed > 0 && (
                    <div className="small text-success mt-1">
                      (Пройдено: {user.total_tests_passed})
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Статистические карточки */}
      <div className="row mb-3 mb-md-4">
        <div className="col-12 col-md-4 mb-3 mb-md-0">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="card border-0 shadow-sm h-100 cursor-pointer"
            onClick={() => setShowActivityModal(true)}
            style={{ cursor: 'pointer' }}
          >
            <div className="card-body text-center">
              <div className="mb-3">
                <div className="mx-auto d-flex align-items-center justify-content-center rounded-circle bg-warning bg-opacity-10" style={{ width: '60px', height: '60px' }}>
                  <FaCalendarAlt className="fs-2 text-warning" />
                </div>
              </div>
              <h3 className="text-warning mb-0 fw-bold">{activityPercentage}%</h3>
              <p className="text-muted mb-0">Активность</p>
            </div>
          </motion.div>
        </div>
        <div className="col-12 col-md-4 mb-3 mb-md-0">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="card border-0 shadow-sm h-100 cursor-pointer"
            onClick={() => setShowTestsModal(true)}
            style={{ cursor: 'pointer' }}
          >
            <div className="card-body text-center">
              <div className="mb-3">
                <div className="mx-auto d-flex align-items-center justify-content-center rounded-circle bg-success bg-opacity-10" style={{ width: '60px', height: '60px' }}>
                  <FaGraduationCap className="fs-2 text-success" />
                </div>
              </div>
              <h3 className="text-success mb-0 fw-bold">{user.total_tests_completed}</h3>
              <p className="text-muted mb-0">Тестов завершено</p>
            </div>
          </motion.div>
        </div>
        <div className="col-12 col-md-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="card border-0 shadow-sm h-100 cursor-pointer"
            onClick={() => setShowCardsModal(true)}
            style={{ cursor: 'pointer' }}
          >
            <div className="card-body text-center">
              <div className="mb-3">
                <div className="mx-auto d-flex align-items-center justify-content-center rounded-circle bg-info bg-opacity-10" style={{ width: '60px', height: '60px' }}>
                  <FaBookOpen className="fs-2 text-info" />
                </div>
              </div>
              <h3 className="text-info mb-0 fw-bold">{learnedCardsCount}</h3>
              <p className="text-muted mb-0">Карточек изучено</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Модальное окно с тестами */}
      <AnimatePresence>
        {showTestsModal && (
          <motion.div
            className="modal fade show d-block"
            tabIndex="-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowTestsModal(false)}
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
          >
            <motion.div
              className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content">
                <div className="modal-header bg-success text-white">
                  <h5 className="modal-title">
                    <FaGraduationCap className="me-2" />
                    Результаты тестов ({testResults.length})
                  </h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowTestsModal(false)} />
                </div>
                <div className="modal-body max-h-400 overflow-auto">
                  {testResults.length === 0 ? (
                    <div className="text-center text-muted py-4">
                      <FaGraduationCap className="fs-1 mb-3 text-muted" />
                      <p>Пользователь еще не проходил тесты</p>
                    </div>
                  ) : (
                    <div className="row">
                      {testResults.map((result) => {
                        const test = allTests.find(t => t.id === result.test_id);
                        return (
                          <div key={result.id} className="col-md-6 mb-3">
                            <div className="card border-0 shadow-sm">
                              <div className="card-body">
                                <h6 className="card-title">{test?.title || 'Неизвестный тест'}</h6>
                                <div className="mb-2">
                                  <small className="text-muted">
                                    Завершен: {formatDate(result.completed_at)}
                                  </small>
                                </div>
                                <div className="mb-2">
                                  Результат: {result.score} / {result.max_score}
                                </div>
                                <div className="mb-2">
                                  {getTestStatusBadge(result)}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Модальное окно с календарем активности */}
      <AnimatePresence>
        {showActivityModal && (
          <motion.div
            className="modal fade show d-block"
            tabIndex="-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowActivityModal(false)}
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
          >
            <motion.div
              className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content border-0">
                <div className="modal-header bg-warning text-white">
                  <h5 className="modal-title">
                    <FaCalendarAlt className="me-2" />
                    Календарь активности
                  </h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowActivityModal(false)} />
                </div>
                <div className="modal-body">
                  <div className="d-flex justify-content-center mb-4">
                    <Calendar
                      className="react-calendar-custom"
                      onClickDay={handleDayClick}
                      tileClassName={({ date, view }) => {
                        const dateKey = date.toDateString();
                        const isToday = dateKey === new Date().toDateString();
                        const activity = activityData.get(dateKey);
                        const hasLearnedCard = cardLearnedDates.has(dateKey);
                        
                        if (isToday) return 'react-calendar__tile--today';
                        // Если пользователь изучил карточку в этот день, окрашиваем зеленым
                        if (hasLearnedCard) return 'react-calendar__tile--learned';
                        if (activity && activity.active) return 'react-calendar__tile--active';
                        return '';
                      }}
                      tileContent={({ date, view }) => {
                        if (view === 'month') {
                          const dateKey = date.toDateString();
                          const activity = activityData.get(dateKey);
                          const hasLearnedCard = cardLearnedDates.has(dateKey);
                          const isToday = dateKey === new Date().toDateString();
                          
                          // Если карточка изучена, показываем зеленую точку
                          if (hasLearnedCard && !isToday) {
                            return <div className="activity-dot intensity-learned"></div>;
                          }
                          if (activity && activity.active && !isToday && !hasLearnedCard) {
                            return <div className={`activity-dot intensity-${activity.intensity}`}></div>;
                          }
                        }
                        return null;
                      }}
                      formatShortWeekday={(locale, date) => {
                        const weekdays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
                        return weekdays[date.getDay()];
                      }}
                      locale="ru-RU"
                    />
                  </div>
                  <div className="d-flex justify-content-center gap-3 text-sm mb-3">
                    <div className="d-flex align-items-center">
                      <div className="w-3 h-3 bg-success rounded-circle me-2"></div>
                      <span className="text-muted">Изучена карточка</span>
                    </div>
                  </div>
                  <div className="d-flex justify-content-center gap-3 text-sm">
                    <div className="d-flex align-items-center">
                      <div className="w-2 h-2 bg-success rounded-circle me-2"></div>
                      <span className="text-muted">Низкая</span>
                    </div>
                    <div className="d-flex align-items-center">
                      <div className="w-3 h-3 bg-success rounded-circle me-2"></div>
                      <span className="text-muted">Средняя</span>
                    </div>
                    <div className="d-flex align-items-center">
                      <div className="w-4 h-4 bg-success rounded-circle me-2"></div>
                      <span className="text-muted">Высокая</span>
                    </div>
                    <div className="d-flex align-items-center">
                      <div className="w-3 h-3 bg-light rounded-circle me-2"></div>
                      <span className="text-muted">Нет активности</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Модальное окно с изученными карточками */}
      <AnimatePresence>
        {showCardsModal && (
          <motion.div
            className="modal fade show d-block"
            tabIndex="-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCardsModal(false)}
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
          >
            <motion.div
              className="modal-dialog modal-dialog-centered modal-dialog-scrollable"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '900px', maxHeight: '80vh', margin: '10px auto' }}
            >
              <div className="modal-content border-0 d-flex flex-column" style={{ maxHeight: '80vh' }}>
                <div className="modal-header bg-primary text-white">
                  <h5 className="modal-title">
                    <FaBookOpen className="me-2" />
                    Изученные карточки ({allLearnedCards.length})
                  </h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowCardsModal(false)} />
                </div>
                <div className="modal-body overflow-auto flex-grow-1" style={{ maxHeight: 'calc(80vh - 120px)' }}>
                  {allLearnedCards.length === 0 ? (
                    <div className="text-center text-muted py-4">
                      <FaBookOpen className="fs-1 mb-3 text-muted" />
                      <p>Пользователь еще не изучил ни одной карточки</p>
                    </div>
                  ) : (
                    <div className="row g-2 g-md-3">
                      {allLearnedCards.map((card) => (
                        <div key={`new-${card.id}`} className="col-6 col-sm-4 col-md-3 mb-2 mb-md-3">
                          <div className="card border-0 shadow-sm h-100" style={{ aspectRatio: '1/1.2', minHeight: '140px' }}>
                            <div className="card-body p-3 d-flex flex-column justify-content-between">
                              <h6 className="card-title mb-2" style={{ fontSize: '0.95rem', lineHeight: '1.3', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                                {card.name || card.preview_title || card.detailed_title}
                              </h6>
                              <span className="badge bg-success align-self-start" style={{ fontSize: '0.75rem' }}>Изучено</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Модальное окно с активностью дня */}
      <AnimatePresence>
        {showDayActivityModal && (
          <motion.div
            className="modal fade show d-block"
            tabIndex="-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDayActivityModal(false)}
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
          >
            <motion.div
              className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content border-0">
                <div className="modal-header bg-primary text-white">
                  <h5 className="modal-title">
                    <FaCalendarAlt className="me-2" />
                    Активность за {selectedDate && selectedDate.toLocaleDateString('ru-RU', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowDayActivityModal(false)} />
                </div>
                <div className="modal-body">
                  {selectedDayActivity.length === 0 ? (
                    <div className="text-center text-muted py-4">
                      <FaCalendarAlt className="fs-1 mb-3 text-muted" />
                      <p>В этот день не было активности</p>
                    </div>
                  ) : (
                    <div className="list-group">
                      {selectedDayActivity.map((act, index) => (
                        <div key={act.id || index} className="list-group-item border-0 border-bottom">
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <h6 className="mb-1">
                                {act.activity_type === 'card_view' && '👁️ Просмотр карточки'}
                                {act.activity_type === 'test_start' && '📝 Начало теста'}
                                {act.activity_type === 'test_complete' && '✅ Завершение теста'}
                                {act.activity_type === 'new_card_learned' && '🎓 Карточка изучена'}
                                {!['card_view', 'test_start', 'test_complete', 'new_card_learned'].includes(act.activity_type) && '📌 Действие'}
                              </h6>
                              {act.details && (
                                <p className="mb-1 text-muted small">{act.details}</p>
                              )}
                            </div>
                            <div className="text-end">
                              <small className="text-muted">
                                {formatTime(act.created_at)}
                              </small>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModalComponent />
    </div>
  );
};

export default AdminUserProfile;



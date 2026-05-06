import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useToast } from "../contexts/ToastContext";
import { useConfirm } from "../hooks/useConfirm";
import {
  FaUser, FaBookOpen, FaGraduationCap,
  FaHome, FaSignOutAlt, FaMedal, FaTrophy, FaAward,
  FaRocket, FaLightbulb
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import "bootstrap/dist/css/bootstrap.min.css";

const Profile = () => {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const { confirm, ConfirmModalComponent } = useConfirm();

  const [user, setUser] = useState(null);
  const [allLearnedCards, setAllLearnedCards] = useState([]);
  const [completedTests, setCompletedTests] = useState([]);
  const [allNewCards, setAllNewCards] = useState([]);
  const [allTests, setAllTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCardsModal, setShowCardsModal] = useState(false);
  const [showTestsModal, setShowTestsModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Получаем данные пользователя
        const userRes = await api.get("/auth/me");
        setUser(userRes.data);

        // Получаем все данные параллельно
        const [newCardsProgressRes, testsRes, allNewCardsRes, allTestsRes] = await Promise.all([
          api.get("/cards/progress/me").catch(() => ({ data: {} })),
          api.get("/tests/progress/me").catch(() => ({ data: [] })),
          api.get("/cards/?limit=1000").catch(() => ({ data: [] })), // Увеличиваем лимит для получения всех карточек
          api.get("/tests/").catch(() => ({ data: [] })),
        ]);

        // Обрабатываем изученные карточки
        const newCardsProgress = newCardsProgressRes.data || {};
        const newLearnedCardIds = Object.keys(newCardsProgress).filter(
          cardId => newCardsProgress[cardId]?.is_learned
        );
        
        const allNewCardsData = Array.isArray(allNewCardsRes.data) ? allNewCardsRes.data : [];
        const newLearnedCardsData = allNewCardsData.filter(card => 
          newLearnedCardIds.includes(String(card.id))
        );
        
        setAllLearnedCards(newLearnedCardsData);
        setAllNewCards(allNewCardsData);
        setCompletedTests(Array.isArray(testsRes.data) ? testsRes.data : []);
        setAllTests(Array.isArray(allTestsRes.data) ? allTestsRes.data : []);
      } catch (err) {
        console.error("Ошибка загрузки профиля:", err);
        showError("Ошибка загрузки профиля");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Слушаем событие обновления карточки
    const handleCardLearned = () => {
      fetchData();
    };
    
    window.addEventListener('cardLearned', handleCardLearned);
    
    return () => {
      window.removeEventListener('cardLearned', handleCardLearned);
    };
  }, [navigate, showError]);

  const handleLogout = async () => {
    const confirmed = await confirm({
      title: 'Выход из системы',
      message: 'Вы уверены, что хотите выйти?',
      confirmText: 'Выйти',
      cancelText: 'Отмена',
      type: 'warning'
    });
    if (confirmed) {
      localStorage.removeItem("token");
      showSuccess("Вы вышли из системы");
      navigate("/login");
    }
  };

  const getLevelInfo = () => {
    const total = (allLearnedCards?.length || 0) + (completedTests?.length || 0);
    if (total >= 20) return { title: "Эксперт", color: "text-primary", icon: <FaMedal /> };
    if (total >= 15) return { title: "Профессионал", color: "text-success", icon: <FaTrophy /> };
    if (total >= 10) return { title: "Опытный", color: "text-warning", icon: <FaAward /> };
    if (total >= 5) return { title: "Развивающийся", color: "text-info", icon: <FaRocket /> };
    return { title: "Новичок", color: "text-secondary", icon: <FaLightbulb /> };
  };

  const level = getLevelInfo();

  if (loading) {
    return (
      <div className="d-flex vh-100 justify-content-center align-items-center bg-white">
        <div className="spinner-border text-primary me-2" role="status" />
        <span>Загрузка профиля...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="d-flex vh-100 justify-content-center align-items-center bg-white">
        <div className="alert alert-warning">
          Не удалось загрузить данные пользователя
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media (min-width: 768px) {
          .profile-sidebar {
            width: 250px !important;
            min-width: 250px !important;
            max-width: 250px !important;
          }
        }
      `}</style>
      <div className="d-flex flex-column flex-md-row bg-white min-vh-100" style={{ overflowX: 'hidden' }}>
        {/* SIDEBAR */}
        <div className="bg-white shadow-sm d-flex flex-row flex-md-column p-3 profile-sidebar" style={{ width: "100%", minWidth: "100%", maxWidth: "100%", flexShrink: 0 }}>
          <div className="d-flex flex-row flex-md-column align-items-center align-items-md-start justify-content-between w-100 mb-0 mb-md-4">
            <div className="d-flex align-items-center">
              <FaUser className="text-primary fs-3 me-2" />
              <h5 className="m-0 fw-bold d-none d-md-block">Профиль</h5>
              <h6 className="m-0 fw-bold d-md-none">Профиль</h6>
            </div>
            <div className="d-flex d-md-none align-items-center gap-2">
              <span className="fw-semibold small">{user?.full_name || user?.username || 'Пользователь'}</span>
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || user?.username || 'User')}&background=0D6EFD&color=fff`}
                alt="avatar"
                className="rounded-circle"
                style={{ width: 32, height: 32 }}
              />
            </div>
          </div>

        <ul className="nav flex-row flex-md-column gap-2 w-100">
          <li className="nav-item">
            <Link to="/standards" className="nav-link text-dark d-flex align-items-center">
              <FaHome className="me-2" /> <span className="d-none d-md-inline">Назад</span>
            </Link>
          </li>
          <li className="nav-item">
            <button className="btn btn-outline-danger w-100 w-md-100 mt-0 mt-md-3" onClick={handleLogout}>
              <FaSignOutAlt className="me-2" /> <span className="d-none d-md-inline">Выйти</span>
              <span className="d-md-none">Выход</span>
            </button>
          </li>
        </ul>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-grow-1" style={{ minWidth: 0, overflowX: 'hidden' }}>
        {/* TOP BAR */}
        <nav className="navbar navbar-light bg-white shadow-sm px-3 px-md-4 py-2 py-md-3 d-none d-md-flex" style={{ flexShrink: 0 }}>
          <h4 className="fw-bold text-primary m-0">Личный кабинет официанта</h4>
          <div className="d-flex align-items-center gap-3">
            <span className="fw-semibold">{user?.full_name || user?.username || 'Пользователь'}</span>
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || user?.username || 'User')}&background=0D6EFD&color=fff`}
              alt="avatar"
              className="rounded-circle"
              style={{ width: 40, height: 40 }}
            />
          </div>
        </nav>

        {/* CONTENT BODY */}
        <div className="container-fluid py-3 py-md-4 px-3 px-md-4" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
          {/* LEVEL CARD */}
          <div className="card border-0 shadow-sm mb-3 mb-md-4">
            <div className="card-body d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
              <div className="d-flex align-items-center flex-grow-1" style={{ minWidth: 0 }}>
                <div className="bg-light p-2 p-md-3 rounded-circle me-2 me-md-3 fs-2 text-primary flex-shrink-0">
                  {level.icon}
                </div>
                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                  <h5 className="mb-1 mb-md-1">
                    Уровень:{" "}
                    <span className={`fw-bold ${level.color}`}>{level.title}</span>
                  </h5>
                  <small className="text-muted d-block d-md-inline" style={{ wordBreak: 'break-word' }}>
                    Карточки: {allLearnedCards.length} / {allNewCards.length} | Тесты: {completedTests.length} / {allTests.length}
                  </small>
                </div>
              </div>
              <div className="text-center text-md-end flex-shrink-0">
                <h2 className="fw-bold mb-0">{allLearnedCards.length + completedTests.length}</h2>
                <small className="text-muted">Общий прогресс</small>
              </div>
            </div>
          </div>

          {/* DASHBOARD CARDS */}
          <div className="row g-3 g-md-4">
            <div className="col-12 col-sm-6 col-lg-4">
              <div 
                className="card border-0 shadow-sm h-100 cursor-pointer"
                onClick={() => setShowCardsModal(true)}
                style={{ cursor: 'pointer' }}
              >
                <div className="card-body d-flex align-items-center justify-content-between p-3 p-md-4">
                  <div>
                    <h6 className="fw-bold mb-1 d-flex align-items-center">
                      <FaBookOpen className="me-2 text-primary" />
                      <span className="d-none d-sm-inline">Карточки</span>
                      <span className="d-inline d-sm-none">Карт.</span>
                    </h6>
                    <small className="text-muted">Изучено</small>
                  </div>
                  <h3 className="text-primary mb-0">{allLearnedCards.length}</h3>
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-lg-4">
              <div 
                className="card border-0 shadow-sm h-100 cursor-pointer"
                onClick={() => setShowTestsModal(true)}
                style={{ cursor: 'pointer' }}
              >
                <div className="card-body d-flex align-items-center justify-content-between p-3 p-md-4">
                  <div>
                    <h6 className="fw-bold mb-1 d-flex align-items-center">
                      <FaGraduationCap className="me-2 text-success" />
                      <span className="d-none d-sm-inline">Тесты</span>
                      <span className="d-inline d-sm-none">Тест.</span>
                    </h6>
                    <small className="text-muted">Пройдено</small>
                  </div>
                  <h3 className="text-success mb-0">{completedTests.length}</h3>
                </div>
              </div>
            </div>
          </div>

          {/* CARDS MODAL */}
          <AnimatePresence>
            {showCardsModal && (
              <motion.div
                className="modal fade show d-block bg-dark bg-opacity-50"
                onClick={() => setShowCardsModal(false)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="modal-dialog modal-dialog-centered modal-dialog-scrollable"
                  onClick={(e) => e.stopPropagation()}
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
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
                          <p>Вы еще не изучили ни одной карточки</p>
                        </div>
                      ) : (
                        <div className="row g-2 g-md-3">
                          {allLearnedCards.map((card) => (
                            <div key={`card-${card.id}`} className="col-6 col-sm-4 col-md-3 mb-2 mb-md-3">
                              <div className="card border-0 shadow-sm h-100" style={{ aspectRatio: '1/1.2', minHeight: '140px' }}>
                                <div className="card-body p-3 d-flex flex-column justify-content-between">
                                  <h6 className="card-title mb-2" style={{ fontSize: '0.95rem', lineHeight: '1.3', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                                    {card.name || card.preview_title || card.detailed_title || 'Карточка'}
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

          {/* TESTS MODAL */}
          <AnimatePresence>
            {showTestsModal && (
              <motion.div
                className="modal fade show d-block bg-dark bg-opacity-50"
                onClick={() => setShowTestsModal(false)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"
                  onClick={(e) => e.stopPropagation()}
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  style={{ maxWidth: '95vw', margin: '10px auto' }}
                >
                  <div className="modal-content border-0">
                    <div className="modal-header bg-success text-white">
                      <h5 className="modal-title">
                        <FaGraduationCap className="me-2" />
                        Пройденные тесты ({completedTests.length})
                      </h5>
                      <button type="button" className="btn-close btn-close-white" onClick={() => setShowTestsModal(false)} />
                    </div>
                    <div className="modal-body max-h-400 overflow-auto">
                      {completedTests.length === 0 ? (
                        <div className="text-center text-muted py-4">
                          <FaGraduationCap className="fs-1 mb-3 text-muted" />
                          <p>Вы еще не прошли ни одного теста</p>
                        </div>
                      ) : (
                        <div className="row">
                          {completedTests.map((testProgress) => {
                            const errorsMade = (testProgress.max_score || 0) - (testProgress.score || 0);
                            const maxErrorsAllowed = testProgress.test?.max_errors_allowed || 0;
                            
                            let badgeColor = 'bg-danger';
                            let statusText = 'Не пройден';
                            let statusIcon = '❌';
                            
                            if (errorsMade === 0) {
                              badgeColor = 'bg-success';
                              statusText = 'Пройден';
                              statusIcon = '✅';
                            } else if (errorsMade <= maxErrorsAllowed) {
                              badgeColor = 'bg-warning';
                              statusText = 'Пройден с ошибками';
                              statusIcon = '⚠️';
                            }
                            
                            return (
                              <div key={testProgress.id} className="col-md-6 mb-3">
                                <div className="card border-0 shadow-sm">
                                  <div className="card-body">
                                    <h6 className="card-title">{testProgress.test?.title || 'Тест'}</h6>
                                    <p className="card-text text-muted small">Попыток: {testProgress.attempts_count || 1}</p>
                                    <span className={`badge ${badgeColor}`}>
                                      {statusIcon} {statusText}
                                    </span>
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

          <ConfirmModalComponent />
        </div>
      </div>
      </div>
    </>
  );
};

export default Profile;

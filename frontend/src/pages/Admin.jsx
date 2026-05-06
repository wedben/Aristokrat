import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import WheelOfFortune from "../components/WheelOfFortune";
import "../styles/wheel-button.css";

export default function Admin() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalNewCards: 0,
    totalTests: 0,
    totalUsers: 0
  });
  const [pendingUsers, setPendingUsers] = useState(0);
  const [pendingPasswordResets, setPendingPasswordResets] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showWheel, setShowWheel] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    const fetchData = async () => {
      try {
        const [userResponse, newCardsResponse, testsResponse, usersResponse, pendingResponse, passwordResetResponse] = await Promise.all([
          api.get('/auth/me'),
          api.get('/cards'),
          api.get('/tests/'),
          api.get('/admin/users'),
          api.get('/admin/users/pending-verification'),
          api.get('/admin/password-reset/pending-count').catch(() => ({ data: { count: 0 } }))
        ]);

        setUser(userResponse.data);
        if (userResponse.data.role !== 'admin') {
          window.location.href = '/access-denied';
          return;
        }

        setStats({
          totalNewCards: newCardsResponse.data.length,
          totalTests: testsResponse.data.length,
          totalUsers: usersResponse.data.length
        });
        setPendingUsers(pendingResponse.data.count);
        setPendingPasswordResets(passwordResetResponse.data.count);
      } catch (error) {
        console.error('Error fetching admin data:', error);
        console.error('Error details:', error.response?.data || error.message);
        // Не удаляем токен сразу, возможно это временная ошибка
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        } else {
          // Для других ошибок показываем сообщение, но не выходим
          console.error('Ошибка загрузки данных админ панели:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="container-fluid vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Загрузка...</span>
          </div>
          <p className="text-muted">Загрузка админ панели...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <div className="container-fluid vh-100 d-flex align-items-center justify-content-center">Загрузка...</div>;
  }

  return (
    <div className="container-fluid py-4">
      {/* Заголовок */}
      <div className="row mb-4">
        <div className="col-12">
          <h1 className="display-4 fw-bold text-primary mb-2">
            ⚙️ Админ панель
          </h1>
          <p className="lead text-muted">Управление системой обучения официантов</p>
        </div>
      </div>

      {/* Уведомление о пользователях, ожидающих верификации */}
      {pendingUsers > 0 && (
        <div className="row mb-3 mb-md-4">
          <div className="col-12">
            <div className="alert alert-warning alert-dismissible fade show" role="alert">
              <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center gap-2 gap-md-3">
                <div className="d-none d-md-block">
                  <span className="fs-3">⚠️</span>
                </div>
                <div className="flex-grow-1">
                  <h5 className="alert-heading mb-1 mb-md-2">Требуется верификация пользователей</h5>
                  <p className="mb-0 mb-md-0 small">
                    {pendingUsers === 1 
                      ? '1 новый пользователь ожидает верификации администратором'
                      : `${pendingUsers} новых пользователей ожидают верификации администратором`
                    }
                  </p>
                </div>
                <Link to="/admin/users" className="btn btn-warning btn-sm w-100 w-md-auto">
                  <span className="d-none d-md-inline">Перейти к пользователям →</span>
                  <span className="d-md-none">Перейти →</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Уведомление о запросах на восстановление пароля */}
      {pendingPasswordResets > 0 && (
        <div className="row mb-3 mb-md-4">
          <div className="col-12">
            <div className="alert alert-info alert-dismissible fade show" role="alert">
              <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center gap-2 gap-md-3">
                <div className="d-none d-md-block">
                  <span className="fs-3">🔑</span>
                </div>
                <div className="flex-grow-1">
                  <h5 className="alert-heading mb-1 mb-md-2">Запросы на восстановление пароля</h5>
                  <p className="mb-0 mb-md-0 small">
                    {pendingPasswordResets === 1 
                      ? '1 запрос на восстановление пароля ожидает подтверждения'
                      : `${pendingPasswordResets} запросов на восстановление пароля ожидают подтверждения`
                    }
                  </p>
                </div>
                <Link to="/admin/password-reset" className="btn btn-info btn-sm w-100 w-md-auto">
                  <span className="d-none d-md-inline">Перейти к запросам →</span>
                  <span className="d-md-none">Перейти →</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Компактная панель статистики */}
      <div className="row mb-4 mb-md-5">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body py-3">
              <div className="row g-0 text-center">
                <div className="col-4">
                  <div className="border-end">
                    <div className="h4 h3-md mb-1 text-warning fw-bold">{stats.totalNewCards}</div>
                    <div className="small text-muted">
                      <span className="d-none d-sm-inline">🆕 Новые карточки</span>
                      <span className="d-inline d-sm-none">🆕 Карточки</span>
                    </div>
                  </div>
                </div>
                <div className="col-4">
                  <div className="border-end">
                    <div className="h4 h3-md mb-1 text-success fw-bold">{stats.totalTests}</div>
                    <div className="small text-muted">📝 Тесты</div>
                  </div>
                </div>
                <div className="col-4">
                  <div className="h4 h3-md mb-1 text-info fw-bold">{stats.totalUsers}</div>
                  <div className="small text-muted">👥 Пользователи</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Быстрые действия */}
      <div className="row g-3 g-md-4">
        <div className="col-12 col-sm-6 col-lg-4">
          <Link to="/admin/new-cards" className="text-decoration-none">
            <div className="card h-100 border-0 shadow-sm hover-shadow-lg transition-all">
              <div className="card-body text-center p-3 p-md-4">
                <div className="mb-3">
                  <div className="mx-auto d-flex align-items-center justify-content-center rounded-circle bg-warning bg-opacity-10" style={{ width: '60px', height: '60px' }}>
                    <span className="fs-2 text-warning">🆕</span>
                  </div>
                </div>
                <h5 className="card-title fw-bold text-dark mb-3">Новые карточки</h5>
                <p className="card-text text-muted small">
                  Управление карточками сервиса, барной карты, кухни и винной карты
                </p>
                <div className="mt-3">
                  <span className="badge bg-warning">Перейти</span>
                </div>
              </div>
            </div>
          </Link>
        </div>

        <div className="col-12 col-sm-6 col-lg-4">
          <Link to="/admin/tests" className="text-decoration-none">
            <div className="card h-100 border-0 shadow-sm hover-shadow-lg transition-all">
              <div className="card-body text-center p-3 p-md-4">
                <div className="mb-3">
                  <div className="mx-auto d-flex align-items-center justify-content-center rounded-circle bg-success bg-opacity-10" style={{ width: '60px', height: '60px' }}>
                    <span className="fs-2 text-success">📝</span>
                  </div>
                </div>
                <h5 className="card-title fw-bold text-dark mb-3">Управление тестами</h5>
                <p className="card-text text-muted small">
                  Создавайте тесты с вопросами и вариантами ответов для проверки знаний
                </p>
                <div className="mt-3">
                  <span className="badge bg-success">Перейти</span>
                </div>
              </div>
            </div>
          </Link>
        </div>

        <div className="col-12 col-sm-6 col-lg-4">
          <Link to="/admin/users" className="text-decoration-none">
            <div className="card h-100 border-0 shadow-sm hover-shadow-lg transition-all">
              <div className="card-body text-center p-3 p-md-4">
                <div className="mb-3 position-relative">
                  <div className="mx-auto d-flex align-items-center justify-content-center rounded-circle bg-info bg-opacity-10" style={{ width: '60px', height: '60px' }}>
                    <span className="fs-2 text-info">👥</span>
                  </div>
                  {pendingPasswordResets > 0 && (
                    <div className="position-absolute top-0 end-0 translate-middle">
                      <span className="badge bg-primary" style={{ fontSize: '0.75rem' }}>
                        {pendingPasswordResets}
                      </span>
                    </div>
                  )}
                </div>
                <h5 className="card-title fw-bold text-dark mb-3">Управление пользователями</h5>
                <p className="card-text text-muted small">
                  Просматривайте статистику пользователей и управляйте их доступом
                </p>
                <div className="mt-3">
                  <span className={`badge ${pendingPasswordResets > 0 ? 'bg-primary' : 'bg-info'}`}>
                    {pendingPasswordResets > 0 ? `🔑 ${pendingPasswordResets} запрос${pendingPasswordResets > 1 ? 'ов' : ''}` : 'Перейти'}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Кнопка рулетки (фиксированная справа снизу) */}
      <button
        className="btn btn-primary wheel-button"
        onClick={() => setShowWheel(true)}
        title="Колесо фортуны"
        aria-label="Открыть колесо фортуны"
      >
        🎰
      </button>

      {/* Модальное окно рулетки */}
      {showWheel && <WheelOfFortune onClose={() => setShowWheel(false)} />}
    </div>
  );
}
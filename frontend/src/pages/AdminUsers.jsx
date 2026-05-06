import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const [usersResponse, statsResponse] = await Promise.all([
          api.get('/admin/users'),
          api.get('/admin/users/statistics')
        ]);
        setUsers(usersResponse.data);
        setStatistics(statsResponse.data);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Ошибка загрузки пользователей');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => 
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'Нет активности';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  if (error) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
        <Link to="/admin" className="btn btn-primary">
          ← Назад в админ панель
        </Link>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Заголовок */}
      <div className="row mb-3 mb-md-4">
        <div className="col-12">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2 gap-md-0">
            <div className="flex-grow-1">
              <h1 className="display-5 fw-bold text-primary mb-2">
                👥 Управление пользователями
              </h1>
              <p className="lead text-muted d-none d-md-block">Просмотр и управление пользователями системы</p>
            </div>
            <div className="d-flex gap-2">
              <Link to="/admin/password-reset" className="btn btn-primary w-100 w-md-auto">
                🔑 Восстановление паролей
              </Link>
              <Link to="/admin" className="btn btn-outline-primary w-100 w-md-auto">
                ← Назад
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Поиск */}
      <div className="row mb-4">
        <div className="col-12 col-md-6">
          <div className="input-group">
            <span className="input-group-text">🔍</span>
            <input
              type="text"
              className="form-control"
              placeholder="Поиск по имени или email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Статистика */}
      <div className="row mb-4">
        <div className="col-12 col-md-6 mb-3 mb-md-0">
          <div className="card border-0 shadow-sm">
            <div className="card-body py-3">
              <h6 className="card-title fw-bold mb-3 d-flex align-items-center gap-2">
                <span>📊</span>
                <span>Статистика пользователей</span>
              </h6>
              {statistics ? (
                <>
                  <div className="row g-0 text-center">
                    <div className="col-4">
                      <div className="border-end">
                        <div className="h4 h3-md mb-1 text-info fw-bold">{statistics.total_users}</div>
                        <div className="small text-muted">Всего</div>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="border-end">
                        <div className="h4 h3-md mb-1 text-success fw-bold">{statistics.active_users}</div>
                        <div className="small text-muted">Активных</div>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="h4 h3-md mb-1 text-warning fw-bold">{statistics.pending_users}</div>
                      <div className="small text-muted">Ожидают верификации</div>
                    </div>
                  </div>
                  {statistics.blocked_users > 0 && (
                    <div className="row g-0 mt-2 pt-2 border-top text-center">
                      <div className="col-12">
                        <div className="h5 mb-1 text-danger fw-bold">{statistics.blocked_users}</div>
                        <div className="small text-muted">Заблокированных</div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-muted">
                  <div className="spinner-border spinner-border-sm me-2" />
                  Загрузка...
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body py-3">
              <h6 className="card-title fw-bold mb-3">📈 Общая статистика</h6>
              {statistics ? (
                <div className="row g-0 text-center">
                  <div className="col-6 mb-2">
                    <div className="small text-muted mb-1">Тестов завершено</div>
                    <div className="h5 mb-0 text-primary fw-bold">{statistics.total_tests_completed}</div>
                  </div>
                  <div className="col-6 mb-2">
                    <div className="small text-muted mb-1">Тестов пройдено</div>
                    <div className="h5 mb-0 text-success fw-bold">{statistics.total_tests_passed}</div>
                  </div>
                  <div className="col-6">
                    <div className="small text-muted mb-1">Карточек изучено</div>
                    <div className="h5 mb-0 text-info fw-bold">{statistics.total_learned_cards}</div>
                  </div>
                  <div className="col-6">
                    <div className="small text-muted mb-1">Среднее на пользователя</div>
                    <div className="h6 mb-0 text-secondary">
                      {statistics.avg_tests_per_user} тестов<br/>
                      {statistics.avg_learned_cards_per_user} карточек
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted">
                  <div className="spinner-border spinner-border-sm me-2" />
                  Загрузка...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Список пользователей */}
      {filteredUsers.length === 0 ? (
        <div className="row">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5">
                <div className="display-1 mb-4 text-muted">👥</div>
                <h5 className="text-muted mb-3">
                  {searchTerm ? 'Пользователи не найдены' : 'Нет пользователей'}
                </h5>
                {searchTerm && (
                  <button
                    className="btn btn-outline-primary"
                    onClick={() => setSearchTerm('')}
                  >
                    Очистить поиск
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {filteredUsers.map((user) => (
            <div key={user.user_id} className="col-12 col-sm-6 col-md-4 col-lg-3">
              <Link
                to={`/admin/users/${user.user_id}`}
                className="text-decoration-none"
              >
                <div className="card h-100 border-0 shadow-sm hover-shadow-lg transition-all">
                  <div className="card-body d-flex flex-column">
                    <div className="mb-3">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        {(() => {
                          let badgeClass = '';
                          let badgeIcon = '';
                          if (user.is_active) {
                            badgeClass = 'bg-success';
                            badgeIcon = '✅';
                          } else if (user.is_pending_verification) {
                            badgeClass = 'bg-warning text-dark';
                            badgeIcon = '⏳';
                          } else {
                            badgeClass = 'bg-danger';
                            badgeIcon = '❌';
                          }
                          return (
                            <div className={`badge ${badgeClass} fs-6`}>
                              {badgeIcon}
                            </div>
                          );
                        })()}
                        <h5 className="card-title fw-bold mb-0 flex-grow-1">
                          {user.full_name}
                        </h5>
                      </div>
                      <p className="card-text text-muted small mb-0">
                        📧 {user.email}
                      </p>
                    </div>

                    <div className="mt-auto">
                      <div className="text-muted small mb-2">
                        <div className="d-flex justify-content-between mb-1">
                          <span>📊 Просмотры карточек:</span>
                          <span className="fw-bold">{user.total_card_views}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-1">
                          <span>📝 Тестов завершено:</span>
                          <span className="fw-bold">{user.total_tests_completed}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-1">
                          <span>✅ Тестов пройдено:</span>
                          <span className="fw-bold text-success">{user.total_tests_passed}</span>
                        </div>
                        <div className="mt-2 pt-2 border-top">
                          <small className="text-muted">
                            Последняя активность: {formatDate(user.last_activity)}
                          </small>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <span className="badge bg-primary">Открыть профиль →</span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


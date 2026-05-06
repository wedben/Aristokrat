import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../hooks/useConfirm';

export default function AdminPasswordReset() {
  const { showSuccess, showError } = useToast();
  const { confirm, ConfirmModalComponent } = useConfirm();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/password-reset/requests');
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching password reset requests:', error);
      showError('Ошибка загрузки запросов');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    const confirmed = await confirm({
      title: 'Подтверждение запроса',
      message: 'Вы уверены, что хотите подтвердить этот запрос на восстановление пароля?',
      confirmText: 'Подтвердить',
      cancelText: 'Отмена',
      type: 'info'
    });

    if (confirmed) {
      try {
        await api.post('/password-reset/approve', { request_id: requestId });
        showSuccess('Запрос подтвержден. Пользователь может теперь установить новый пароль.');
        fetchRequests();
      } catch (error) {
        console.error('Error approving request:', error);
        showError(error.response?.data?.detail || 'Ошибка при подтверждении запроса');
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указано';
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container-fluid vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Загрузка...</span>
          </div>
          <p className="text-muted">Загрузка запросов...</p>
        </div>
      </div>
    );
  }

  const pendingRequests = requests.filter(r => !r.is_approved && !r.is_completed);
  const approvedRequests = requests.filter(r => r.is_approved && !r.is_completed);
  const completedRequests = requests.filter(r => r.is_completed);

  return (
    <div className="container-fluid py-4">
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2 gap-md-0">
            <div className="flex-grow-1">
              <h1 className="display-5 fw-bold text-primary mb-2">
                🔑 Восстановление паролей
              </h1>
              <p className="lead text-muted d-none d-md-block">Управление запросами на восстановление пароля</p>
            </div>
            <Link to="/admin/users" className="btn btn-outline-secondary w-100 w-md-auto">
              ← Назад к пользователям
            </Link>
          </div>
        </div>
      </div>

      {/* Ожидающие подтверждения */}
      {pendingRequests.length > 0 && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-info text-white">
                <h5 className="mb-0">
                  ⏳ Ожидающие подтверждения ({pendingRequests.length})
                </h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Пользователь</th>
                        <th>Email</th>
                        <th>Дата запроса</th>
                        <th>Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingRequests.map((request) => (
                        <tr key={request.id}>
                          <td>{request.full_name}</td>
                          <td>{request.email}</td>
                          <td>{formatDate(request.requested_at)}</td>
                          <td>
                            <button
                              className="btn btn-info btn-sm"
                              onClick={() => handleApprove(request.id)}
                            >
                              ✅ Подтвердить
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Подтвержденные, но не завершенные */}
      {approvedRequests.length > 0 && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-success text-white">
                <h5 className="mb-0">
                  ✅ Подтвержденные ({approvedRequests.length})
                </h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Пользователь</th>
                        <th>Email</th>
                        <th>Дата запроса</th>
                        <th>Дата подтверждения</th>
                        <th>Статус</th>
                      </tr>
                    </thead>
                    <tbody>
                      {approvedRequests.map((request) => (
                        <tr key={request.id}>
                          <td>{request.full_name}</td>
                          <td>{request.email}</td>
                          <td>{formatDate(request.requested_at)}</td>
                          <td>{formatDate(request.approved_at)}</td>
                          <td>
                            <span className="badge bg-success">Ожидает установки пароля</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Завершенные */}
      {completedRequests.length > 0 && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-secondary text-white">
                <h5 className="mb-0">
                  ✓ Завершенные ({completedRequests.length})
                </h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Пользователь</th>
                        <th>Email</th>
                        <th>Дата запроса</th>
                        <th>Дата завершения</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completedRequests.map((request) => (
                        <tr key={request.id}>
                          <td>{request.full_name}</td>
                          <td>{request.email}</td>
                          <td>{formatDate(request.requested_at)}</td>
                          <td>{formatDate(request.completed_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Пустое состояние */}
      {requests.length === 0 && (
        <div className="row">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5">
                <div className="display-1 mb-3 text-muted">🔑</div>
                <h4 className="text-muted mb-3">Нет запросов на восстановление пароля</h4>
                <p className="text-muted">Все запросы обработаны</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModalComponent />
    </div>
  );
}


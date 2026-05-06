import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../contexts/ToastContext';

export default function SetNewPassword() {
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [requestId, setRequestId] = useState(null);

  useEffect(() => {
    const checkApprovedRequest = async () => {
      try {
        const emailParam = searchParams.get('email');
        if (!emailParam) {
          showError('Email не указан');
          navigate('/login');
          return;
        }

        setEmail(emailParam);

        // Проверяем, есть ли одобренный запрос для этого email
        const response = await api.get(`/password-reset/check-approved?email=${encodeURIComponent(emailParam)}`);

        if (!response.data.has_approved_request) {
          showError('Нет одобренного запроса на восстановление пароля для этого email');
          navigate('/login');
          return;
        }

        setRequestId(response.data.request_id);
      } catch (error) {
        console.error('Error checking request:', error);
        showError('Ошибка при проверке запроса');
        navigate('/login');
      } finally {
        setChecking(false);
      }
    };

    checkApprovedRequest();
  }, [searchParams, navigate, showError]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== passwordConfirm) {
      showError('Пароли не совпадают');
      return;
    }

    if (password.length < 8) {
      showError('Пароль должен быть не короче 8 символов');
      return;
    }

    if (!requestId) {
      showError('Ошибка: запрос не найден');
      return;
    }

    setLoading(true);
    try {
      await api.post('/password-reset/set-new-password', {
        request_id: requestId,
        new_password: password
      });
      showSuccess('Пароль успешно изменен! Теперь вы можете войти с новым паролем.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      console.error('Error setting new password:', error);
      showError(error.response?.data?.detail || 'Ошибка при установке нового пароля');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-light px-3">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Проверка...</span>
          </div>
          <p className="text-muted">Проверка запроса...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-light px-3">
      <div className="row w-100 justify-content-center">
        <div className="col-12 col-md-6 col-lg-4">
          <div className="text-center mb-4">
            <h2 className="display-5 fw-bold text-primary mb-2">
              🔑 Установка нового пароля
            </h2>
            <p className="text-muted">Ваш запрос подтвержден администратором</p>
          </div>
          
          <div className="card shadow-lg">
            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label fw-semibold">
                    📧 Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    className="form-control form-control-lg"
                    disabled
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="password" className="form-label fw-semibold">
                    🔒 Новый пароль
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-control form-control-lg"
                    placeholder="Введите новый пароль"
                    required
                    minLength={8}
                  />
                  <div className="form-text">
                    Минимум 8 символов, включая заглавные и строчные буквы, цифры
                  </div>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="passwordConfirm" className="form-label fw-semibold">
                    🔒 Подтвердите пароль
                  </label>
                  <input
                    id="passwordConfirm"
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    className="form-control form-control-lg"
                    placeholder="Повторите новый пароль"
                    required
                    minLength={8}
                  />
                </div>
                
                <button
                  type="submit"
                  className="btn btn-primary btn-lg w-100 mb-3"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Установка...
                    </>
                  ) : (
                    '✅ Установить новый пароль'
                  )}
                </button>
              </form>
              
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="btn btn-link text-decoration-none p-0"
                >
                  ← Вернуться к входу
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


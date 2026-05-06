import { useState } from "react";
import { api, setAuthToken } from "../api";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "../contexts/ToastContext";

export default function Login() {
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [checkLoading, setCheckLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      console.log("Отправка запроса на логин:", { email, password: "***" });
      const res = await api.post("/auth/login", { email, password });
      
      // Проверяем, заблокирован ли пользователь
      if (res.data.user && !res.data.user.is_active) {
        setShowBlockedModal(true);
        return;
      }
      
      setAuthToken(res.data.access_token);
      window.location.href = "/";
    } catch (e) {
      if (e.response?.status === 403) {
        setShowBlockedModal(true);
      } else {
        setError("Неверный email или пароль");
      }
    }
  };

  return (
    <>
      <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-light px-3">
        <div className="row w-100 justify-content-center">
          <div className="col-12 col-md-6 col-lg-4">
            <div className="text-center mb-4">
              <h2 className="display-5 fw-bold text-primary mb-2">
                🔑 Вход в систему
              </h2>
              <p className="text-muted">Добро пожаловать в Аристократ</p>
            </div>
            
            <div className="card shadow-lg">
              <div className="card-body p-4">
                <form onSubmit={submit}>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label fw-semibold">
                      📧 Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="form-control form-control-lg"
                      placeholder="Введите ваш email"
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="password" className="form-label fw-semibold">
                      🔒 Пароль
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="form-control form-control-lg"
                      placeholder="Введите ваш пароль"
                      required
                    />
                  </div>
                  
                  <div className="mb-3 text-end">
                    <button
                      type="button"
                      onClick={() => {
                        setResetEmail(email);
                        setShowForgotPasswordModal(true);
                      }}
                      className="btn btn-link text-decoration-none p-0"
                      style={{ fontSize: '0.9rem' }}
                    >
                      🔑 Забыли пароль?
                    </button>
                  </div>
                  
                  {error && (
                    <div className="alert alert-danger">
                      <strong>⚠️ {error}</strong>
                    </div>
                  )}
                  
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg w-100 mb-3"
                  >
                    🚀 Войти
                  </button>
                </form>
                
                <div className="text-center">
                  <p className="text-muted">
                    Нет аккаунта?{' '}
                    <Link 
                      to="/register" 
                      className="text-decoration-none fw-semibold"
                    >
                      ✨ Зарегистрироваться
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно для заблокированных пользователей */}
      {showBlockedModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body text-center p-4">
                <div className="mb-4">
                  <div className="mx-auto d-flex align-items-center justify-content-center rounded-circle bg-warning bg-opacity-25" style={{ width: '80px', height: '80px' }}>
                    <span className="display-4">⚠️</span>
                  </div>
                </div>
                <h4 className="modal-title fw-bold mb-3">
                  Профиль заблокирован
                </h4>
                <p className="text-muted mb-4">
                  Ваш профиль заблокирован для дальнейшей верификации. 
                  Обратитесь к вашему администратору для разблокировки аккаунта.
                </p>
                <button
                  onClick={() => setShowBlockedModal(false)}
                  className="btn btn-secondary btn-lg"
                >
                  Понятно
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно для восстановления пароля */}
      {showForgotPasswordModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">🔑 Восстановление пароля</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowForgotPasswordModal(false);
                    setResetEmail("");
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <p className="text-muted mb-4">
                  Введите ваш email. Вы можете отправить новый запрос на восстановление пароля или проверить, подтвержден ли ваш предыдущий запрос администратором.
                </p>
                <div className="mb-3">
                  <label htmlFor="resetEmail" className="form-label fw-semibold">
                    📧 Email
                  </label>
                  <input
                    id="resetEmail"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="form-control"
                    placeholder="Введите ваш email"
                    required
                  />
                </div>
              </div>
              <div className="modal-footer d-flex flex-column flex-sm-row gap-2">
                <button
                  type="button"
                  className="btn btn-secondary order-2 order-sm-1"
                  onClick={() => {
                    setShowForgotPasswordModal(false);
                    setResetEmail("");
                  }}
                  disabled={resetLoading || checkLoading}
                >
                  Отмена
                </button>
                <button
                  type="button"
                  className="btn btn-info order-1 order-sm-2"
                  onClick={async () => {
                    if (!resetEmail) {
                      showError("Введите email");
                      return;
                    }
                    
                    setCheckLoading(true);
                    try {
                      const response = await api.get(`/password-reset/check-approved?email=${encodeURIComponent(resetEmail)}`);
                      
                      if (response.data.has_approved_request) {
                        // Перенаправляем на страницу установки нового пароля
                        navigate(`/set-new-password?email=${encodeURIComponent(resetEmail)}`);
                        setShowForgotPasswordModal(false);
                        setResetEmail("");
                      } else {
                        showError("Нет подтвержденного запроса на восстановление пароля для этого email. Ожидайте подтверждения администратором или отправьте новый запрос.");
                      }
                    } catch (err) {
                      console.error('Error checking approved request:', err);
                      showError("Ошибка при проверке запроса. Попробуйте позже.");
                    } finally {
                      setCheckLoading(false);
                    }
                  }}
                  disabled={resetLoading || checkLoading}
                >
                  {checkLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Проверка...
                    </>
                  ) : (
                    "✅ Проверить подтвержденный запрос"
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-primary order-3"
                  onClick={async () => {
                    if (!resetEmail) {
                      showError("Введите email");
                      return;
                    }
                    
                    setResetLoading(true);
                    try {
                      await api.post("/password-reset/request", { email: resetEmail });
                      showSuccess("Запрос на восстановление пароля отправлен администратору. Ожидайте подтверждения.");
                      setShowForgotPasswordModal(false);
                      setResetEmail("");
                    } catch (err) {
                      if (err.response?.status === 400) {
                        showError(err.response.data.detail || "Ошибка при отправке запроса");
                      } else {
                        showError("Ошибка при отправке запроса. Попробуйте позже.");
                      }
                    } finally {
                      setResetLoading(false);
                    }
                  }}
                  disabled={resetLoading || checkLoading}
                >
                  {resetLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Отправка...
                    </>
                  ) : (
                    "📤 Отправить новый запрос"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

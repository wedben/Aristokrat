import { useState } from "react";
import { api, setAuthToken } from "../api";
import { Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showBlockedModal, setShowBlockedModal] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("/auth/login", { email, password, full_name: "-" });
      
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
                  
                  <div className="mb-4">
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
    </>
  );
}

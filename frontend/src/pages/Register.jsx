import { useState } from "react";
import { api } from "../api";
import { Link } from "react-router-dom";

export default function Register() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [hint, setHint] = useState("");
  const [ok, setOk] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setOk(false);
    try {
      await api.post("/auth/register/waiter", {
        email,
        first_name: firstName,
        last_name: lastName,
        password,
        password_confirm: password2,
        phone: phone || null,
        address: address || null,
      });
      setOk(true);
      setHint("");
      setShowBlockedModal(true);
    } catch (e) {
      const data = e?.response?.data;
      let message = "Ошибка регистрации";
      let suggestion = "Проверьте введённые поля и отправьте форму ещё раз.";

      const toText = (d) => (d?.msg || d?.detail || (typeof d === "string" ? d : ""));
      const details = data?.detail
        ? (Array.isArray(data.detail) ? data.detail.map(toText).join("; ") : toText(data))
        : (e?.message || "");

      if (details) message = details;

      const low = message.toLowerCase();
      if (low.includes("email already registered")) {
        message = "Такой email уже зарегистрирован";
        suggestion = "Войдите с этим email или используйте другой адрес.";
      } else if (low.includes("пароли не совпадают")) {
        suggestion = "Введите одинаковые значения в оба поля пароля.";
      } else if (low.includes("пароль должен быть не короче")) {
        suggestion = "Укажите пароль длиной от 8 символов.";
      } else if (low.includes("заглавную букву")) {
        suggestion = "Добавьте хотя бы одну заглавную букву (A–Z).";
      } else if (low.includes("строчную букву")) {
        suggestion = "Добавьте хотя бы одну строчную букву (a–z).";
      } else if (low.includes("цифру")) {
        suggestion = "Добавьте хотя бы одну цифру (0–9).";
      } else if (low.includes("valid email") || low.includes("email address")) {
        message = "Некорректный email";
        suggestion = "Проверьте формат, например: name@example.com.";
      }

      setError(message);
      setHint(suggestion);
    }
  };

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-light px-3 py-4 register-container">
      <div className="row w-100 justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="text-center mb-3 mb-md-4">
            <h2 className="display-5 fw-bold text-primary mb-2 register-title">
              ✨ Регистрация
            </h2>
            <p className="text-muted register-subtitle">Создайте аккаунт официанта</p>
          </div>
          
          <div className="card shadow-lg register-card">
            <div className="card-body p-3 p-md-4">
              <form onSubmit={submit} className="register-form">
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label htmlFor="email" className="form-label fw-semibold register-label">
                      📧 Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="form-control register-input"
                      placeholder="Введите ваш email"
                      required
                    />
                  </div>
                  
                  <div className="col-12 col-md-6">
                    <label htmlFor="firstName" className="form-label fw-semibold register-label">
                      👤 Имя
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="form-control register-input"
                      placeholder="Введите ваше имя"
                      required
                    />
                  </div>
                  
                  <div className="col-12 col-md-6">
                    <label htmlFor="lastName" className="form-label fw-semibold register-label">
                      👤 Фамилия
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="form-control register-input"
                      placeholder="Введите вашу фамилию"
                      required
                    />
                  </div>
                  
                  <div className="col-12 col-md-6">
                    <label htmlFor="phone" className="form-label fw-semibold register-label">
                      📱 Номер телефона
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="form-control register-input"
                      placeholder="+7 (999) 123-45-67"
                    />
                  </div>
                  
                  <div className="col-12">
                    <label htmlFor="address" className="form-label fw-semibold register-label">
                      🏠 Адрес проживания
                    </label>
                    <input
                      id="address"
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="form-control register-input"
                      placeholder="Введите ваш адрес проживания"
                    />
                  </div>
                  
                  <div className="col-12 col-md-6">
                    <label htmlFor="password" className="form-label fw-semibold register-label">
                      🔒 Пароль
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="form-control register-input"
                      placeholder="Введите пароль"
                      required
                    />
                  </div>
                  
                  <div className="col-12 col-md-6">
                    <label htmlFor="password2" className="form-label fw-semibold register-label">
                      🔒 Повторите пароль
                    </label>
                    <input
                      id="password2"
                      type="password"
                      value={password2}
                      onChange={(e) => setPassword2(e.target.value)}
                      className="form-control register-input"
                      placeholder="Подтвердите пароль"
                      required
                    />
                  </div>
                </div>
                
                {error && (
                  <div className="alert alert-danger mt-3 register-alert">
                    <strong>⚠️ {error}</strong>
                    {hint && <div className="mt-2">{hint}</div>}
                  </div>
                )}
                
                
                <button
                  type="submit"
                  className="btn btn-primary btn-lg w-100 mt-3 mt-md-4 register-submit"
                >
                  🚀 Зарегистрироваться
                </button>
              </form>
              
              <div className="text-center mt-3 mt-md-4 register-footer">
                <p className="text-muted mb-0">
                  Уже есть аккаунт?{' '}
                  <Link 
                    to="/login" 
                    className="text-decoration-none fw-semibold"
                  >
                    🔑 Войти
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно о блокировке профиля после регистрации */}
      {showBlockedModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered register-modal-dialog">
            <div className="modal-content register-modal-content">
              <div className="modal-body text-center p-3 p-md-4">
                <div className="mb-3 mb-md-4">
                  <div className="mx-auto d-flex align-items-center justify-content-center" style={{ 
                    width: '80px', 
                    height: '80px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 193, 7, 0.2)'
                  }}>
                    <span style={{ fontSize: '3rem' }}>⏳</span>
                  </div>
                </div>
                <h4 className="modal-title fw-bold mb-3 register-modal-title">
                  Регистрация успешна!
                </h4>
                <p className="text-muted mb-4 register-modal-text">
                  Пользователь успешно создан, но пока ваш профиль заблокирован. 
                  Ожидайте верификации администратором. После верификации вы сможете войти в систему.
                </p>
                <div className="d-flex flex-column flex-sm-row gap-2 justify-content-center register-modal-buttons">
                  <Link
                    to="/login"
                    className="btn btn-primary btn-lg register-modal-btn"
                    onClick={() => setShowBlockedModal(false)}
                  >
                    Перейти к входу
                  </Link>
                  <button
                    onClick={() => setShowBlockedModal(false)}
                    className="btn btn-secondary btn-lg register-modal-btn"
                  >
                    Понятно
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



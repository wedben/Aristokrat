import { useState } from "react";
import { api } from "../api";
import { Link } from "react-router-dom";

export default function Register() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const [hint, setHint] = useState("");
  const [ok, setOk] = useState(false);

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
      });
      setOk(true);
      setHint("");
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
    <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="row w-100 justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="text-center mb-4">
            <h2 className="display-5 fw-bold text-primary mb-2">
              ✨ Регистрация
            </h2>
            <p className="text-muted">Создайте аккаунт официанта</p>
          </div>
          
          <div className="card shadow-lg">
            <div className="card-body p-4">
              <form onSubmit={submit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label htmlFor="email" className="form-label fw-semibold">
                      📧 Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="form-control"
                      placeholder="Введите ваш email"
                      required
                    />
                  </div>
                  
                  <div className="col-md-6">
                    <label htmlFor="firstName" className="form-label fw-semibold">
                      👤 Имя
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="form-control"
                      placeholder="Введите ваше имя"
                      required
                    />
                  </div>
                  
                  <div className="col-md-6">
                    <label htmlFor="lastName" className="form-label fw-semibold">
                      👤 Фамилия
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="form-control"
                      placeholder="Введите вашу фамилию"
                      required
                    />
                  </div>
                  
                  <div className="col-md-6">
                    <label htmlFor="password" className="form-label fw-semibold">
                      🔒 Пароль
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="form-control"
                      placeholder="Введите пароль"
                      required
                    />
                  </div>
                  
                  <div className="col-12">
                    <label htmlFor="password2" className="form-label fw-semibold">
                      🔒 Повторите пароль
                    </label>
                    <input
                      id="password2"
                      type="password"
                      value={password2}
                      onChange={(e) => setPassword2(e.target.value)}
                      className="form-control"
                      placeholder="Подтвердите пароль"
                      required
                    />
                  </div>
                </div>
                
                {error && (
                  <div className="alert alert-danger mt-3">
                    <strong>⚠️ {error}</strong>
                    {hint && <div className="mt-2">{hint}</div>}
                  </div>
                )}
                
                {ok && (
                  <div className="alert alert-success mt-3">
                    <strong>✅ Успешно! Теперь можете{' '}
                      <Link to="/login" className="text-decoration-none">
                        войти
                      </Link>
                      .</strong>
                  </div>
                )}
                
                <button
                  type="submit"
                  className="btn btn-primary btn-lg w-100 mt-4"
                >
                  🚀 Зарегистрироваться
                </button>
              </form>
              
              <div className="text-center mt-4">
                <p className="text-muted">
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
    </div>
  );
}



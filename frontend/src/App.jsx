import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { api } from './api'
import { ToastProvider } from './contexts/ToastContext'
import './App.css'
import Login from './pages/Login'
import Register from './pages/Register'
import WelcomePage from './pages/WelcomePage'
import ServiceStandards from './pages/ServiceStandards'
import BarCards from './pages/BarCards'
import KitchenCards from './pages/KitchenCards'
import WineCards from './pages/WineCards'
import TestPage from './pages/Test'
import TestsList from './pages/TestsList'
import Profile from './pages/Profile'
import Admin from './pages/Admin'
import AdminTests from './pages/AdminTests'
import AdminNewCards from './pages/AdminNewCards'
import AdminUsers from './pages/AdminUsers'
import AdminUserProfile from './pages/AdminUserProfile'
import AdminPasswordReset from './pages/AdminPasswordReset'
import SetNewPassword from './pages/SetNewPassword'
import AccessDenied from './pages/AccessDenied'
import TestAPI from './pages/TestAPI'

// Компонент для закрытия навигации на мобильных
function NavbarCloser() {
  const location = useLocation();
  
  useEffect(() => {
    // Закрываем навигацию при изменении маршрута
    const navbar = document.getElementById('navbarNav');
    if (navbar && navbar.classList.contains('show')) {
      const bsCollapse = window.bootstrap?.Collapse?.getInstance(navbar);
      if (bsCollapse) {
        bsCollapse.hide();
      } else {
        // Fallback если Bootstrap не загружен
        navbar.classList.remove('show');
      }
    }
  }, [location]);
  
  return null;
}

function Protected({ children }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  return children
}

function AdminProtected({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }

    api.get('/auth/me')
      .then(response => {
        setUser(response.data)
        if (response.data.role !== 'admin') {
          window.location.href = '/access-denied'
          return
        }
      })
      .catch((error) => {
        console.error('Error fetching admin user:', error)
        localStorage.removeItem('token')
        window.location.href = '/login'
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Загрузка...</div>
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/access-denied" replace />
  }

  return children
}

function ProfileProtected({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }

    api.get('/auth/me')
      .then(response => {
        setUser(response.data)
        if (response.data.role === 'admin') {
          window.location.href = '/admin'
          return
        }
      })
      .catch((error) => {
        console.error('Error fetching user:', error)
        localStorage.removeItem('token')
        window.location.href = '/login'
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Загрузка...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role === 'admin') {
    return <Navigate to="/admin" replace />
  }

  return children
}

function Navigation() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      api.get('/auth/me')
        .then(response => setUser(response.data))
        .catch(() => {
          localStorage.removeItem('token')
          setUser(null)
        })
    }
  }, [])

  const closeMobileNav = () => {
    const navbar = document.getElementById('navbarNav');
    if (navbar && navbar.classList.contains('show')) {
      const bsCollapse = window.bootstrap?.Collapse?.getInstance(navbar);
      if (bsCollapse) {
        bsCollapse.hide();
      } else {
        navbar.classList.remove('show');
      }
    }
  }

  if (!user) {
    return (
      <nav className="navbar navbar-expand-lg navbar-light bg-light shadow-sm sticky-top">
        <div className="container-fluid">
          <Link to="/" className="navbar-brand fw-bold text-primary d-flex align-items-center">
            <span className="me-2">🍽️</span>
            <span>Аристократ</span>
          </Link>
          
          <button 
            className="navbar-toggler border-0" 
            type="button" 
            data-bs-toggle="collapse" 
            data-bs-target="#navbarNav"
            aria-controls="navbarNav" 
            aria-expanded="false" 
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto">
              <li className="nav-item">
                <Link to="/standards" className="nav-link d-flex align-items-center" onClick={() => closeMobileNav()}>
                  <span className="me-2">📋</span>
                  <span>Сервис</span>
                </Link>
              </li>
              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle d-flex align-items-center" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                  <span className="me-2">📖</span>
                  <span>Меню</span>
                </a>
                <ul className="dropdown-menu">
                  <li><Link to="/bar" className="dropdown-item d-flex align-items-center" onClick={() => closeMobileNav()}><span className="me-2">🍸</span>Барная карта</Link></li>
                  <li><Link to="/kitchen" className="dropdown-item d-flex align-items-center" onClick={() => closeMobileNav()}><span className="me-2">🍽️</span>Кухня</Link></li>
                  <li><Link to="/wine" className="dropdown-item d-flex align-items-center" onClick={() => closeMobileNav()}><span className="me-2">🍷</span>Винная карта</Link></li>
                </ul>
              </li>
              <li className="nav-item">
                <Link to="/tests" className="nav-link d-flex align-items-center" onClick={() => closeMobileNav()}>
                  <span className="me-2">🧪</span>
                  <span>Тесты</span>
                </Link>
              </li>
            </ul>
            
            <ul className="navbar-nav">
              <li className="nav-item">
                <Link to="/login" className="nav-link d-flex align-items-center">
                  <span className="me-2">🔑</span>
                  <span>Войти</span>
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/register" className="btn btn-primary ms-2 d-flex align-items-center">
                  <span className="me-2">✨</span>
                  <span>Регистрация</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light shadow-sm sticky-top">
      <div className="container-fluid">
        <Link to="/" className="navbar-brand fw-bold text-primary d-flex align-items-center">
          <span className="me-2">🍽️</span>
          <span>Аристократ</span>
        </Link>
        
        <button 
          className="navbar-toggler border-0" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
          aria-controls="navbarNav" 
          aria-expanded="false" 
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link to="/standards" className="nav-link d-flex align-items-center" onClick={closeMobileNav}>
                <span className="me-2">📋</span>
                <span>Сервис</span>
              </Link>
            </li>
            <li className="nav-item dropdown">
              <a className="nav-link dropdown-toggle d-flex align-items-center" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                <span className="me-2">📖</span>
                <span>Меню</span>
              </a>
              <ul className="dropdown-menu">
                <li><Link to="/bar" className="dropdown-item d-flex align-items-center" onClick={closeMobileNav}><span className="me-2">🍸</span>Барная карта</Link></li>
                <li><Link to="/kitchen" className="dropdown-item d-flex align-items-center" onClick={closeMobileNav}><span className="me-2">🍽️</span>Кухня</Link></li>
                <li><Link to="/wine" className="dropdown-item d-flex align-items-center" onClick={closeMobileNav}><span className="me-2">🍷</span>Винная карта</Link></li>
              </ul>
            </li>
            <li className="nav-item">
              <Link to="/tests" className="nav-link d-flex align-items-center" onClick={closeMobileNav}>
                <span className="me-2">🧪</span>
                <span>Тесты</span>
              </Link>
            </li>
            {user.role !== 'admin' && (
              <li className="nav-item">
                <Link to="/profile" className="nav-link d-flex align-items-center" onClick={closeMobileNav}>
                  <span className="me-2">👤</span>
                  <span>Профиль</span>
                </Link>
              </li>
            )}
            {user.role === 'admin' && (
              <li className="nav-item">
                <Link to="/admin" className="nav-link d-flex align-items-center" onClick={closeMobileNav}>
                  <span className="me-2">⚙️</span>
                  <span>Админ</span>
                </Link>
              </li>
            )}
          </ul>
          
          <ul className="navbar-nav">
            <li className="nav-item d-none d-lg-block">
              <span className="navbar-text me-3">
                👋 Добро пожаловать, {user.full_name}!
              </span>
            </li>
            <li className="nav-item d-lg-none">
              <span className="navbar-text me-3 small">
                👋 {user.full_name}
              </span>
            </li>
            <li className="nav-item">
              <button
                onClick={() => { localStorage.removeItem('token'); window.location.href = '/login' }}
                className="btn btn-outline-danger d-flex align-items-center"
              >
                <span className="me-2">🚪</span>
                <span>Выход</span>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  )
}

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <NavbarCloser />
        <Navigation />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/set-new-password" element={<SetNewPassword />} />
          <Route path="/" element={<WelcomePage />} />
          <Route path="/standards" element={<Protected><ServiceStandards /></Protected>} />
          <Route path="/bar" element={<Protected><BarCards /></Protected>} />
          <Route path="/kitchen" element={<Protected><KitchenCards /></Protected>} />
          <Route path="/wine" element={<Protected><WineCards /></Protected>} />
          <Route path="/tests" element={<Protected><TestsList /></Protected>} />
          <Route path="/tests/:id" element={<Protected><TestPage /></Protected>} />
          <Route path="/profile" element={<ProfileProtected><Profile /></ProfileProtected>} />
          <Route path="/admin" element={<AdminProtected><Admin /></AdminProtected>} />
          <Route path="/admin/new-cards" element={<AdminProtected><AdminNewCards /></AdminProtected>} />
          <Route path="/admin/tests" element={<AdminProtected><AdminTests /></AdminProtected>} />
          <Route path="/admin/users" element={<AdminProtected><AdminUsers /></AdminProtected>} />
          <Route path="/admin/users/:userId" element={<AdminProtected><AdminUserProfile /></AdminProtected>} />
          <Route path="/admin/password-reset" element={<AdminProtected><AdminPasswordReset /></AdminProtected>} />
          <Route path="/admin/*" element={<AdminProtected><Admin /></AdminProtected>} />
          <Route path="/access-denied" element={<AccessDenied />} />
          <Route path="/test-api" element={<TestAPI />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}

export default App
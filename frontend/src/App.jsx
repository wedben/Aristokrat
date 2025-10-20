import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { api } from './api'
import { ToastProvider } from './contexts/ToastContext'
import './App.css'
import Login from './pages/Login'
import Register from './pages/Register'
import Catalog from './pages/Catalog'
import CardDetail from './pages/CardDetail'
import TestPage from './pages/Test'
import TestsList from './pages/TestsList'
import Profile from './pages/Profile'
import Admin from './pages/Admin'
import AdminCards from './pages/AdminCards'
import AdminTests from './pages/AdminTests'
import AccessDenied from './pages/AccessDenied'
import TestAPI from './pages/TestAPI'

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
          // Перенаправляем официантов на страницу доступа запрещен
          window.location.href = '/access-denied'
        }
      })
      .catch(() => {
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
        // Если админ пытается зайти в профиль, перенаправляем в админ панель
        if (response.data.role === 'admin') {
          window.location.href = '/admin'
        }
      })
      .catch(() => {
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

  if (!user) {
    return (
      <nav className="navbar navbar-expand-lg navbar-light bg-light shadow-sm">
        <div className="container-fluid">
          <Link to="/" className="navbar-brand fw-bold text-primary">
            🍽️ Аристократ
          </Link>
          
          <button 
            className="navbar-toggler" 
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
                <Link to="/test-api" className="nav-link">
                  🔧 Тест API
                </Link>
              </li>
            </ul>
            
            <ul className="navbar-nav">
              <li className="nav-item">
                <Link to="/login" className="nav-link">
                  🔑 Войти
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/register" className="btn btn-primary ms-2">
                  ✨ Регистрация
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light shadow-sm">
      <div className="container-fluid">
        <Link to="/" className="navbar-brand fw-bold text-primary">
          🍽️ Аристократ
        </Link>
        
        <button 
          className="navbar-toggler" 
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
              <Link to="/" className="nav-link">
                📋 Меню
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/tests" className="nav-link">
                📝 Тесты
              </Link>
            </li>
            {user.role !== 'admin' && (
              <li className="nav-item">
                <Link to="/profile" className="nav-link">
                  👤 Профиль
                </Link>
              </li>
            )}
            {user.role === 'admin' && (
              <li className="nav-item">
                <Link to="/admin" className="nav-link">
                  ⚙️ Админ
                </Link>
              </li>
            )}
          </ul>
          
          <ul className="navbar-nav">
            <li className="nav-item">
              <span className="navbar-text me-3">
                👋 Добро пожаловать, {user.full_name}!
              </span>
            </li>
            <li className="nav-item">
              <button
                onClick={() => { localStorage.removeItem('token'); window.location.href = '/login' }}
                className="btn btn-outline-danger"
              >
                🚪 Выход
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
        <Navigation />
        <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Protected><Catalog /></Protected>} />
        <Route path="/menu" element={<Protected><Catalog /></Protected>} />
        <Route path="/test-api" element={<TestAPI />} />
        <Route path="/menu/:id" element={<Protected><CardDetail /></Protected>} />
        <Route path="/register" element={<Register />} />
        <Route path="/tests" element={<Protected><TestsList /></Protected>} />
        <Route path="/tests/:id" element={<Protected><TestPage /></Protected>} />
        <Route path="/profile" element={<ProfileProtected><Profile /></ProfileProtected>} />
        <Route path="/admin" element={<AdminProtected><Admin /></AdminProtected>} />
        <Route path="/admin/cards" element={<AdminProtected><AdminCards /></AdminProtected>} />
        <Route path="/admin/tests" element={<AdminProtected><AdminTests /></AdminProtected>} />
        <Route path="/admin/users" element={<AdminProtected><Profile /></AdminProtected>} />
        <Route path="/admin/*" element={<AdminProtected><Admin /></AdminProtected>} />
        {/* Защита от прямого доступа к админ-функциям */}
        <Route path="/menu/create" element={<AdminProtected><AdminCards /></AdminProtected>} />
        <Route path="/menu/edit/*" element={<AdminProtected><AdminCards /></AdminProtected>} />
        {/* Страница доступа запрещен для официантов */}
        <Route path="/access-denied" element={<AccessDenied />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}

export default App

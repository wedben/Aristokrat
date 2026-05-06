import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FaCrown, FaBookOpen, FaGraduationCap, FaChartBar, FaUser,
  FaRocket, FaStar, FaHeart, FaUsers, FaTrophy
} from 'react-icons/fa';
import { api } from '../api';

const WelcomePage = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then(() => setIsLoggedIn(true))
        .catch(() => setIsLoggedIn(false));
    } else {
      setIsLoggedIn(false);
    }
  }, []);
  const features = [
    {
      icon: <FaBookOpen className="text-primary" />,
      title: "Изучение меню",
      description: "Интерактивные карточки с детальным описанием блюд, вин и напитков"
    },
    {
      icon: <FaGraduationCap className="text-success" />,
      title: "Тестирование знаний",
      description: "Проверка знаний меню и стандартов обслуживания"
    },
    {
      icon: <FaChartBar className="text-warning" />,
      title: "Статистика прогресса",
      description: "Отслеживание вашего развития и достижений"
    },
    {
      icon: <FaCrown className="text-purple" />,
      title: "Система уровней",
      description: "От новичка до эксперта - ваш путь к мастерству"
    }
  ];

  const benefits = [
    "Повышение профессиональных навыков",
    "Улучшение качества обслуживания гостей",
    "Рост уверенности в работе",
    "Карьерные перспективы в ресторанном бизнесе"
  ];

  return (
    <div className="container-fluid py-4 py-md-5 px-3 px-md-4">
      {/* Hero Section */}
      <motion.div
        className="text-center mb-5"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="mb-4">
          <FaCrown className="display-1 text-primary mb-3" />
        </div>
        <h1 className="display-3 fw-bold text-primary mb-3">
          Добро пожаловать в "Аристократ"
        </h1>
        <p className="lead text-muted mb-4">
          Инновационная платформа для обучения и развития команды официантов
        </p>
        <motion.div
          className="d-flex flex-column flex-sm-row justify-content-center gap-2 gap-sm-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {isLoggedIn ? (
            <Link to="/standards" className="btn btn-primary btn-lg px-4 w-100 w-sm-auto">
              <FaRocket className="me-2" />
              Начать обучение
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-primary btn-lg px-4 w-100 w-sm-auto">
                <FaRocket className="me-2" />
                Начать обучение
              </Link>
              <Link to="/register" className="btn btn-outline-primary btn-lg px-4 w-100 w-sm-auto">
                <FaUser className="me-2" />
                Регистрация
              </Link>
            </>
          )}
        </motion.div>
      </motion.div>

      {/* Features Section */}
      <motion.div
        className="row g-4 mb-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      >
        <div className="col-12">
          <h2 className="text-center fw-bold mb-5">
            <FaStar className="me-2 text-warning" />
            Возможности платформы
          </h2>
        </div>
        {features.map((feature, index) => (
          <motion.div
            key={index}
            className="col-lg-3 col-md-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 + (index * 0.1) }}
          >
            <div className="card border-0 shadow-sm h-100 text-center">
              <div className="card-body p-4">
                <div className="fs-1 mb-3">{feature.icon}</div>
                <h5 className="card-title fw-bold">{feature.title}</h5>
                <p className="card-text text-muted">{feature.description}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Benefits Section */}
      <motion.div
        className="row"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.0 }}
      >
        <div className="col-lg-8 mx-auto">
          <div className="card border-0 shadow-sm bg-white">
            <div className="card-body p-5">
              <div className="text-center mb-4">
                <FaTrophy className="fs-1 text-primary mb-3" />
                <h3 className="fw-bold text-dark">Преимущества для вас</h3>
              </div>
              <div className="row">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    className="col-md-6 mb-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 1.2 + (index * 0.1) }}
                  >
                    <div className="d-flex align-items-center text-dark">
                      <FaHeart className="me-3 flex-shrink-0 text-danger" />
                      <span className="text-dark">{benefit}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Team Section */}
      <motion.div
        className="text-center mt-5"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.5 }}
      >
        <FaUsers className="fs-1 text-primary mb-3" />
        <h3 className="fw-bold mb-3">Присоединяйтесь к команде профессионалов</h3>
        <p className="lead text-muted mb-4">
          Станьте частью команды, которая стремится к совершенству в обслуживании гостей
        </p>
        {isLoggedIn ? (
          <Link to="/standards" className="btn btn-primary btn-lg">
            <FaRocket className="me-2" />
            Начать прямо сейчас
          </Link>
        ) : (
          <Link to="/login" className="btn btn-primary btn-lg">
            <FaRocket className="me-2" />
            Начать прямо сейчас
          </Link>
        )}
      </motion.div>
    </div>
  );
};

export default WelcomePage;

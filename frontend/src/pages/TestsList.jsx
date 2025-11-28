import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function TestsList() {
  const [tests, setTests] = useState([]);
  const [completedTests, setCompletedTests] = useState(new Set());
  const [testProgress, setTestProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [testsRes, progressRes] = await Promise.all([
          api.get('/tests/'),
          api.get('/tests/progress/me')
        ]);
        
            setTests(testsRes.data);
            
            // Создаем Set с ID пройденных тестов
            const completedTestIds = new Set(progressRes.data.map(p => p.test_id));
            setCompletedTests(completedTestIds);
            setTestProgress(progressRes.data);
      } catch (err) {
        console.error('Error fetching tests:', err);
        setError('Ошибка загрузки тестов');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="container mt-4">
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
      <div className="container mt-4">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid container-md mt-3 mt-md-4 px-3 px-md-4">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-10">
          {/* Заголовок */}
          <div className="card shadow-sm mb-4">
            <div className="card-body text-center">
              <h1 className="display-5 fw-bold text-primary mb-3">
                📝 Тесты
              </h1>
              <p className="lead text-muted mb-0">
                Проверьте свои знания
              </p>
            </div>
          </div>

          {/* Список тестов */}
          {tests.length === 0 ? (
            <div className="card shadow-sm">
              <div className="card-body text-center py-5">
                <div className="display-1 mb-4">📝</div>
                <h3 className="h2 text-muted mb-3">Тестов пока нет</h3>
                <p className="lead text-muted">Пройдите обучение по карточкам меню</p>
                <Link to="/" className="btn btn-primary btn-lg">
                  🏠 На главную
                </Link>
              </div>
            </div>
          ) : (
            <div className="row g-4">
                  {tests.map((test) => {
                    const isCompleted = completedTests.has(test.id);
                    // Находим прогресс для этого теста
                    const progress = testProgress.find(p => p.test_id === test.id);
                    
                    // Определяем статус теста
                    let statusColor = '';
                    let statusText = '';
                    let statusIcon = '';
                    let statusLabel = '';
                    
                    if (progress) {
                      const errorsMade = progress.max_score - progress.score;
                      if (errorsMade === 0) {
                        // Зеленый - все правильно
                        statusColor = 'border-success border-2';
                        statusText = 'bg-success';
                        statusIcon = '✅';
                        statusLabel = 'Пройден';
                      } else if (errorsMade <= test.max_errors_allowed) {
                        // Желтый - пройден с допустимыми ошибками
                        statusColor = 'border-warning border-2';
                        statusText = 'bg-warning';
                        statusIcon = '⚠️';
                        statusLabel = 'Пройден с ошибками';
                      } else {
                        // Красный - не пройден
                        statusColor = 'border-danger border-2';
                        statusText = 'bg-danger';
                        statusIcon = '❌';
                        statusLabel = 'Не пройден';
                      }
                    }
                    
                    return (
                      <div key={test.id} className="col-12 col-md-6 col-lg-4">
                        <div className={`card h-100 shadow-sm ${statusColor} position-relative`}>
                          {/* Плашка статуса в правом верхнем углу */}
                          {isCompleted && (
                            <span className={`badge ${statusText} fs-6 position-absolute top-0 end-0 m-2`} style={{ zIndex: 10 }}>
                              {statusIcon} {statusLabel}
                            </span>
                          )}
                          <div className="card-body d-flex flex-column">
                            <div className="mb-3">
                              <h5 className="card-title fw-bold">
                                {test.title}
                              </h5>
                            </div>
                            
                            <p className="card-text text-muted flex-grow-1">
                              {test.description || 'Описание отсутствует'}
                            </p>
                            
                            <div className="text-muted small mb-3">
                              <i className="bi bi-question-circle me-1"></i>
                              Вопросов: {test.questions?.length || 0}
                              {test.max_errors_allowed > 0 && (
                                <div>
                                  <i className="bi bi-exclamation-triangle me-1"></i>
                                  Допустимо ошибок: {test.max_errors_allowed}
                                </div>
                              )}
                            </div>
                            
                            <Link 
                              to={`/tests/${test.id}`}
                              className={`btn btn-lg w-100 ${
                                isCompleted 
                                  ? (progress && (progress.max_score - progress.score) <= test.max_errors_allowed && (progress.max_score - progress.score) > 0)
                                    ? 'btn-outline-warning'
                                    : (progress && (progress.max_score - progress.score) === 0)
                                    ? 'btn-outline-success'
                                    : 'btn-outline-danger'
                                  : 'btn-primary'
                              }`}
                            >
                              {isCompleted ? '🔄 Пройти снова' : '▶️ Начать тест'}
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

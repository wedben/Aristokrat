import { useEffect, useState } from "react";
import { api } from "../api";
import { useParams, Link } from "react-router-dom";

export default function TestPage() {
  const { id } = useParams();
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTest = async () => {
      try {
        setLoading(true);
        const testResponse = await api.get(`/tests/${id}`);
        const questionsResponse = await api.get(`/tests/${id}/questions`);
        
        setTest({
          ...testResponse.data,
          questions: questionsResponse.data?.questions || []
        });
      } catch (err) {
        console.error('Error fetching test:', err);
        setError('Ошибка загрузки теста');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTest();
    }
  }, [id]);

  const submit = async () => {
    try {
      setSubmitting(true);
      setError('');
      
      const picked = Object.entries(answers).map(([questionId, answerIds]) => ({
        question_id: parseInt(questionId),
        answer_ids: Array.isArray(answerIds) ? answerIds : [answerIds]
      }));
      
      const response = await api.post(`/tests/${id}/submit`, {
        answers: picked,
        completion_time: null
      });
      
      setResult(response.data);
    } catch (err) {
      console.error('Error submitting test:', err);
      setError('Ошибка при отправке теста');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnswerChange = (questionId, answerId, checked) => {
    setAnswers((prev) => {
      const currentAnswers = prev[questionId] || [];
      if (checked) {
        return { ...prev, [questionId]: [...currentAnswers, answerId] };
      } else {
        return { ...prev, [questionId]: currentAnswers.filter(id => id !== answerId) };
      }
    });
  };

  const isQuestionAnswered = (questionId) => {
    return answers[questionId] && answers[questionId].length > 0;
  };

  const isAllQuestionsAnswered = () => {
    if (!test || !test.questions || test.questions.length === 0) return false;
    return test.questions.every(question => isQuestionAnswered(question.id));
  };

  const scrollToFirstUnanswered = () => {
    if (!test || !test.questions || test.questions.length === 0) return;
    
    const firstUnanswered = test.questions.find(question => !isQuestionAnswered(question.id));
    if (firstUnanswered) {
      const questionElement = document.getElementById(`question-${firstUnanswered.id}`);
      if (questionElement) {
        questionElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const retakeTest = () => {
    setResult(null);
    setAnswers({});
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  if (error && !test) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
        <Link to="/tests" className="btn btn-primary">
          ← Назад к тестам
        </Link>
      </div>
    );
  }

  if (!test || !test.questions || test.questions.length === 0) {
    return (
      <div className="container mt-4">
        <div className="alert alert-warning" role="alert">
          Тест не найден или в нем нет вопросов
        </div>
        <Link to="/tests" className="btn btn-primary">
          ← Назад к тестам
        </Link>
      </div>
    );
  }

  if (result) {
    const errorsMade = result.total_count - result.correct_count;
    const maxErrorsAllowed = test?.max_errors_allowed || 0;
    
    let statusColor = '';
    let statusIcon = '';
    let statusTitle = '';
    let progressBarColor = '';
    
    if (errorsMade === 0) {
      statusColor = 'text-success';
      statusIcon = '🎉';
      statusTitle = 'Отлично!';
      progressBarColor = 'bg-success';
    } else if (errorsMade <= maxErrorsAllowed) {
      statusColor = 'text-warning';
      statusIcon = '⚠️';
      statusTitle = 'Тест пройден с ошибками';
      progressBarColor = 'bg-warning';
    } else {
      statusColor = 'text-danger';
      statusIcon = '❌';
      statusTitle = 'Тест не пройден';
      progressBarColor = 'bg-danger';
    }
    
    return (
      <div className="container mt-4">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-8">
            <div className="card shadow-lg">
              <div className="card-body text-center p-5">
                <div className="mb-4">
                  <div className={`display-1 ${statusColor}`}>
                    {statusIcon}
                  </div>
                </div>
                
                <h2 className="card-title mb-3">
                  {statusTitle}
                </h2>
                
                <div className="mb-4">
                  <h3 className="display-6 fw-bold text-primary">
                    {result.correct_count} / {result.total_count}
                  </h3>
                  <p className="text-muted">
                    Правильных ответов из {result.total_count} вопросов
                  </p>
                  {maxErrorsAllowed > 0 && (
                    <p className="text-muted">
                      Допустимо ошибок: {maxErrorsAllowed}, сделано: {errorsMade}
                    </p>
                  )}
                </div>

                <div className="mb-4">
                  <div className="progress" style={{ height: '20px' }}>
                    <div 
                      className={`progress-bar ${progressBarColor}`}
                      role="progressbar" 
                      style={{ width: `${(result.correct_count / result.total_count) * 100}%` }}
                      aria-valuenow={result.correct_count} 
                      aria-valuemin="0" 
                      aria-valuemax={result.total_count}
                    >
                      {Math.round((result.correct_count / result.total_count) * 100)}%
                    </div>
                  </div>
                </div>

                <div className="d-grid gap-2 d-md-flex justify-content-md-center">
                  {(errorsMade > 0) && (
                    <button onClick={retakeTest} className="btn btn-warning btn-lg">
                      🔄 Решить тест сначала
                    </button>
                  )}
                  <Link to="/tests" className="btn btn-primary btn-lg">
                    📝 Другие тесты
                  </Link>
                  <Link to="/" className="btn btn-outline-secondary btn-lg">
                    🏠 На главную
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid container-md mt-3 mt-md-4 px-3 px-md-4">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-10">
          {/* Заголовок теста */}
          <div className="card shadow-sm mb-4">
            <div className="card-body text-center">
              <h1 className="display-5 fw-bold text-primary mb-3">
                📝 {test.title}
              </h1>
              <p className="lead text-muted mb-3">
                {test.description}
              </p>
              <div className="d-flex flex-column flex-sm-row justify-content-center gap-2 gap-sm-3 mb-3">
                <span className="badge bg-primary fs-6">
                  <span className="d-none d-sm-inline">Всего вопросов: </span>
                  <span className="d-sm-none">Вопросов: </span>
                  {test.questions.length}
                </span>
                <span className="badge bg-success fs-6">
                  <span className="d-none d-sm-inline">Отвечено: </span>
                  <span className="d-sm-none">Отв.: </span>
                  {test.questions.filter(q => isQuestionAnswered(q.id)).length}
                </span>
                <span className="badge bg-warning text-dark fs-6">
                  <span className="d-none d-sm-inline">Осталось: </span>
                  <span className="d-sm-none">Ост.: </span>
                  {test.questions.filter(q => !isQuestionAnswered(q.id)).length}
                </span>
              </div>
            </div>
          </div>

          {/* Вопросы */}
          <div className="card shadow-sm">
            <div className="card-body p-4">
              {test.questions.map((question, questionIndex) => (
                <div key={question.id} id={`question-${question.id}`} className="mb-5">
                  <div className="card border-0 bg-light">
                    <div className="card-body">
                      <div className="d-flex align-items-start gap-3 mb-3">
                        {question.image_path && (
                          <img
                            src={question.image_path}
                            alt="Question"
                            className="img-thumbnail d-none d-sm-block"
                            style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                          />
                        )}
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center gap-2 mb-3">
                            <h5 className="card-title fw-bold text-dark mb-0">
                              Вопрос {questionIndex + 1}
                            </h5>
                            {isQuestionAnswered(question.id) && (
                              <span className="badge bg-success">
                                ✅ Отвечен
                              </span>
                            )}
                          </div>
                          <p className="card-text fs-5 mb-3">
                            {question.text}
                          </p>
                        </div>
                      </div>

                      <div className="ms-0">
                        <h6 className="fw-semibold text-muted mb-3">
                          Выберите правильные ответы:
                        </h6>
                        <div className="row g-2">
                          {question.answers.map((answer) => (
                            <div key={answer.id} className="col-12">
                              <div className="form-check p-3 border">
                                <input
                                  type="checkbox"
                                  id={`q${question.id}_a${answer.id}`}
                                  className="form-check-input"
                                  onChange={(e) => handleAnswerChange(question.id, answer.id, e.target.checked)}
                                  checked={answers[question.id]?.includes(answer.id) || false}
                                />
                                <label 
                                  htmlFor={`q${question.id}_a${answer.id}`}
                                  className="form-check-label w-100"
                                >
                                  <span className="fs-6">{answer.text}</span>
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Кнопка отправки */}
              <div className="text-center mt-4">
                {error && (
                  <div className="alert alert-danger mb-3" role="alert">
                    {error}
                  </div>
                )}
                
                <button 
                  onClick={isAllQuestionsAnswered() ? submit : scrollToFirstUnanswered}
                  disabled={submitting}
                  className={`btn btn-lg px-5 ${
                    isAllQuestionsAnswered() 
                      ? 'btn-success' 
                      : 'btn-primary'
                  }`}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Отправка...
                    </>
                  ) : isAllQuestionsAnswered() ? (
                    '📤 Отправить тест'
                  ) : (
                    '🔍 Ответьте на все вопросы'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

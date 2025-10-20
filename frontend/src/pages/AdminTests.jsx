import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../hooks/useConfirm';

export default function AdminTests() {
  const { showSuccess, showError } = useToast();
  const { confirm, ConfirmModalComponent } = useConfirm();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTest, setEditingTest] = useState(null);

  // Поиск и сортировка
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('title'); // title, id
  const [sortOrder, setSortOrder] = useState('asc'); // asc, desc

  // Форма создания/редактирования
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_path: '',
    max_errors_allowed: 0,
    questions: [
      {
        text: '',
        image_path: '',
        answers: [
          { text: '', is_correct: false },
          { text: '', is_correct: false }
        ]
      }
    ]
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [questionImages, setQuestionImages] = useState({});

  useEffect(() => {
    checkAuthAndFetchTests();
  }, []);

  const checkAuthAndFetchTests = async () => {
    try {
      // Проверяем авторизацию
      await api.get('/auth/me');
      fetchTests();
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Ошибка авторизации. Пожалуйста, войдите в систему заново.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        fetchTests();
      }
    }
  };

  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tests/');
      setTests(response.data);
    } catch (err) {
      setError('Ошибка загрузки тестов');
      console.error('Error fetching tests:', err);
    } finally {
      setLoading(false);
    }
  };

  // Функции фильтрации и сортировки
  const filteredAndSortedTests = () => {
    let filtered = tests.filter(test => {
      const matchesSearch = test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           test.description?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });

    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'id':
          aValue = a.id;
          bValue = b.id;
          break;
        default:
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Название обязательно для заполнения';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Описание обязательно для заполнения';
    }

    // Проверка вопросов
    if (formData.questions.length === 0) {
      errors.questions = 'Добавьте хотя бы один вопрос';
    }

    formData.questions.forEach((question, qIndex) => {
      if (!question.text.trim()) {
        errors[`question_${qIndex}_text`] = 'Текст вопроса обязателен';
      }
      
      const correctAnswers = question.answers.filter(answer => answer.is_correct);
      if (correctAnswers.length === 0) {
        errors[`question_${qIndex}_correct`] = 'Выберите хотя бы один правильный ответ';
      }
      
      if (question.answers.length < 2) {
        errors[`question_${qIndex}_answers`] = 'Добавьте минимум 2 варианта ответа';
      }
    });

    // Проверка URL изображения если указан
    if (formData.image_path && !isValidUrl(formData.image_path)) {
      errors.image_path = 'Введите корректный URL изображения';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setFormErrors({});
    
    try {
      if (editingTest) {
        await api.put(`/tests/${editingTest.id}`, formData);
        setShowEditModal(false);
      } else {
        await api.post('/tests/', formData);
        setShowCreateModal(false);
      }
      setEditingTest(null);
      resetForm();
      fetchTests();
    } catch (err) {
      console.error('Error saving test:', err);
      
      // Обработка ошибок аутентификации
      if (err.response?.status === 401) {
        setFormErrors({ general: 'Ошибка авторизации. Пожалуйста, войдите в систему заново.' });
        // Перенаправляем на страницу логина
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }
      
      // Обработка ошибок валидации от сервера
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          const serverErrors = {};
          err.response.data.detail.forEach(error => {
            if (error.loc && error.loc.length > 1) {
              const field = error.loc[1];
              serverErrors[field] = error.msg;
            }
          });
          setFormErrors(serverErrors);
        } else {
          setFormErrors({ general: err.response.data.detail });
        }
      } else {
        setFormErrors({ general: 'Ошибка сохранения теста' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (test) => {
    setEditingTest(test);
    const questions = test.questions || [
      {
        text: '',
        image_path: '',
        answers: [
          { text: '', is_correct: false },
          { text: '', is_correct: false }
        ]
      }
    ];
    
    setFormData({
      title: test.title || '',
      description: test.description || '',
      image_path: test.image_path || '',
      max_errors_allowed: test.max_errors_allowed || 0,
      questions: questions
    });
    
    // Устанавливаем превью изображений для вопросов
    const questionImagePreviews = {};
    questions.forEach((question, index) => {
      if (question.image_path) {
        questionImagePreviews[index] = question.image_path;
      }
    });
    setQuestionImages(questionImagePreviews);
    
    setImagePreview(test.image_path || null);
    setImageFile(null);
    setShowEditModal(true);
  };

  const handleDelete = async (id) => {
    const confirmed = await confirm({
      title: 'Удаление теста',
      message: 'Вы уверены, что хотите удалить этот тест? Это действие нельзя отменить.',
      confirmText: 'Удалить',
      cancelText: 'Отмена',
      type: 'danger'
    });

    if (confirmed) {
      try {
        await api.delete(`/tests/${id}`);
        fetchTests();
        showSuccess('Тест успешно удален');
      } catch (err) {
        setError('Ошибка удаления теста');
        console.error('Error deleting test:', err);
        showError('Ошибка при удалении теста');
      }
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
        setFormData({ ...formData, image_path: e.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleQuestionImageChange = (questionIndex, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newQuestions = [...formData.questions];
        newQuestions[questionIndex].image_path = e.target.result;
        setFormData({ ...formData, questions: newQuestions });
        
        setQuestionImages({
          ...questionImages,
          [questionIndex]: e.target.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      image_path: '',
      max_errors_allowed: 0,
      questions: [
        {
          text: '',
          image_path: '',
          answers: [
            { text: '', is_correct: false },
            { text: '', is_correct: false }
          ]
        }
      ]
    });
    setFormErrors({});
    setEditingTest(null);
    setShowCreateModal(false);
    setShowEditModal(false);
    setIsSubmitting(false);
    setImageFile(null);
    setImagePreview(null);
    setQuestionImages({});
  };

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        {
          text: '',
          image_path: '',
          answers: [
            { text: '', is_correct: false },
            { text: '', is_correct: false }
          ]
        }
      ]
    });
  };

  const removeQuestion = (index) => {
    if (formData.questions.length > 1) {
      const newQuestions = formData.questions.filter((_, i) => i !== index);
      setFormData({ ...formData, questions: newQuestions });
    }
  };

  const addAnswer = (questionIndex) => {
    const newQuestions = [...formData.questions];
    newQuestions[questionIndex].answers.push({ text: '', is_correct: false });
    setFormData({ ...formData, questions: newQuestions });
  };

  const removeAnswer = (questionIndex, answerIndex) => {
    const newQuestions = [...formData.questions];
    newQuestions[questionIndex].answers.splice(answerIndex, 1);
    setFormData({ ...formData, questions: newQuestions });
  };

  const updateQuestion = (questionIndex, field, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[questionIndex][field] = value;
    setFormData({ ...formData, questions: newQuestions });
    
    // Если обновляется image_path, обновляем превью
    if (field === 'image_path') {
      setQuestionImages({
        ...questionImages,
        [questionIndex]: value
      });
    }
  };

  const updateAnswer = (questionIndex, answerIndex, field, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[questionIndex].answers[answerIndex][field] = value;
    setFormData({ ...formData, questions: newQuestions });
  };

  if (loading) {
    return (
      <div className="container-fluid vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-success mb-3" role="status">
            <span className="visually-hidden">Загрузка...</span>
          </div>
          <p className="text-muted">Загрузка тестов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Заголовок */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="display-5 fw-bold text-success mb-2">
                📝 Управление тестами
              </h1>
              <p className="lead text-muted">Создавайте и редактируйте тесты для проверки знаний</p>
            </div>
            <div className="d-flex gap-2">
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  window.location.href = '/login';
                }}
                className="btn btn-outline-secondary"
              >
                🚪 Выйти
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-success btn-lg"
              >
                ➕ Создать тест
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Ошибки */}
      {error && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="alert alert-danger">
              <strong>⚠️ {error}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Панель поиска и фильтров */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="row g-3">
                {/* Поиск */}
                <div className="col-md-6">
                  <label htmlFor="search" className="form-label fw-semibold">
                    🔍 Поиск
                  </label>
                  <input
                    type="text"
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Поиск по названию или описанию..."
                    className="form-control"
                  />
                </div>

                {/* Сортировка */}
                <div className="col-md-3">
                  <label htmlFor="sortBy" className="form-label fw-semibold">
                    📊 Сортировка
                  </label>
                  <select
                    id="sortBy"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="form-select"
                  >
                    <option value="title">По названию</option>
                    <option value="id">По ID</option>
                  </select>
                </div>

                {/* Порядок сортировки */}
                <div className="col-md-3">
                  <label htmlFor="sortOrder" className="form-label fw-semibold">
                    🔄 Порядок
                  </label>
                  <select
                    id="sortOrder"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="form-select"
                  >
                    <option value="asc">По возрастанию</option>
                    <option value="desc">По убыванию</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Список тестов */}
      <div className="row">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-white">
              <h3 className="card-title mb-0">
                Тесты ({filteredAndSortedTests().length} из {tests.length})
              </h3>
            </div>
            <div className="card-body">
              {tests.length === 0 ? (
                <div className="text-center py-5">
                  <div className="display-1 mb-4 text-muted">📝</div>
                  <h3 className="h4 text-muted mb-3">Тесты не найдены</h3>
                  <p className="text-muted mb-4">Создайте первый тест</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn btn-success btn-lg"
                  >
                    ➕ Создать тест
                  </button>
                </div>
              ) : filteredAndSortedTests().length === 0 ? (
                <div className="text-center py-5">
                  <div className="display-1 mb-4 text-muted">🔍</div>
                  <h3 className="h4 text-muted mb-3">Тесты не найдены</h3>
                  <p className="text-muted mb-4">Попробуйте изменить параметры поиска</p>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                    }}
                    className="btn btn-outline-success"
                  >
                    🔄 Сбросить фильтры
                  </button>
                </div>
              ) : (
                <div className="row g-4">
                  {filteredAndSortedTests().map((test) => (
                    <div key={test.id} className="col-6 col-sm-4 col-md-3 col-lg-2">
                      <div className="card h-100 shadow-sm" style={{ aspectRatio: '1/1.3' }}>
                        {/* Изображение */}
                        <div className="position-relative" style={{ height: '55%' }}>
                          {test.image_path ? (
                            <img
                              src={test.image_path}
                              alt={test.title}
                              className="card-img-top h-100 object-fit-cover"
                            />
                          ) : (
                            <div className="card-img-top h-100 bg-light d-flex align-items-center justify-content-center">
                              <div className="display-4 text-muted opacity-50">
                                📝
                              </div>
                            </div>
                          )}
                          <span className="position-absolute top-0 start-0 m-1 badge bg-success" style={{ fontSize: '0.65rem' }}>
                            📝 Тест
                          </span>
                        </div>

                        {/* Информация */}
                        <div className="card-body p-2 d-flex flex-column" style={{ height: '45%' }}>
                          <h6 className="card-title text-center mb-1 text-truncate" style={{ fontSize: '0.8rem', fontWeight: '600' }}>
                            {test.title}
                          </h6>
                          <p className="text-center small text-muted mb-2">ID: #{test.id}</p>
                          <div className="text-center mb-2">
                            <span className="badge bg-success" style={{ fontSize: '0.65rem' }}>
                              {test.questions?.length || 0} вопросов
                            </span>
                          </div>
                          
                          {/* Действия */}
                          <div className="mt-auto">
                            <div className="d-grid gap-1">
                              <button
                                onClick={() => handleEdit(test)}
                                className="btn btn-outline-primary btn-sm"
                                style={{ fontSize: '0.65rem', padding: '0.15rem 0.3rem' }}
                              >
                                ✏️ Редактировать
                              </button>
                              <button
                                onClick={() => handleDelete(test.id)}
                                className="btn btn-outline-danger btn-sm"
                                style={{ fontSize: '0.65rem', padding: '0.15rem 0.3rem' }}
                              >
                                🗑️ Удалить
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно создания теста */}
      {showCreateModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">➕ Создать новый тест</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={resetForm}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {/* Общие ошибки */}
                  {formErrors.general && (
                    <div className="alert alert-danger mb-3">
                      <strong>⚠️ {formErrors.general}</strong>
                    </div>
                  )}

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label htmlFor="title" className="form-label fw-semibold">
                        📝 Название теста *
                      </label>
                      <input
                        type="text"
                        id="title"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className={`form-control ${formErrors.title ? 'is-invalid' : ''}`}
                        placeholder="Введите название теста"
                      />
                      {formErrors.title && (
                        <div className="invalid-feedback">
                          {formErrors.title}
                        </div>
                      )}
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="image_path" className="form-label fw-semibold">
                        🖼️ Изображение
                      </label>
                      <div className="mb-2">
                        <input
                          type="file"
                          id="image_file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="form-control"
                        />
                        <div className="form-text">Или введите URL изображения:</div>
                      </div>
                      <input
                        type="url"
                        id="image_path"
                        value={formData.image_path}
                        onChange={(e) => {
                          setFormData({ ...formData, image_path: e.target.value });
                          setImagePreview(e.target.value);
                        }}
                        className={`form-control ${formErrors.image_path ? 'is-invalid' : ''}`}
                        placeholder="https://example.com/image.jpg"
                      />
                      {formErrors.image_path && (
                        <div className="invalid-feedback">
                          {formErrors.image_path}
                        </div>
                      )}
                      {imagePreview && (
                        <div className="mt-2">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="img-thumbnail"
                            style={{ maxWidth: '200px', maxHeight: '150px' }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="col-md-8">
                      <label htmlFor="description" className="form-label fw-semibold">
                        📄 Описание теста *
                      </label>
                      <textarea
                        id="description"
                        required
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className={`form-control ${formErrors.description ? 'is-invalid' : ''}`}
                        placeholder="Описание теста"
                      />
                      {formErrors.description && (
                        <div className="invalid-feedback">
                          {formErrors.description}
                        </div>
                      )}
                    </div>

                    <div className="col-md-4">
                      <label htmlFor="max_errors_allowed" className="form-label fw-semibold">
                        ⚠️ Допустимые ошибки
                      </label>
                      <div className="mb-2">
                        <input
                          type="range"
                          className="form-range"
                          min="0"
                          max="10"
                          value={formData.max_errors_allowed}
                          onChange={(e) => setFormData({ ...formData, max_errors_allowed: parseInt(e.target.value) })}
                          id="max_errors_allowed"
                        />
                        <div className="d-flex justify-content-between">
                          <small className="text-muted">0</small>
                          <small className="text-muted">10</small>
                        </div>
                      </div>
                      <div className="text-center">
                        <span className="badge bg-warning fs-6">
                          {formData.max_errors_allowed} ошибок
                        </span>
                      </div>
                      <div className="form-text text-center">
                        Максимальное количество ошибок для прохождения теста
                      </div>
                    </div>
                  </div>

                  {/* Вопросы */}
                  <div className="mt-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bold mb-0">❓ Вопросы</h6>
                      <button
                        type="button"
                        onClick={addQuestion}
                        className="btn btn-success btn-sm"
                      >
                        ➕ Добавить вопрос
                      </button>
                    </div>

                    {formData.questions.map((question, questionIndex) => (
                      <div key={questionIndex} className="card border mb-3">
                        <div className="card-header bg-light">
                          <div className="d-flex justify-content-between align-items-center">
                            <h6 className="mb-0">Вопрос {questionIndex + 1}</h6>
                            {formData.questions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeQuestion(questionIndex)}
                                className="btn btn-outline-danger btn-sm"
                              >
                                🗑️ Удалить
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="card-body">
                          <div className="mb-3">
                            <label className="form-label fw-semibold">
                              Текст вопроса *
                            </label>
                            <input
                              type="text"
                              required
                              value={question.text}
                              onChange={(e) => updateQuestion(questionIndex, 'text', e.target.value)}
                              className={`form-control ${formErrors[`question_${questionIndex}_text`] ? 'is-invalid' : ''}`}
                              placeholder="Введите текст вопроса"
                            />
                            {formErrors[`question_${questionIndex}_text`] && (
                              <div className="invalid-feedback">
                                {formErrors[`question_${questionIndex}_text`]}
                              </div>
                            )}
                          </div>

                          <div className="mb-3">
                            <label className="form-label fw-semibold">
                              🖼️ Изображение к вопросу
                            </label>
                            <div className="mb-2">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleQuestionImageChange(questionIndex, e)}
                                className="form-control"
                              />
                              <div className="form-text">Или введите URL изображения:</div>
                            </div>
                            <input
                              type="url"
                              value={question.image_path || ''}
                              onChange={(e) => updateQuestion(questionIndex, 'image_path', e.target.value)}
                              className="form-control"
                              placeholder="https://example.com/image.jpg"
                            />
                            {questionImages[questionIndex] && (
                              <div className="mt-2">
                                <img
                                  src={questionImages[questionIndex]}
                                  alt="Preview"
                                  className="img-thumbnail"
                                  style={{ maxWidth: '200px', maxHeight: '150px' }}
                                />
                              </div>
                            )}
                          </div>

                          <div>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <div>
                                <label className="form-label fw-semibold mb-0">
                                  Варианты ответов
                                </label>
                                <div className="form-text small">
                                  💡 Можно выбрать несколько правильных ответов
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => addAnswer(questionIndex)}
                                className="btn btn-outline-primary btn-sm"
                              >
                                ➕ Добавить ответ
                              </button>
                            </div>

                            {question.answers.map((answer, answerIndex) => (
                              <div key={answerIndex} className="d-flex align-items-center gap-2 mb-2">
                                <input
                                  type="text"
                                  value={answer.text}
                                  onChange={(e) => updateAnswer(questionIndex, answerIndex, 'text', e.target.value)}
                                  className="form-control"
                                  placeholder="Вариант ответа"
                                />
                                <div className="form-check">
                                  <input
                                    type="checkbox"
                                    checked={answer.is_correct}
                                    onChange={(e) => {
                                      const newQuestions = [...formData.questions];
                                      newQuestions[questionIndex].answers[answerIndex].is_correct = e.target.checked;
                                      setFormData({ ...formData, questions: newQuestions });
                                    }}
                                    className="form-check-input"
                                  />
                                  <label className="form-check-label small">
                                    Правильный
                                  </label>
                                </div>
                                {question.answers.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => removeAnswer(questionIndex, answerIndex)}
                                    className="btn btn-outline-danger btn-sm"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            ))}
                            {formErrors[`question_${questionIndex}_correct`] && (
                              <div className="text-danger small">
                                {formErrors[`question_${questionIndex}_correct`]}
                              </div>
                            )}
                            {formErrors[`question_${questionIndex}_answers`] && (
                              <div className="text-danger small">
                                {formErrors[`question_${questionIndex}_answers`]}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={resetForm}
                    disabled={isSubmitting}
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Создание...
                      </>
                    ) : (
                      '➕ Создать тест'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно редактирования теста */}
      {showEditModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">✏️ Редактировать тест</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={resetForm}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {/* Общие ошибки */}
                  {formErrors.general && (
                    <div className="alert alert-danger mb-3">
                      <strong>⚠️ {formErrors.general}</strong>
                    </div>
                  )}

                  {/* Предварительный просмотр теста */}
                  <div className="row mb-4">
                    <div className="col-12">
                      <h6 className="fw-bold mb-3">👁️ Предварительный просмотр:</h6>
                      <div className="card border">
                        <div className="row g-0">
                          <div className="col-md-4">
                            <div className="position-relative" style={{ height: '150px' }}>
                              {formData.image_path ? (
                                <img
                                  src={formData.image_path}
                                  alt="Preview"
                                  className="img-fluid h-100 w-100 object-fit-cover"
                                />
                              ) : (
                                <div className="h-100 bg-light d-flex align-items-center justify-content-center">
                                  <div className="display-4 text-muted opacity-50">📝</div>
                                </div>
                              )}
                              <span className="position-absolute top-0 start-0 m-2 badge bg-success">
                                📝 Тест
                              </span>
                            </div>
                          </div>
                          <div className="col-md-8">
                            <div className="card-body">
                              <h5 className="card-title">{formData.title || 'Название теста'}</h5>
                              <p className="card-text">{formData.description || 'Описание теста'}</p>
                              <p className="card-text">
                                <small className="text-muted">
                                  {formData.questions.length} вопросов
                                </small>
                                <br />
                                <small className="text-muted">
                                  Допустимо ошибок: {formData.max_errors_allowed}
                                </small>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Предварительный просмотр вопросов */}
                      {formData.questions.length > 0 && (
                        <div className="mt-3">
                          <h6 className="fw-bold mb-2">📋 Предварительный просмотр вопросов:</h6>
                          <div className="row g-2">
                            {formData.questions.map((question, qIndex) => (
                              <div key={qIndex} className="col-12 col-md-6">
                                <div className="card border">
                                  <div className="card-body p-2">
                                    <div className="d-flex align-items-start gap-2">
                                      {question.image_path && (
                                        <img
                                          src={question.image_path}
                                          alt="Question"
                                          className="img-thumbnail"
                                          style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                                        />
                                      )}
                                      <div className="flex-grow-1">
                                        <h6 className="card-title mb-1" style={{ fontSize: '0.8rem' }}>
                                          Вопрос {qIndex + 1}
                                        </h6>
                                        <p className="card-text small mb-1">
                                          {question.text || 'Текст вопроса...'}
                                        </p>
                                        <small className="text-muted">
                                          {question.answers?.length || 0} вариантов ответа
                                          {question.answers && (
                                            <span className="ms-2">
                                              ({question.answers.filter(a => a.is_correct).length} правильных)
                                            </span>
                                          )}
                                        </small>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label htmlFor="edit_title" className="form-label fw-semibold">
                        📝 Название теста *
                      </label>
                      <input
                        type="text"
                        id="edit_title"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className={`form-control ${formErrors.title ? 'is-invalid' : ''}`}
                        placeholder="Введите название теста"
                      />
                      {formErrors.title && (
                        <div className="invalid-feedback">
                          {formErrors.title}
                        </div>
                      )}
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="edit_image_path" className="form-label fw-semibold">
                        🖼️ Изображение
                      </label>
                      <div className="mb-2">
                        <input
                          type="file"
                          id="edit_image_file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="form-control"
                        />
                        <div className="form-text">Или введите URL изображения:</div>
                      </div>
                      <input
                        type="url"
                        id="edit_image_path"
                        value={formData.image_path}
                        onChange={(e) => {
                          setFormData({ ...formData, image_path: e.target.value });
                          setImagePreview(e.target.value);
                        }}
                        className={`form-control ${formErrors.image_path ? 'is-invalid' : ''}`}
                        placeholder="https://example.com/image.jpg"
                      />
                      {formErrors.image_path && (
                        <div className="invalid-feedback">
                          {formErrors.image_path}
                        </div>
                      )}
                    </div>

                    <div className="col-md-8">
                      <label htmlFor="edit_description" className="form-label fw-semibold">
                        📄 Описание теста *
                      </label>
                      <textarea
                        id="edit_description"
                        required
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className={`form-control ${formErrors.description ? 'is-invalid' : ''}`}
                        placeholder="Описание теста"
                      />
                      {formErrors.description && (
                        <div className="invalid-feedback">
                          {formErrors.description}
                        </div>
                      )}
                    </div>

                    <div className="col-md-4">
                      <label htmlFor="edit_max_errors_allowed" className="form-label fw-semibold">
                        ⚠️ Допустимые ошибки
                      </label>
                      <div className="mb-2">
                        <input
                          type="range"
                          className="form-range"
                          min="0"
                          max="10"
                          value={formData.max_errors_allowed}
                          onChange={(e) => setFormData({ ...formData, max_errors_allowed: parseInt(e.target.value) })}
                          id="edit_max_errors_allowed"
                        />
                        <div className="d-flex justify-content-between">
                          <small className="text-muted">0</small>
                          <small className="text-muted">10</small>
                        </div>
                      </div>
                      <div className="text-center">
                        <span className="badge bg-warning fs-6">
                          {formData.max_errors_allowed} ошибок
                        </span>
                      </div>
                      <div className="form-text text-center">
                        Максимальное количество ошибок для прохождения теста
                      </div>
                    </div>
                  </div>

                  {/* Вопросы */}
                  <div className="mt-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bold mb-0">❓ Вопросы</h6>
                      <button
                        type="button"
                        onClick={addQuestion}
                        className="btn btn-success btn-sm"
                      >
                        ➕ Добавить вопрос
                      </button>
                    </div>

                    {formData.questions.map((question, questionIndex) => (
                      <div key={questionIndex} className="card border mb-3">
                        <div className="card-header bg-light">
                          <div className="d-flex justify-content-between align-items-center">
                            <h6 className="mb-0">Вопрос {questionIndex + 1}</h6>
                            {formData.questions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeQuestion(questionIndex)}
                                className="btn btn-outline-danger btn-sm"
                              >
                                🗑️ Удалить
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="card-body">
                          <div className="mb-3">
                            <label className="form-label fw-semibold">
                              Текст вопроса *
                            </label>
                            <input
                              type="text"
                              required
                              value={question.text}
                              onChange={(e) => updateQuestion(questionIndex, 'text', e.target.value)}
                              className={`form-control ${formErrors[`question_${questionIndex}_text`] ? 'is-invalid' : ''}`}
                              placeholder="Введите текст вопроса"
                            />
                            {formErrors[`question_${questionIndex}_text`] && (
                              <div className="invalid-feedback">
                                {formErrors[`question_${questionIndex}_text`]}
                              </div>
                            )}
                          </div>

                          <div className="mb-3">
                            <label className="form-label fw-semibold">
                              🖼️ Изображение к вопросу
                            </label>
                            <div className="mb-2">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleQuestionImageChange(questionIndex, e)}
                                className="form-control"
                              />
                              <div className="form-text">Или введите URL изображения:</div>
                            </div>
                            <input
                              type="url"
                              value={question.image_path || ''}
                              onChange={(e) => updateQuestion(questionIndex, 'image_path', e.target.value)}
                              className="form-control"
                              placeholder="https://example.com/image.jpg"
                            />
                            {questionImages[questionIndex] && (
                              <div className="mt-2">
                                <img
                                  src={questionImages[questionIndex]}
                                  alt="Preview"
                                  className="img-thumbnail"
                                  style={{ maxWidth: '200px', maxHeight: '150px' }}
                                />
                              </div>
                            )}
                          </div>

                          <div>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <div>
                                <label className="form-label fw-semibold mb-0">
                                  Варианты ответов
                                </label>
                                <div className="form-text small">
                                  💡 Можно выбрать несколько правильных ответов
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => addAnswer(questionIndex)}
                                className="btn btn-outline-primary btn-sm"
                              >
                                ➕ Добавить ответ
                              </button>
                            </div>

                            {question.answers.map((answer, answerIndex) => (
                              <div key={answerIndex} className="d-flex align-items-center gap-2 mb-2">
                                <input
                                  type="text"
                                  value={answer.text}
                                  onChange={(e) => updateAnswer(questionIndex, answerIndex, 'text', e.target.value)}
                                  className="form-control"
                                  placeholder="Вариант ответа"
                                />
                                <div className="form-check">
                                  <input
                                    type="checkbox"
                                    checked={answer.is_correct}
                                    onChange={(e) => {
                                      const newQuestions = [...formData.questions];
                                      newQuestions[questionIndex].answers[answerIndex].is_correct = e.target.checked;
                                      setFormData({ ...formData, questions: newQuestions });
                                    }}
                                    className="form-check-input"
                                  />
                                  <label className="form-check-label small">
                                    Правильный
                                  </label>
                                </div>
                                {question.answers.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => removeAnswer(questionIndex, answerIndex)}
                                    className="btn btn-outline-danger btn-sm"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            ))}
                            {formErrors[`question_${questionIndex}_correct`] && (
                              <div className="text-danger small">
                                {formErrors[`question_${questionIndex}_correct`]}
                              </div>
                            )}
                            {formErrors[`question_${questionIndex}_answers`] && (
                              <div className="text-danger small">
                                {formErrors[`question_${questionIndex}_answers`]}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={resetForm}
                    disabled={isSubmitting}
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Сохранение...
                      </>
                    ) : (
                      '💾 Сохранить изменения'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      <ConfirmModalComponent />
    </div>
  );
}
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
    questions_per_test: 0,
    time_limit: null,
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

  // База вопросов для текущего теста
  const [questionPool, setQuestionPool] = useState([]);
  const [loadingPool, setLoadingPool] = useState(false);
  const [showPoolModal, setShowPoolModal] = useState(false);
  const [showQuestionPoolModal, setShowQuestionPoolModal] = useState(false);
  const [editingPoolQuestion, setEditingPoolQuestion] = useState(null);
  const [currentTestIdForPool, setCurrentTestIdForPool] = useState(null);
  const [questionPoolFormData, setQuestionPoolFormData] = useState({
    text: '',
    image_path: '',
    answers: [
      { text: '', is_correct: false },
      { text: '', is_correct: false }
    ]
  });
  const [questionPoolImageFile, setQuestionPoolImageFile] = useState(null);
  const [questionPoolImagePreview, setQuestionPoolImagePreview] = useState(null);

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

  const fetchQuestionPool = async (testId) => {
    if (!testId) return;
    try {
      setLoadingPool(true);
      const response = await api.get(`/tests/${testId}/questions/pool`);
      setQuestionPool(response.data);
    } catch (err) {
      console.error('Error fetching question pool:', err);
      showError('Ошибка загрузки базы вопросов');
    } finally {
      setLoadingPool(false);
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

    // Вопросы теперь добавляются только через базу вопросов

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
      // Вопросы теперь управляются через базу вопросов отдельно
      // При обновлении теста не отправляем questions, чтобы не удалить существующие вопросы
      if (editingTest) {
        const { questions, ...testData } = formData; // Исключаем questions при обновлении
        await api.put(`/tests/${editingTest.id}`, testData);
        setShowEditModal(false);
      } else {
        // При создании нового теста отправляем пустой массив questions
        const testData = {
          ...formData,
          questions: []
        };
        await api.post('/tests/', testData);
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
    
    setFormData({
      title: test.title || '',
      description: test.description || '',
      image_path: test.image_path || '',
      max_errors_allowed: test.max_errors_allowed || 0,
      questions_per_test: test.questions_per_test || 0,
      time_limit: test.time_limit || null,
      questions: []  // Вопросы теперь только в базе вопросов
    });
    
    setImagePreview(test.image_path || null);
    setImageFile(null);
    setQuestionImages({});
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
      questions_per_test: 0,
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

  // Функции для работы с базой вопросов
  const handleCreatePoolQuestion = async () => {
    if (!currentTestIdForPool) return;
    try {
      // Создаем вопрос без изображения
      const response = await api.post(`/tests/${currentTestIdForPool}/questions/pool`, questionPoolFormData);
      const questionId = response.data.id;
      
      // Загружаем изображение если оно есть
      if (questionPoolImageFile) {
        const formData = new FormData();
        formData.append('file', questionPoolImageFile);
        await api.post(`/tests/${currentTestIdForPool}/questions/pool/${questionId}/upload-image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      showSuccess('Вопрос добавлен в базу');
      fetchQuestionPool(currentTestIdForPool);
      setQuestionPoolFormData({
        text: '',
        image_path: '',
        answers: [
          { text: '', is_correct: false },
          { text: '', is_correct: false }
        ]
      });
      setQuestionPoolImageFile(null);
      setQuestionPoolImagePreview(null);
      setShowQuestionPoolModal(false);
      setEditingPoolQuestion(null);
    } catch (err) {
      console.error('Error creating pool question:', err);
      showError('Ошибка при создании вопроса');
    }
  };

  const handleUpdatePoolQuestion = async () => {
    if (!currentTestIdForPool || !editingPoolQuestion) return;
    try {
      // Обновляем вопрос
      await api.put(`/tests/${currentTestIdForPool}/questions/pool/${editingPoolQuestion.id}`, questionPoolFormData);
      
      // Загружаем изображение если оно есть
      if (questionPoolImageFile) {
        const formData = new FormData();
        formData.append('file', questionPoolImageFile);
        await api.post(`/tests/${currentTestIdForPool}/questions/pool/${editingPoolQuestion.id}/upload-image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      showSuccess('Вопрос обновлен');
      fetchQuestionPool(currentTestIdForPool);
      setQuestionPoolFormData({
        text: '',
        image_path: '',
        answers: [
          { text: '', is_correct: false },
          { text: '', is_correct: false }
        ]
      });
      setQuestionPoolImageFile(null);
      setQuestionPoolImagePreview(null);
      setShowQuestionPoolModal(false);
      setEditingPoolQuestion(null);
    } catch (err) {
      console.error('Error updating pool question:', err);
      showError('Ошибка при обновлении вопроса');
    }
  };

  const handleDeletePoolQuestion = async (id) => {
    if (!currentTestIdForPool) return;
    const confirmed = await confirm({
      title: 'Удаление вопроса',
      message: 'Вы уверены, что хотите удалить этот вопрос из базы?',
      confirmText: 'Удалить',
      cancelText: 'Отмена',
      type: 'danger'
    });

    if (confirmed) {
      try {
        await api.delete(`/tests/${currentTestIdForPool}/questions/pool/${id}`);
        showSuccess('Вопрос удален из базы');
        fetchQuestionPool(currentTestIdForPool);
      } catch (err) {
        console.error('Error deleting pool question:', err);
        showError('Ошибка при удалении вопроса');
      }
    }
  };

  const handleEditPoolQuestion = (question) => {
    setEditingPoolQuestion(question);
    setQuestionPoolFormData({
      text: question.text || '',
      image_path: question.image_path || '',
      answers: question.answers.map(a => ({
        text: a.text || '',
        is_correct: a.is_correct || false
      }))
    });
    setQuestionPoolImageFile(null);
    setQuestionPoolImagePreview(question.image_path || null);
    setShowQuestionPoolModal(true);
  };

  const handleAddPoolQuestion = () => {
    setEditingPoolQuestion(null);
    setQuestionPoolFormData({
      text: '',
      image_path: '',
      answers: [
        { text: '', is_correct: false },
        { text: '', is_correct: false }
      ]
    });
    setQuestionPoolImageFile(null);
    setQuestionPoolImagePreview(null);
    setShowQuestionPoolModal(true);
  };

  const handleQuestionPoolImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setQuestionPoolImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setQuestionPoolImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenPoolModal = (testId) => {
    setCurrentTestIdForPool(testId);
    setShowPoolModal(true);
    fetchQuestionPool(testId);
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
              <h1 className="display-5 fw-bold text-primary mb-2">
                📝 Управление тестами
              </h1>
              <p className="lead text-muted">Создавайте и редактируйте тесты для проверки знаний</p>
            </div>
            <div className="d-flex gap-2">
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary btn-lg"
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

      {/* Панель поиска/фильтров (новый дизайн) */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <div className="d-flex flex-wrap gap-2 align-items-center">
                <div className="flex-grow-1">
                  <div className="input-group">
                    <span className="input-group-text bg-white">🔍</span>
                  <input
                    type="text"
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Поиск по названию или описанию..."
                    className="form-control"
                  />
                </div>
                </div>
                <div>
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
                <div>
                  <select
                    id="sortOrder"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="form-select"
                  >
                    <option value="asc">↑ По возрастанию</option>
                    <option value="desc">↓ По убыванию</option>
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
                <div className="row g-3 g-md-4">
                  {filteredAndSortedTests().map((test) => (
                    <div key={test.id} className="col-12 col-sm-6 col-lg-4">
                      <div className="card border-0 shadow-sm h-100">
                        <div className="card-body p-3 p-md-4 text-center">
                          <h5 className="card-title mb-3">{test.title}</h5>
                          <p className="card-text text-muted mb-4">{test.description || 'Описание теста отсутствует'}</p>
                          <div className="d-flex justify-content-center gap-2 mb-3 flex-wrap">
                            <span className="badge bg-primary">{test.questions?.length || 0} вопросов</span>
                            {test.questions_per_test > 0 && (
                              <span className="badge bg-info">Случайно: {test.questions_per_test}</span>
                            )}
                        </div>
                          <div className="d-flex flex-column flex-sm-row gap-2 justify-content-center">
                              <button
                              className="btn btn-sm btn-outline-primary flex-fill"
                                onClick={() => handleEdit(test)}
                              >
                              Редактировать
                              </button>
                              <button
                              className="btn btn-sm btn-outline-info flex-fill"
                              onClick={() => handleOpenPoolModal(test.id)}
                            >
                              База вопросов
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-danger flex-fill"
                                onClick={() => handleDelete(test.id)}
                              >
                              Удалить
                              </button>
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
                        <input
                        type="number"
                        id="max_errors_allowed"
                          min="0"
                          max="10"
                          value={formData.max_errors_allowed}
                        onChange={(e) => setFormData({ ...formData, max_errors_allowed: parseInt(e.target.value) || 0 })}
                        className="form-control"
                        placeholder="0"
                      />
                      <div className="form-text">
                        Максимальное количество ошибок для прохождения теста
                      </div>
                    </div>
                  </div>

                  {/* База вопросов */}
                  <div className="mt-4">
                          <div className="mb-3">
                      <label htmlFor="questions_per_test" className="form-label fw-semibold">
                        Количество вопросов
                            </label>
                            <input
                        type="number"
                        id="questions_per_test"
                        min="0"
                        value={formData.questions_per_test || 0}
                        onChange={(e) => setFormData({ ...formData, questions_per_test: parseInt(e.target.value) || 0 })}
                                className="form-control"
                        placeholder="0"
                              />
                      <small className="text-muted">0 = все вопросы</small>
                    </div>
                    
                    <div className="mb-3">
                      <label htmlFor="time_limit" className="form-label fw-semibold">
                        ⏱️ Ограничение по времени (секунды)
                      </label>
                      <input
                        type="number"
                        id="time_limit"
                        min="0"
                        value={formData.time_limit || ''}
                        onChange={(e) => setFormData({ ...formData, time_limit: e.target.value ? parseInt(e.target.value) : null })}
                        className="form-control"
                        placeholder="Без ограничения"
                      />
                      <small className="text-muted">Оставьте пустым для теста без ограничения по времени</small>
                    </div>
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
                    className="btn btn-primary"
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

                  {/* Новый макет: превью слева, форма справа */}
                  <div className="row g-4 mb-3">
                    {/* Превью */}
                    <div className="col-lg-5">
                      <div className="card shadow-sm border-0">
                        <div className="card-header bg-white border-0">
                          <h6 className="mb-0 fw-bold">👁️ Предпросмотр</h6>
                        </div>
                        <div className="card-body">
                          <div className="position-relative overflow-hidden mb-3" style={{ height: '180px', background: '#f8f9fa' }}>
                              {formData.image_path ? (
                              <img src={formData.image_path} alt="Preview" className="w-100 h-100" style={{ objectFit: 'cover' }} />
                            ) : (
                              <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted display-6">📝</div>
                            )}
                            <span className="position-absolute top-0 start-0 m-2 badge bg-primary">Тест</span>
                            </div>
                          <h5 className="fw-bold mb-1">{formData.title || 'Название теста'}</h5>
                          <p className="text-muted mb-2">{formData.description || 'Описание теста'}</p>
                          <div className="d-flex gap-2 flex-wrap">
                            <span className="badge bg-primary">{formData.questions.length} вопросов</span>
                            <span className="badge bg-warning text-dark">Допустимо ошибок: {formData.max_errors_allowed}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                    {/* Форма */}
                    <div className="col-lg-7">
                      <div className="card shadow-sm border-0">
                        <div className="card-header bg-white border-0">
                          <h6 className="mb-0 fw-bold">🛠️ Параметры теста</h6>
                                      </div>
                        <div className="card-body">
                          <div className="row g-3">
                            <div className="col-12">
                              <label htmlFor="edit_title" className="form-label fw-semibold">Название *</label>
                              <input type="text" id="edit_title" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className={`form-control ${formErrors.title ? 'is-invalid' : ''}`} placeholder="Введите название теста" />
                              {formErrors.title && (<div className="invalid-feedback">{formErrors.title}</div>)}
                                    </div>

                            <div className="col-12">
                              <label htmlFor="edit_image_path" className="form-label fw-semibold">Изображение</label>
                              <div className="mb-2">
                                <input type="file" id="edit_image_file" accept="image/*" onChange={handleImageChange} className="form-control" />
                                <div className="form-text">Или URL изображения:</div>
                                  </div>
                              <input type="url" id="edit_image_path" value={formData.image_path} onChange={(e) => { setFormData({ ...formData, image_path: e.target.value }); setImagePreview(e.target.value); }} className={`form-control ${formErrors.image_path ? 'is-invalid' : ''}`} placeholder="https://example.com/image.jpg" />
                              {formErrors.image_path && (<div className="invalid-feedback">{formErrors.image_path}</div>)}
                                </div>

                            <div className="col-12">
                              <label htmlFor="edit_description" className="form-label fw-semibold">Описание *</label>
                              <textarea id="edit_description" required rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className={`form-control ${formErrors.description ? 'is-invalid' : ''}`} placeholder="Описание теста" />
                              {formErrors.description && (<div className="invalid-feedback">{formErrors.description}</div>)}
                  </div>

                    <div className="col-md-6">
                              <label htmlFor="edit_max_errors_allowed" className="form-label fw-semibold">
                                ⚠️ Допустимые ошибки
                      </label>
                      <input
                                type="number"
                                id="edit_max_errors_allowed"
                                min="0"
                                max="10"
                                value={formData.max_errors_allowed}
                                onChange={(e) => setFormData({ ...formData, max_errors_allowed: parseInt(e.target.value) || 0 })}
                                className="form-control"
                                placeholder="0"
                              />
                              <div className="form-text">
                                Максимальное количество ошибок для прохождения теста
                        </div>
                    </div>

                    <div className="col-md-6">
                              <label htmlFor="edit_questions_per_test" className="form-label fw-semibold">
                                Количество вопросов
                              </label>
                              <input
                                type="number"
                                id="edit_questions_per_test"
                                min="0"
                                value={formData.questions_per_test || 0}
                                onChange={(e) => setFormData({ ...formData, questions_per_test: parseInt(e.target.value) || 0 })}
                                className="form-control"
                                placeholder="0"
                              />
                              <small className="text-muted">0 = все вопросы</small>
                            </div>
                            
                            <div className="mb-3">
                              <label htmlFor="edit_time_limit" className="form-label fw-semibold">
                                ⏱️ Ограничение по времени (секунды)
                              </label>
                              <input
                                type="number"
                                id="edit_time_limit"
                                min="0"
                                value={formData.time_limit || ''}
                                onChange={(e) => setFormData({ ...formData, time_limit: e.target.value ? parseInt(e.target.value) : null })}
                                className="form-control"
                                placeholder="Без ограничения"
                              />
                              <small className="text-muted">Оставьте пустым для теста без ограничения по времени</small>
                              <div className="form-text">
                                Если указано больше 0, при прохождении теста будет выбрано случайное количество вопросов из базы (без повторений). Если 0 - используются все вопросы из базы.
                      </div>
                        </div>
                    </div>
                        </div>
                    </div>
                        </div>
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
                    className="btn btn-primary"
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

      {/* Модальное окно управления базой вопросов */}
      {showPoolModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">📚 База вопросов теста</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowPoolModal(false);
                    setCurrentTestIdForPool(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                  <p className="mb-0 text-muted">Всего вопросов в базе: {questionPool.length}</p>
                      <button
                        type="button"
                    onClick={handleAddPoolQuestion}
                    className="btn btn-primary btn-sm"
                      >
                        ➕ Добавить вопрос
                      </button>
                    </div>

                {loadingPool ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Загрузка...</span>
                    </div>
                  </div>
                ) : questionPool.length === 0 ? (
                  <div className="text-center py-5">
                    <div className="display-1 mb-4 text-muted">📚</div>
                    <h5 className="text-muted mb-3">База вопросов пуста</h5>
                              <button
                                type="button"
                      onClick={handleAddPoolQuestion}
                      className="btn btn-primary"
                    >
                      ➕ Добавить первый вопрос
                    </button>
                  </div>
                ) : (
                  <div className="row g-3">
                    {questionPool.map((question) => (
                      <div key={question.id} className="col-md-6">
                        <div className="card border">
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <h6 className="mb-0">Вопрос #{question.id}</h6>
                              <div className="d-flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleEditPoolQuestion(question)}
                                  className="btn btn-outline-primary btn-sm"
                                >
                                  ✏️
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePoolQuestion(question.id)}
                                className="btn btn-outline-danger btn-sm"
                              >
                                  🗑️
                              </button>
                          </div>
                        </div>
                            <p className="mb-2">{question.text}</p>
                            {question.image_path && (
                              <img
                                src={question.image_path.startsWith('http') || question.image_path.startsWith('/uploads') 
                                  ? (question.image_path.startsWith('http') 
                                      ? question.image_path 
                                      : `${api.defaults.baseURL || 'http://localhost:8000'}${question.image_path}`)
                                  : question.image_path}
                                alt="Question"
                                className="img-thumbnail mb-2"
                                style={{ maxWidth: '100%', maxHeight: '150px', objectFit: 'contain' }}
                              />
                            )}
                            <div className="small text-muted">
                              Ответов: {question.answers?.length || 0}
                          </div>
                        </div>
                        </div>
                      </div>
                    ))}
                              </div>
                            )}
                          </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPoolModal(false)}
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно создания/редактирования вопроса в базе */}
      {showQuestionPoolModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  {editingPoolQuestion ? '✏️ Редактировать вопрос' : '➕ Добавить вопрос в базу'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowQuestionPoolModal(false);
                    setEditingPoolQuestion(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                          <div className="mb-3">
                  <label className="form-label fw-semibold">Текст вопроса *</label>
                  <textarea
                                className="form-control"
                    rows="3"
                    value={questionPoolFormData.text}
                    onChange={(e) => setQuestionPoolFormData({ ...questionPoolFormData, text: e.target.value })}
                              placeholder="Введите текст вопроса"
                            />
                          </div>

                          <div className="mb-3">
                  <label className="form-label fw-semibold">Изображение</label>
                            <div className="mb-2">
                              <input
                                type="file"
                                accept="image/*"
                      onChange={handleQuestionPoolImageChange}
                                className="form-control"
                              />
                              <div className="form-text">Или введите URL изображения:</div>
                            </div>
                            <input
                              type="url"
                              className="form-control"
                    value={questionPoolFormData.image_path}
                    onChange={(e) => {
                      setQuestionPoolFormData({ ...questionPoolFormData, image_path: e.target.value });
                      setQuestionPoolImagePreview(e.target.value);
                    }}
                              placeholder="https://example.com/image.jpg"
                            />
                  {questionPoolImagePreview && (
                              <div className="mt-2">
                                <img
                        src={questionPoolImagePreview}
                                  alt="Preview"
                                  className="img-thumbnail"
                                  style={{ maxWidth: '200px', maxHeight: '150px' }}
                                />
                              </div>
                            )}
                          </div>

                          <div>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label fw-semibold mb-0">Ответы *</label>
                              <button
                                type="button"
                      onClick={() => setQuestionPoolFormData({
                        ...questionPoolFormData,
                        answers: [...questionPoolFormData.answers, { text: '', is_correct: false }]
                      })}
                                className="btn btn-outline-primary btn-sm"
                              >
                                ➕ Добавить ответ
                              </button>
                            </div>
                  {questionPoolFormData.answers.map((answer, answerIndex) => (
                    <div key={answerIndex} className="mb-2 d-flex gap-2 align-items-center">
                                <input
                                  type="text"
                                  className="form-control"
                        value={answer.text}
                        onChange={(e) => {
                          const newAnswers = [...questionPoolFormData.answers];
                          newAnswers[answerIndex].text = e.target.value;
                          setQuestionPoolFormData({ ...questionPoolFormData, answers: newAnswers });
                        }}
                        placeholder="Текст ответа"
                                />
                                <div className="form-check">
                                  <input
                                    type="checkbox"
                          className="form-check-input"
                                    checked={answer.is_correct}
                                    onChange={(e) => {
                            const newAnswers = [...questionPoolFormData.answers];
                            newAnswers[answerIndex].is_correct = e.target.checked;
                            setQuestionPoolFormData({ ...questionPoolFormData, answers: newAnswers });
                          }}
                        />
                        <label className="form-check-label">Правильный</label>
                                </div>
                      {questionPoolFormData.answers.length > 2 && (
                                  <button
                                    type="button"
                          onClick={() => {
                            const newAnswers = questionPoolFormData.answers.filter((_, i) => i !== answerIndex);
                            setQuestionPoolFormData({ ...questionPoolFormData, answers: newAnswers });
                          }}
                                    className="btn btn-outline-danger btn-sm"
                                  >
                          🗑️
                                  </button>
                                )}
                              </div>
                            ))}
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                  onClick={() => {
                    setShowQuestionPoolModal(false);
                    setEditingPoolQuestion(null);
                  }}
                  >
                    Отмена
                  </button>
                  <button
                  type="button"
                  className="btn btn-primary"
                  onClick={editingPoolQuestion ? handleUpdatePoolQuestion : handleCreatePoolQuestion}
                >
                  {editingPoolQuestion ? '💾 Сохранить' : '➕ Добавить'}
                  </button>
                </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModalComponent />
    </div>
  );
}
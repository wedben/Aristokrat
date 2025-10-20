import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../hooks/useConfirm';

export default function AdminCards() {
  const { showSuccess, showError } = useToast();
  const { confirm, ConfirmModalComponent } = useConfirm();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCard, setEditingCard] = useState(null);

  // Поиск и сортировка
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name'); // name, category, id
  const [sortOrder, setSortOrder] = useState('asc'); // asc, desc
  const [categoryFilter, setCategoryFilter] = useState(''); // '', 'bar', 'kitchen', 'wine'

  // Форма создания/редактирования
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ingredients: '',
    category: '',
    image_path: '',
    // Поля для винных карточек
    taste: '',
    aroma: '',
    color: '',
    pairings: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      setLoading(true);
      const response = await api.get('/menu/');
      setCards(response.data);
    } catch (err) {
      setError('Ошибка загрузки карточек');
      console.error('Error fetching cards:', err);
    } finally {
      setLoading(false);
    }
  };

  // Функции фильтрации и сортировки
  const filteredAndSortedCards = () => {
    let filtered = cards.filter(card => {
      const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           card.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           card.ingredients?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !categoryFilter || card.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });

    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'category':
          aValue = a.category || '';
          bValue = b.category || '';
          break;
        case 'id':
          aValue = a.id;
          bValue = b.id;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
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
    
    if (!formData.name.trim()) {
      errors.name = 'Название обязательно для заполнения';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Описание обязательно для заполнения';
    }
    
    if (!formData.category) {
      errors.category = 'Выберите категорию';
    }

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
      if (editingCard) {
        await api.put(`/menu/${editingCard.id}`, formData);
        setShowEditModal(false);
      } else {
        await api.post('/menu/', formData);
        setShowCreateModal(false);
      }
      setEditingCard(null);
      setFormData({ name: '', description: '', ingredients: '', category: '', image_path: '' });
      setFormErrors({});
      fetchCards();
    } catch (err) {
      console.error('Error saving card:', err);
      
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
        setFormErrors({ general: 'Ошибка сохранения карточки' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (card) => {
    setEditingCard(card);
    setFormData({
      name: card.name || '',
      description: card.description || '',
      ingredients: card.ingredients || '',
      category: card.category || '',
      image_path: card.image_path || '',
      // Поля для винных карточек
      taste: card.taste || '',
      aroma: card.aroma || '',
      color: card.color || '',
      pairings: card.pairings || ''
    });
    setImagePreview(card.image_path || null);
    setImageFile(null);
    setShowEditModal(true);
  };

  const handleDelete = async (id) => {
    const confirmed = await confirm({
      title: 'Удаление карточки',
      message: 'Вы уверены, что хотите удалить эту карточку? Это действие нельзя отменить.',
      confirmText: 'Удалить',
      cancelText: 'Отмена',
      type: 'danger'
    });

    if (confirmed) {
      try {
        await api.delete(`/menu/${id}`);
        fetchCards();
        showSuccess('Карточка успешно удалена');
      } catch (err) {
        setError('Ошибка удаления карточки');
        console.error('Error deleting card:', err);
        showError('Ошибка при удалении карточки');
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

  const resetForm = () => {
    setFormData({ 
      name: '', 
      description: '', 
      ingredients: '', 
      category: '', 
      image_path: '',
      // Поля для винных карточек
      taste: '',
      aroma: '',
      color: '',
      pairings: ''
    });
    setFormErrors({});
    setEditingCard(null);
    setShowCreateModal(false);
    setShowEditModal(false);
    setIsSubmitting(false);
    setImageFile(null);
    setImagePreview(null);
  };

  if (loading) {
    return (
      <div className="container-fluid vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Загрузка...</span>
          </div>
          <p className="text-muted">Загрузка карточек...</p>
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
                📋 Управление карточками
              </h1>
              <p className="lead text-muted">Создавайте и редактируйте карточки меню</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary btn-lg"
            >
              ➕ Создать карточку
            </button>
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
                <div className="col-md-4">
                  <label htmlFor="search" className="form-label fw-semibold">
                    🔍 Поиск
                  </label>
                  <input
                    type="text"
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Поиск по названию, описанию, ингредиентам..."
                    className="form-control"
                  />
                </div>

                {/* Фильтр по категории */}
                <div className="col-md-3">
                  <label htmlFor="categoryFilter" className="form-label fw-semibold">
                    📂 Категория
                  </label>
                  <select
                    id="categoryFilter"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="form-select"
                  >
                    <option value="">Все категории</option>
                    <option value="bar">🍸 Бар</option>
                    <option value="kitchen">🍽️ Кухня</option>
                    <option value="wine">🍷 Винная карта</option>
                  </select>
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
                    <option value="name">По названию</option>
                    <option value="category">По категории</option>
                    <option value="id">По ID</option>
                  </select>
                </div>

                {/* Порядок сортировки */}
                <div className="col-md-2">
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

      {/* Список карточек */}
      <div className="row">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-white">
              <h3 className="card-title mb-0">
                Карточки ({filteredAndSortedCards().length} из {cards.length})
              </h3>
            </div>
            <div className="card-body">
              {cards.length === 0 ? (
                <div className="text-center py-5">
                  <div className="display-1 mb-4 text-muted">📋</div>
                  <h3 className="h4 text-muted mb-3">Карточки не найдены</h3>
                  <p className="text-muted mb-4">Создайте первую карточку меню</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn btn-primary btn-lg"
                  >
                    ➕ Создать карточку
                  </button>
                </div>
              ) : filteredAndSortedCards().length === 0 ? (
                <div className="text-center py-5">
                  <div className="display-1 mb-4 text-muted">🔍</div>
                  <h3 className="h4 text-muted mb-3">Карточки не найдены</h3>
                  <p className="text-muted mb-4">Попробуйте изменить параметры поиска</p>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setCategoryFilter('');
                    }}
                    className="btn btn-outline-primary"
                  >
                    🔄 Сбросить фильтры
                  </button>
                </div>
              ) : (
                <div className="row g-4">
                  {filteredAndSortedCards().map((card) => (
                    <div key={card.id} className="col-6 col-sm-4 col-md-3 col-lg-2">
                      <div className={`card h-100 shadow-sm ${card.is_learned ? 'border-success border-2' : 'border-light'}`} 
                           style={{ aspectRatio: '1/1.3' }}>
                        {/* Изображение */}
                        <div className="position-relative" style={{ height: '55%' }}>
                          {card.image_path ? (
                            <img
                              src={card.image_path}
                              alt={card.name}
                              className="card-img-top h-100 object-fit-cover"
                            />
                          ) : (
                            <div className="card-img-top h-100 bg-light d-flex align-items-center justify-content-center">
                              <div className="display-4 text-muted opacity-50">
                                {card.category === 'bar' ? '🍸' : card.category === 'kitchen' ? '🍽️' : '🍷'}
                              </div>
                            </div>
                          )}
                          {card.category && (
                            <span className={`position-absolute top-0 start-0 m-1 badge ${
                              card.category === 'bar' ? 'bg-primary' : card.category === 'kitchen' ? 'bg-success' : 'bg-warning'
                            }`} style={{ fontSize: '0.65rem' }}>
                              {card.category === 'bar' ? '🍸 Бар' : card.category === 'kitchen' ? '🍽️ Кухня' : '🍷 Винная карта'}
                            </span>
                          )}
                          {/* Индикатор изученности */}
                          {card.is_learned && (
                            <span className="position-absolute top-0 end-0 m-1 badge bg-success" style={{ fontSize: '0.65rem' }}>
                              ✅ Изучено
                            </span>
                          )}
                        </div>

                        {/* Информация */}
                        <div className="card-body p-2 d-flex flex-column" style={{ height: '45%' }}>
                          <h6 className="card-title text-center mb-1 text-truncate" style={{ fontSize: '0.8rem', fontWeight: '600' }}>
                            {card.name}
                          </h6>
                          <p className="text-center small text-muted mb-2">ID: #{card.id}</p>
                          
                          {/* Действия */}
                          <div className="mt-auto">
                            <div className="d-grid gap-1">
                              <button
                                onClick={() => handleEdit(card)}
                                className="btn btn-outline-primary btn-sm"
                                style={{ fontSize: '0.65rem', padding: '0.15rem 0.3rem' }}
                              >
                                ✏️ Редактировать
                              </button>
                              <button
                                onClick={() => handleDelete(card.id)}
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

      {/* Модальное окно создания карточки */}
      {showCreateModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">➕ Создать новую карточку</h5>
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
                      <label htmlFor="name" className="form-label fw-semibold">
                        📝 Название *
                      </label>
                      <input
                        type="text"
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
                        placeholder="Введите название блюда или напитка"
                      />
                      {formErrors.name && (
                        <div className="invalid-feedback">
                          {formErrors.name}
                        </div>
                      )}
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="category" className="form-label fw-semibold">
                        📂 Категория *
                      </label>
                      <select
                        id="category"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className={`form-select ${formErrors.category ? 'is-invalid' : ''}`}
                      >
                        <option value="">Выберите категорию</option>
                        <option value="bar">🍸 Бар</option>
                        <option value="kitchen">🍽️ Кухня</option>
                        <option value="wine">🍷 Винная карта</option>
                      </select>
                      {formErrors.category && (
                        <div className="invalid-feedback">
                          {formErrors.category}
                        </div>
                      )}
                    </div>

                    <div className="col-12">
                      <label htmlFor="description" className="form-label fw-semibold">
                        📄 Описание *
                      </label>
                      <textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className={`form-control ${formErrors.description ? 'is-invalid' : ''}`}
                        placeholder="Подробное описание блюда или напитка"
                        rows="4"
                      />
                      {formErrors.description && (
                        <div className="invalid-feedback d-block">
                          {formErrors.description}
                        </div>
                      )}
                    </div>

                    {/* Ингредиенты - показываем только для барных и кухонных карточек */}
                    {formData.category !== 'wine' && (
                      <div className="col-12">
                        <label htmlFor="ingredients" className="form-label fw-semibold">
                          🥘 Ингредиенты
                        </label>
                        <textarea
                          id="ingredients"
                          value={formData.ingredients}
                          onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                          className="form-control"
                          placeholder="Список ингредиентов"
                          rows="3"
                        />
                      </div>
                    )}

                    {/* Винные поля - показываем только для категории wine */}
                    {formData.category === 'wine' && (
                      <>
                        <div className="col-12">
                          <label htmlFor="taste" className="form-label fw-semibold">
                            🍷 Вкус
                          </label>
                          <textarea
                            id="taste"
                            value={formData.taste}
                            onChange={(e) => setFormData({ ...formData, taste: e.target.value })}
                            className="form-control"
                            placeholder="Описание вкусовых характеристик вина"
                            rows="3"
                          />
                        </div>

                        <div className="col-12">
                          <label htmlFor="aroma" className="form-label fw-semibold">
                            🌸 Аромат
                          </label>
                          <textarea
                            id="aroma"
                            value={formData.aroma}
                            onChange={(e) => setFormData({ ...formData, aroma: e.target.value })}
                            className="form-control"
                            placeholder="Описание ароматических характеристик вина"
                            rows="3"
                          />
                        </div>

                        <div className="col-12">
                          <label htmlFor="color" className="form-label fw-semibold">
                            🎨 Цвет
                          </label>
                          <textarea
                            id="color"
                            value={formData.color}
                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                            className="form-control"
                            placeholder="Описание цвета вина"
                            rows="3"
                          />
                        </div>

                        <div className="col-12">
                          <label htmlFor="pairings" className="form-label fw-semibold">
                            🍽️ Сочетания
                          </label>
                          <textarea
                            id="pairings"
                            value={formData.pairings}
                            onChange={(e) => setFormData({ ...formData, pairings: e.target.value })}
                            className="form-control"
                            placeholder="С какими блюдами сочетается вино"
                            rows="3"
                          />
                        </div>
                      </>
                    )}

                    <div className="col-12">
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
                      '➕ Создать карточку'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно редактирования карточки */}
      {showEditModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">✏️ Редактировать карточку</h5>
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

                  {/* Предварительный просмотр карточки */}
                  <div className="row mb-4">
                    <div className="col-12">
                      <h6 className="fw-bold mb-3">👁️ Предварительный просмотр:</h6>
                      <div className="card border" style={{ minHeight: '200px' }}>
                        {formData.category === 'wine' ? (
                          /* Специальный layout для винных карточек */
                          <div className="row g-0 h-100">
                            {/* Первая часть: Винные характеристики */}
                            <div className="col-4">
                              <div className="h-100 d-flex flex-column p-3">
                                {/* Заголовок */}
                                <div className="mb-2">
                                  <h5 className="h6 fw-bold text-primary mb-1 text-start">
                                    {formData.name || 'Название вина'}
                                  </h5>
                                  <span className="badge bg-warning text-dark">
                                    🍷 Винная карта
                                  </span>
                                </div>

                                {/* Винные характеристики */}
                                <div className="flex-grow-1">
                                  <div className="card border-0 shadow-sm h-100">
                                    <div className="card-body p-2 d-flex flex-column gap-1">
                                      {formData.taste && (
                                        <div>
                                          <h6 className="fw-bold text-primary mb-0 text-start small">🍷 Вкус</h6>
                                          <p className="mb-0 text-start" style={{ fontSize: '0.7rem' }}>{formData.taste}</p>
                                        </div>
                                      )}
                                      {formData.aroma && (
                                        <div>
                                          <h6 className="fw-bold text-success mb-0 text-start small">🌸 Аромат</h6>
                                          <p className="mb-0 text-start" style={{ fontSize: '0.7rem' }}>{formData.aroma}</p>
                                        </div>
                                      )}
                                      {formData.color && (
                                        <div>
                                          <h6 className="fw-bold text-warning mb-0 text-start small">🎨 Цвет</h6>
                                          <p className="mb-0 text-start" style={{ fontSize: '0.7rem' }}>{formData.color}</p>
                                        </div>
                                      )}
                                      {formData.pairings && (
                                        <div>
                                          <h6 className="fw-bold text-info mb-0 text-start small">🍽️ Сочетания</h6>
                                          <p className="mb-0 text-start" style={{ fontSize: '0.7rem' }}>{formData.pairings}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Вторая часть: Описание */}
                            <div className="col-4">
                              <div className="h-100 d-flex flex-column p-3">
                                <div className="mb-2">
                                  <h6 className="h6 fw-bold mb-1 text-start">📝 Описание</h6>
                                </div>
                                <div className="flex-grow-1">
                                  <div className="alert alert-info h-100 d-flex align-items-start p-2">
                                    <div className="mb-0 text-start small">
                                      {formData.description || 'Описание вина'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Третья часть: Изображение */}
                            <div className="col-4">
                              <div className="position-relative h-100 d-flex align-items-center justify-content-center">
                                {formData.image_path ? (
                                  <img
                                    src={formData.image_path}
                                    alt="Preview"
                                    className="img-fluid"
                                    style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                                  />
                                ) : (
                                  <div className="h-100 bg-light d-flex align-items-center justify-content-center">
                                    <div className="text-center text-muted">
                                      <div className="display-4 mb-2 opacity-50">🍷</div>
                                      <p className="small">Изображение отсутствует</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Обычный layout для барных и кухонных карточек */
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
                                    <div className="display-4 text-muted opacity-50">
                                      {formData.category === 'bar' ? '🍸' : '🍽️'}
                                    </div>
                                  </div>
                                )}
                                {formData.category && (
                                  <span className={`position-absolute top-0 start-0 m-2 badge ${
                                    formData.category === 'bar' ? 'bg-primary' : 'bg-success'
                                  }`}>
                                    {formData.category === 'bar' ? '🍸 Бар' : '🍽️ Кухня'}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="col-md-8">
                              <div className="card-body">
                                <h5 className="card-title">{formData.name || 'Название карточки'}</h5>
                                <div className="card-text">
                                  {formData.description || 'Описание карточки'}
                                </div>
                                {formData.ingredients && (
                                  <div className="card-text">
                                    <small className="text-muted">
                                      Ингредиенты: 
                                      <span>{formData.ingredients}</span>
                                    </small>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label htmlFor="edit_name" className="form-label fw-semibold">
                        📝 Название *
                      </label>
                      <input
                        type="text"
                        id="edit_name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
                        placeholder="Введите название блюда или напитка"
                      />
                      {formErrors.name && (
                        <div className="invalid-feedback">
                          {formErrors.name}
                        </div>
                      )}
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="edit_category" className="form-label fw-semibold">
                        📂 Категория *
                      </label>
                      <select
                        id="edit_category"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className={`form-select ${formErrors.category ? 'is-invalid' : ''}`}
                      >
                        <option value="">Выберите категорию</option>
                        <option value="bar">🍸 Бар</option>
                        <option value="kitchen">🍽️ Кухня</option>
                        <option value="wine">🍷 Винная карта</option>
                      </select>
                      {formErrors.category && (
                        <div className="invalid-feedback">
                          {formErrors.category}
                        </div>
                      )}
                    </div>

                    <div className="col-12">
                      <label htmlFor="edit_description" className="form-label fw-semibold">
                        📄 Описание *
                      </label>
                      <textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className={`form-control ${formErrors.description ? 'is-invalid' : ''}`}
                        placeholder="Подробное описание блюда или напитка"
                        rows="4"
                      />
                      {formErrors.description && (
                        <div className="invalid-feedback d-block">
                          {formErrors.description}
                        </div>
                      )}
                    </div>

                    {/* Ингредиенты - показываем только для барных и кухонных карточек */}
                    {formData.category !== 'wine' && (
                      <div className="col-12">
                        <label htmlFor="edit_ingredients" className="form-label fw-semibold">
                          🥘 Ингредиенты
                        </label>
                        <textarea
                          id="ingredients"
                          value={formData.ingredients}
                          onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                          className="form-control"
                          placeholder="Список ингредиентов"
                          rows="3"
                        />
                      </div>
                    )}

                    {/* Винные поля - показываем только для категории wine */}
                    {formData.category === 'wine' && (
                      <>
                        <div className="col-12">
                          <label htmlFor="edit_taste" className="form-label fw-semibold">
                            🍷 Вкус
                          </label>
                          <textarea
                            id="taste"
                            value={formData.taste}
                            onChange={(e) => setFormData({ ...formData, taste: e.target.value })}
                            className="form-control"
                            placeholder="Описание вкусовых характеристик вина"
                            rows="3"
                          />
                        </div>

                        <div className="col-12">
                          <label htmlFor="edit_aroma" className="form-label fw-semibold">
                            🌸 Аромат
                          </label>
                          <textarea
                            id="aroma"
                            value={formData.aroma}
                            onChange={(e) => setFormData({ ...formData, aroma: e.target.value })}
                            className="form-control"
                            placeholder="Описание ароматических характеристик вина"
                            rows="3"
                          />
                        </div>

                        <div className="col-12">
                          <label htmlFor="edit_color" className="form-label fw-semibold">
                            🎨 Цвет
                          </label>
                          <textarea
                            id="color"
                            value={formData.color}
                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                            className="form-control"
                            placeholder="Описание цвета вина"
                            rows="3"
                          />
                        </div>

                        <div className="col-12">
                          <label htmlFor="edit_pairings" className="form-label fw-semibold">
                            🍽️ Сочетания
                          </label>
                          <textarea
                            id="pairings"
                            value={formData.pairings}
                            onChange={(e) => setFormData({ ...formData, pairings: e.target.value })}
                            className="form-control"
                            placeholder="С какими блюдами сочетается вино"
                            rows="3"
                          />
                        </div>
                      </>
                    )}

                    <div className="col-12">
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
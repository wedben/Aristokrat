import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaHandshake, FaSmile, FaClock, FaUser, FaMapMarkerAlt, FaHeart, FaStar, FaUsers,
  FaUtensils, FaBook, FaLightbulb, FaUserCheck, FaExclamationTriangle, FaThumbsUp, FaShieldAlt, FaCrown,
  FaWineGlassAlt, FaGlobe, FaWineGlass, FaFlask, FaGem, FaChartLine, FaAward, FaTimes, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { api } from '../api';

const AdminNewCards = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingCard, setEditingCard] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'service',
    preview_title: '',
    preview_description: '',
    detailed_title: '',
    detailed_description: '',
    price: '',
    ingredients: '',
    taste: '',
    aroma: '',
    color: '',
    pairings: '',
    alcohol_content: '',
    volume: '',
    sort_order: 0,
    preview_icon: '',
    service_points: [],
    service_benefits: []
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [detailedImage, setDetailedImage] = useState(null);
  const [previewImageFile, setPreviewImageFile] = useState(null);
  const [detailedImageFile, setDetailedImageFile] = useState(null);

  // Доступные иконки для выбора
  const availableIcons = {
    FaHandshake, FaSmile, FaClock, FaUser, FaMapMarkerAlt, FaHeart, FaStar, FaUsers,
    FaUtensils, FaBook, FaLightbulb, FaUserCheck, FaExclamationTriangle, FaThumbsUp, FaShieldAlt, FaCrown,
    FaWineGlassAlt, FaGlobe, FaWineGlass, FaFlask, FaGem, FaChartLine, FaAward
  };

  const getIconComponent = (iconName) => {
    return availableIcons[iconName] || FaStar;
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      const response = await api.get('/cards');
      setCards(response.data);
    } catch (error) {
      console.error('Ошибка загрузки карточек:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCard = () => {
    setFormData({
      name: '',
      category: 'service',
      preview_title: '',
      preview_description: '',
      detailed_title: '',
      detailed_description: '',
      price: '',
      ingredients: '',
      taste: '',
      aroma: '',
      color: '',
      pairings: '',
      alcohol_content: '',
      volume: '',
      sort_order: 0,
      preview_icon: 'FaStar',
      service_points: [],
      service_benefits: []
    });
    setPreviewImage(null);
    setDetailedImage(null);
    setPreviewImageFile(null);
    setDetailedImageFile(null);
    setEditingCard(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handlePreviewImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreviewImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target.result);
        setFormData({ ...formData, preview_image: e.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDetailedImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDetailedImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setDetailedImage(e.target.result);
        setFormData({ ...formData, detailed_image: e.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddServicePoint = () => {
    setFormData({
      ...formData,
      service_points: [...(formData.service_points || []), { icon: 'FaStar', title: '', description: '' }]
    });
  };

  const handleRemoveServicePoint = (index) => {
    const newPoints = [...(formData.service_points || [])];
    newPoints.splice(index, 1);
    setFormData({ ...formData, service_points: newPoints });
  };

  const handleUpdateServicePoint = (index, field, value) => {
    const newPoints = [...(formData.service_points || [])];
    newPoints[index] = { ...newPoints[index], [field]: value };
    setFormData({ ...formData, service_points: newPoints });
  };

  const handleAddServiceBenefit = () => {
    setFormData({
      ...formData,
      service_benefits: [...(formData.service_benefits || []), { icon: 'FaHeart', title: '', description: '' }]
    });
  };

  const handleRemoveServiceBenefit = (index) => {
    const newBenefits = [...(formData.service_benefits || [])];
    newBenefits.splice(index, 1);
    setFormData({ ...formData, service_benefits: newBenefits });
  };

  const handleUpdateServiceBenefit = (index, field, value) => {
    const newBenefits = [...(formData.service_benefits || [])];
    newBenefits[index] = { ...newBenefits[index], [field]: value };
    setFormData({ ...formData, service_benefits: newBenefits });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { preview_image, detailed_image, ...payload } = formData;
      
      // Преобразуем service_points и service_benefits в правильный формат
      if (payload.service_points && payload.service_points.length > 0) {
        payload.service_points = payload.service_points.filter(p => p.title && p.description);
      } else {
        payload.service_points = null;
      }
      
      if (payload.service_benefits && payload.service_benefits.length > 0) {
        payload.service_benefits = payload.service_benefits.filter(b => b.title && b.description);
      } else {
        payload.service_benefits = null;
      }

      let savedId = editingCard?.id;

      if (editingCard) {
        await api.put(`/cards/${editingCard.id}`, payload);
      } else {
        const res = await api.post('/cards', payload);
        savedId = res.data?.id;
      }

      if (savedId) {
      if (previewImageFile) {
          const fd = new FormData();
          fd.append('file', previewImageFile);
          await api.post(`/cards/${savedId}/upload-image?image_type=preview`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      if (detailedImageFile) {
          const fd2 = new FormData();
          fd2.append('file', detailedImageFile);
          await api.post(`/cards/${savedId}/upload-image?image_type=detailed`, fd2, { headers: { 'Content-Type': 'multipart/form-data' } });
        } else if (previewImageFile) {
          const fd3 = new FormData();
          fd3.append('file', previewImageFile);
          await api.post(`/cards/${savedId}/upload-image?image_type=detailed`, fd3, { headers: { 'Content-Type': 'multipart/form-data' } });
        }
      }
      
      setShowModal(false);
      setEditingCard(null);
      fetchCards();
    } catch (error) {
      console.error('Ошибка сохранения карточки:', error);
    }
  };

  const handleEditCard = (card) => {
    setFormData({
      name: card.name || '',
      category: card.category || 'service',
      preview_title: card.preview_title || '',
      preview_description: card.preview_description || '',
      detailed_title: card.detailed_title || '',
      detailed_description: card.detailed_description || '',
      price: card.price || '',
      ingredients: card.ingredients || '',
      taste: card.taste || '',
      aroma: card.aroma || '',
      color: card.color || '',
      pairings: card.pairings || '',
      alcohol_content: card.alcohol_content || '',
      volume: card.volume || '',
      sort_order: card.sort_order || 0,
      preview_icon: card.preview_icon || 'FaStar',
      service_points: card.service_points || [],
      service_benefits: card.service_benefits || []
    });
    // Используем resolveImageUrl для преобразования путей в правильные URL
    setPreviewImage(card.preview_image ? resolveImageUrl(card.preview_image) : null);
    setDetailedImage(card.detailed_image ? resolveImageUrl(card.detailed_image) : null);
    setPreviewImageFile(null);
    setDetailedImageFile(null);
    setEditingCard(card);
    setShowModal(true);
  };

  const handleDeleteCard = async (cardId) => {
    if (window.confirm('Удалить карточку?')) {
      try {
        await api.delete(`/cards/${cardId}`);
        fetchCards();
      } catch (error) {
        console.error('Ошибка удаления карточки:', error);
      }
    }
  };

  const resolveImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;
    if (path.startsWith('/')) return `${api.defaults.baseURL}${path}`;
    return `${api.defaults.baseURL}/${path}`;
  };

  const categories = [
    { value: 'service', label: 'Сервис' },
    { value: 'bar', label: 'Барная карта' },
    { value: 'kitchen', label: 'Кухня' },
    { value: 'wine', label: 'Винная карта' }
  ];

  const filteredCards = cards.filter(card => 
    selectedCategory === 'all' || card.category === selectedCategory
  );

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Загрузка...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4 px-3 px-md-5">
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4 gap-3">
        <h2 className="fw-bold text-primary mb-0">Управление новыми карточками</h2>
        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={handleCreateCard}>
          <FaPlus />
          <span>Добавить карточку</span>
        </button>
      </div>

      {/* Фильтр по категориям */}
      <div className="mb-4">
        <div className="btn-group flex-wrap" role="group" style={{ gap: '4px' }}>
          <button
            type="button"
            className={`btn btn-sm ${selectedCategory === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setSelectedCategory('all')}
            style={{ 
              minWidth: '60px',
              whiteSpace: 'nowrap',
              padding: '6px 12px'
            }}
          >
            Все
          </button>
          {categories.map(category => (
            <button
              key={category.value}
              type="button"
              className={`btn btn-sm ${selectedCategory === category.value ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setSelectedCategory(category.value)}
              style={{ 
                minWidth: '80px',
                whiteSpace: 'nowrap',
                padding: '6px 12px',
                fontSize: '0.875rem'
              }}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="row g-3 g-md-4">
        {filteredCards.map((card) => (
          <div key={card.id} className="col-12 col-sm-6 col-lg-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body p-3 p-md-4">
                <h5 className="card-title mb-3">{card.preview_title}</h5>
                <p className="card-text text-muted mb-4">{card.preview_description}</p>
                <div className="d-flex gap-2">
                  <button 
                    className="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center gap-2 flex-fill"
                    onClick={() => handleEditCard(card)}
                    style={{ minHeight: '38px' }}
                  >
                    <FaEdit />
                    <span className="d-none d-sm-inline">Редактировать</span>
                  </button>
                  <button 
                    className="btn btn-sm btn-outline-danger d-flex align-items-center justify-content-center gap-2 flex-fill"
                    onClick={() => handleDeleteCard(card.id)}
                    style={{ minHeight: '38px' }}
                  >
                    <FaTrash />
                    <span className="d-none d-sm-inline">Удалить</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Модальное окно с формой */}
      {showModal && (
        <div className="modal fade show d-block bg-dark bg-opacity-50" style={{ zIndex: 1050 }}>
          <div 
            className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable" 
            style={{ 
              maxWidth: '95vw', 
              margin: '10px auto',
              height: '90vh',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div className="modal-content" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div className="modal-header flex-shrink-0">
                <h5 className="modal-title">
                  {editingCard ? 'Редактировать карточку' : 'Создать карточку'}
                </h5>
                <button type="button" className="btn-close" onClick={handleCloseModal} />
              </div>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                <div className="modal-body" style={{ overflowY: 'auto', flex: '1 1 auto', padding: '1.5rem' }}>
                  <div className="row">
                    <div className="col-12 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Название</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      
                      <div className="mb-3">
                        <label className="form-label">Категория</label>
                        <select
                          className="form-select"
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        >
                          {categories.map(category => (
                            <option key={category.value} value={category.value}>
                              {category.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Заголовок предварительного вида</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.preview_title}
                          onChange={(e) => setFormData({ ...formData, preview_title: e.target.value })}
                          required
                        />
                      </div>
                      
                      <div className="mb-3">
                        <label className="form-label">Описание предварительного вида</label>
                        <textarea
                          className="form-control"
                          rows="3"
                          value={formData.preview_description}
                          onChange={(e) => setFormData({ ...formData, preview_description: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Поля для сервисных карточек */}
                  {formData.category === 'service' && (
                    <>
                      <div className="row mb-3">
                    <div className="col-12 col-md-6">
                          <label className="form-label">Иконка предварительного вида</label>
                          <select
                            className="form-select"
                            value={formData.preview_icon || 'FaStar'}
                            onChange={(e) => setFormData({ ...formData, preview_icon: e.target.value })}
                          >
                            {Object.keys(availableIcons).map(iconName => (
                              <option key={iconName} value={iconName}>
                                {iconName} {React.createElement(availableIcons[iconName], { className: 'ms-2' })}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-12 col-md-6 d-flex align-items-end">
                          <div className="text-center w-100">
                            <div className="fs-1 text-primary">
                              {React.createElement(getIconComponent(formData.preview_icon || 'FaStar'))}
                            </div>
                            <small className="text-muted">Предпросмотр иконки</small>
                          </div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <label className="form-label mb-0">Основные принципы (Service Points)</label>
                          <button type="button" className="btn btn-sm btn-outline-primary" onClick={handleAddServicePoint}>
                            <FaPlus /> Добавить
                          </button>
                        </div>
                        {(formData.service_points || []).map((point, index) => (
                          <div key={index} className="card mb-2">
                            <div className="card-body">
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <h6 className="mb-0">Принцип {index + 1}</h6>
                                <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleRemoveServicePoint(index)}>
                                  <FaTimes />
                                </button>
                              </div>
                              <div className="row g-2">
                                <div className="col-12 col-md-4">
                                  <label className="form-label small">Иконка</label>
                                  <select
                                    className="form-select form-select-sm"
                                    value={point.icon || 'FaStar'}
                                    onChange={(e) => handleUpdateServicePoint(index, 'icon', e.target.value)}
                                  >
                                    {Object.keys(availableIcons).map(iconName => (
                                      <option key={iconName} value={iconName}>{iconName}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="col-12 col-md-8">
                                  <label className="form-label small">Заголовок</label>
                        <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    value={point.title || ''}
                                    onChange={(e) => handleUpdateServicePoint(index, 'title', e.target.value)}
                        />
                                </div>
                                <div className="col-12">
                                  <label className="form-label small">Описание</label>
                                  <textarea
                                    className="form-control form-control-sm"
                                    rows="2"
                                    value={point.description || ''}
                                    onChange={(e) => handleUpdateServicePoint(index, 'description', e.target.value)}
                            />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>

                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <label className="form-label mb-0">Преимущества (Service Benefits)</label>
                          <button type="button" className="btn btn-sm btn-outline-primary" onClick={handleAddServiceBenefit}>
                            <FaPlus /> Добавить
                          </button>
                        </div>
                        {(formData.service_benefits || []).map((benefit, index) => (
                          <div key={index} className="card mb-2">
                            <div className="card-body">
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <h6 className="mb-0">Преимущество {index + 1}</h6>
                                <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleRemoveServiceBenefit(index)}>
                                  <FaTimes />
                                </button>
                              </div>
                              <div className="row g-2">
                                <div className="col-12 col-md-4">
                                  <label className="form-label small">Иконка</label>
                                  <select
                                    className="form-select form-select-sm"
                                    value={benefit.icon || 'FaHeart'}
                                    onChange={(e) => handleUpdateServiceBenefit(index, 'icon', e.target.value)}
                                  >
                                    {Object.keys(availableIcons).map(iconName => (
                                      <option key={iconName} value={iconName}>{iconName}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="col-12 col-md-8">
                                  <label className="form-label small">Заголовок</label>
                        <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    value={benefit.title || ''}
                                    onChange={(e) => handleUpdateServiceBenefit(index, 'title', e.target.value)}
                        />
                                </div>
                                <div className="col-12">
                                  <label className="form-label small">Описание</label>
                                  <textarea
                                    className="form-control form-control-sm"
                                    rows="2"
                                    value={benefit.description || ''}
                                    onChange={(e) => handleUpdateServiceBenefit(index, 'description', e.target.value)}
                            />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <div className="row">
                    <div className="col-12 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Заголовок детального вида</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.detailed_title}
                          onChange={(e) => setFormData({ ...formData, detailed_title: e.target.value })}
                        />
                      </div>
                      
                      <div className="mb-3">
                        <label className="form-label">Описание детального вида</label>
                        <textarea
                          className="form-control"
                          rows="4"
                          value={formData.detailed_description}
                          onChange={(e) => setFormData({ ...formData, detailed_description: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Изображение предварительного вида</label>
                        <input
                          type="file"
                          className="form-control"
                          accept="image/*"
                          onChange={handlePreviewImageChange}
                        />
                        {previewImage && (
                          <div className="mt-2">
                            <img
                              src={previewImage}
                              alt="Preview"
                              className="img-thumbnail"
                              style={{ maxWidth: '200px', maxHeight: '150px', objectFit: 'contain' }}
                              onError={(e) => {
                                console.error('Ошибка загрузки изображения:', previewImage);
                                e.target.style.display = 'none';
                              }}
                            />
                            <div className="small text-muted mt-1">
                              {editingCard && !previewImageFile ? 'Текущее изображение из БД' : 'Новое изображение'}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="mb-3">
                        <label className="form-label">Изображение детального вида</label>
                        <input
                          type="file"
                          className="form-control"
                          accept="image/*"
                          onChange={handleDetailedImageChange}
                        />
                        {detailedImage && (
                          <div className="mt-2">
                            <img
                              src={detailedImage}
                              alt="Detailed Preview"
                              className="img-thumbnail"
                              style={{ maxWidth: '200px', maxHeight: '150px', objectFit: 'contain' }}
                              onError={(e) => {
                                console.error('Ошибка загрузки изображения:', detailedImage);
                                e.target.style.display = 'none';
                              }}
                            />
                            <div className="small text-muted mt-1">
                              {editingCard && !detailedImageFile ? 'Текущее изображение из БД' : 'Новое изображение'}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Поля для барной карты и кухни */}
                  {(formData.category === 'bar' || formData.category === 'kitchen') && (
                    <div className="row">
                      <div className="col-12 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Цена</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          />
                        </div>
                        
                        <div className="mb-3">
                          <label className="form-label">{formData.category === 'bar' ? 'Состав' : 'Ингредиенты'}</label>
                          <textarea
                            className="form-control"
                            rows="3"
                            value={formData.ingredients}
                            onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="col-12 col-md-6">
                        {formData.category === 'bar' && (
                          <>
                            <div className="mb-3">
                              <label className="form-label">Крепость</label>
                              <input
                                type="text"
                                className="form-control"
                                value={formData.alcohol_content}
                                onChange={(e) => setFormData({ ...formData, alcohol_content: e.target.value })}
                              />
                            </div>
                            <div className="mb-3">
                              <label className="form-label">Объем</label>
                              <input
                                type="text"
                                className="form-control"
                                value={formData.volume}
                                onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Поля для винной карты */}
                  {formData.category === 'wine' && (
                    <div className="row">
                      <div className="col-12 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Цена</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          />
                        </div>
                        
                        <div className="mb-3">
                          <label className="form-label">Вкус</label>
                          <textarea
                            className="form-control"
                            rows="3"
                            value={formData.taste}
                            onChange={(e) => setFormData({ ...formData, taste: e.target.value })}
                          />
                        </div>
                        
                        <div className="mb-3">
                          <label className="form-label">Аромат</label>
                          <textarea
                            className="form-control"
                            rows="3"
                            value={formData.aroma}
                            onChange={(e) => setFormData({ ...formData, aroma: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="col-12 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Цвет</label>
                          <textarea
                            className="form-control"
                            rows="3"
                            value={formData.color}
                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                          />
                        </div>
                        
                        <div className="mb-3">
                          <label className="form-label">Сочетания</label>
                          <textarea
                            className="form-control"
                            rows="3"
                            value={formData.pairings}
                            onChange={(e) => setFormData({ ...formData, pairings: e.target.value })}
                          />
                        </div>

                    <div className="row">
                          <div className="col-6">
                        <div className="mb-3">
                              <label className="form-label">Алкоголь</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.alcohol_content}
                            onChange={(e) => setFormData({ ...formData, alcohol_content: e.target.value })}
                          />
                        </div>
                      </div>
                          <div className="col-6">
                        <div className="mb-3">
                          <label className="form-label">Объем</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.volume}
                            onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                          />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Предварительный просмотр карточки */}
                  <div className="mt-4 border-top pt-4">
                    <h6 className="fw-bold mb-4">👁️ Предварительный просмотр</h6>
                    
                    {/* Представление 1: Как карточка выглядит в меню */}
                    <div className="mb-4">
                      <h6 className="fw-bold text-primary mb-3">1. Предварительный вид (как в меню)</h6>
                      <div className="row justify-content-center">
                        <div className="col-12 col-md-6 col-lg-4">
                          <div className="card border-0 shadow-sm h-100">
                            <div className="card-body p-4 text-center">
                              <div className="mb-3">
                                {previewImage ? (
                        <div className="mb-3">
                                    <img
                                      src={previewImage}
                                      alt={formData.preview_title || 'Preview'}
                                      className="img-fluid rounded"
                                      style={{ 
                                        width: '100%',
                                        height: '120px',
                                        objectFit: 'contain',
                                        backgroundColor: '#fff',
                                      }}
                                    />
                                  </div>
                                ) : formData.category === 'service' && formData.preview_icon ? (
                                  <div className="fs-2 text-primary mb-2">
                                    {React.createElement(getIconComponent(formData.preview_icon))}
                                  </div>
                                ) : (
                                  <div 
                                    className="bg-light rounded d-flex align-items-center justify-content-center mb-3"
                                    style={{ width: '100%', height: '120px' }}
                                  >
                                    <span className="text-muted">Изображение отсутствует</span>
                                  </div>
                                )}
                                <h5 className="card-title mb-0 fw-bold">
                                  {formData.preview_title || 'Название карточки'}
                                </h5>
                              </div>
                              
                              <p className="card-text text-muted mb-4">
                                {formData.preview_description || 'Описание карточки'}
                              </p>

                              {formData.category === 'service' && formData.service_points && formData.service_points.length > 0 && (
                                <div className="standards-preview text-start mb-3">
                                  {formData.service_points.slice(0, 2).map((point, pointIndex) => (
                                    <div key={pointIndex} className="d-flex align-items-center mb-2">
                                      {React.createElement(getIconComponent(point.icon), { className: "text-success me-2 flex-shrink-0" })}
                                      <span className="small">{point.title}</span>
                                    </div>
                                  ))}
                                  {formData.service_points.length > 2 && (
                                    <div className="text-muted small text-center">
                                      +{formData.service_points.length - 2} еще...
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="mt-3">
                                <span className="badge bg-primary text-wrap" style={{ maxWidth: '100%', wordBreak: 'break-word' }}>
                                  Нажмите для подробностей
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Представление 2: Углубленный вид (модальное окно) */}
                    <div>
                      <h6 className="fw-bold text-primary mb-3">2. Углубленный вид (при открытии)</h6>
                      <div className="border overflow-hidden mx-auto" style={{ maxWidth: formData.category === 'wine' ? '1000px' : (formData.category === 'bar' || formData.category === 'kitchen') ? '800px' : '600px' }}>
                        {/* Заголовок модального окна */}
                        <div className="bg-primary text-white p-3">
                          <div className="d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center">
                              <div className="fs-3 me-3">
                                {formData.category === 'service' && formData.preview_icon ? (
                                  React.createElement(getIconComponent(formData.preview_icon))
                                ) : (
                                  <FaUtensils />
                                )}
                              </div>
                              <div>
                                <h5 className="mb-0">{formData.detailed_title || formData.preview_title || 'Название карточки'}</h5>
                                <small>{formData.preview_description || 'Описание'}</small>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Тело модального окна */}
                        <div className="p-4 bg-white" style={{ minHeight: '400px', maxHeight: '600px', overflowY: 'auto' }}>
                          {/* Сервисные карточки */}
                          {formData.category === 'service' && (
                            <>
                              {formData.detailed_description && (
                                <div className="mb-4">
                                  <p className="lead">{formData.detailed_description}</p>
                                </div>
                              )}

                              {formData.service_points && formData.service_points.length > 0 && (
                                <div className="d-flex flex-column gap-4 mb-4">
                                  <div>
                                    <h6 className="fw-bold text-primary mb-3">
                                      <FaStar className="me-2" />
                                      Основные принципы
                                    </h6>
                                    {formData.service_points.map((point, index) => (
                                      <div key={index} className="d-flex align-items-start mb-3">
                                        <div className="p-2 bg-primary bg-opacity-10 rounded-circle me-3 flex-shrink-0">
                                          {React.createElement(getIconComponent(point.icon), { className: "text-primary" })}
                                        </div>
                                        <div>
                                          <h6 className="fw-bold mb-1">{point.title}</h6>
                                          <p className="text-muted small mb-0">{point.description}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  {formData.service_benefits && formData.service_benefits.length > 0 && (
                                    <div>
                                      <h6 className="fw-bold text-success mb-3">
                                        <FaHeart className="me-2" />
                                        Преимущества
                                      </h6>
                                      {formData.service_benefits.map((benefit, index) => (
                                        <div key={index} className="d-flex align-items-start mb-3">
                                          <div className="p-2 bg-success bg-opacity-10 rounded-circle me-3 flex-shrink-0">
                                            {React.createElement(getIconComponent(benefit.icon), { className: "text-success" })}
                                          </div>
                                          <div>
                                            <h6 className="fw-bold mb-1">{benefit.title}</h6>
                                            <p className="text-muted small mb-0">{benefit.description}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </>
                          )}

                          {/* Барные и кухонные карточки */}
                          {(formData.category === 'bar' || formData.category === 'kitchen') && (
                            <div className="d-flex flex-column gap-4">
                              {/* Изображение - сверху */}
                              <div className="position-relative">
                                {detailedImage ? (
                                  <img 
                                    src={detailedImage}
                                    alt={formData.detailed_title || formData.preview_title}
                                    className="img-fluid rounded-3 shadow-sm w-100"
                                    style={{ height: '350px', objectFit: 'contain', backgroundColor: '#fff' }}
                                  />
                                ) : (
                                  <div 
                                    className="bg-light rounded-3 d-flex align-items-center justify-content-center shadow-sm w-100"
                                    style={{ height: '350px' }}
                                  >
                                    <div className="text-center text-muted">
                                      <FaUtensils size={48} className="mb-3" />
                                      <p className="mb-0">Изображение отсутствует</p>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Информация - снизу */}
                              <div className="d-flex flex-column gap-3">
                                {/* Описание */}
                                {formData.detailed_description && (
                                  <div>
                                    <h6 className="fw-bold text-primary mb-3">
                                      <FaBook className="me-2" />
                                      Описание
                                    </h6>
                                    <div className="bg-light rounded-3 p-3">
                                      <p className="mb-0">{formData.detailed_description}</p>
                                    </div>
                                  </div>
                                )}

                                {/* Состав/Ингредиенты */}
                                {formData.ingredients && (
                                  <div>
                                    <h6 className="fw-bold text-success mb-3">
                                      <FaFlask className="me-2" />
                                      {formData.category === 'bar' ? 'Состав' : 'Ингредиенты'}
                                    </h6>
                                    <div className="bg-light rounded-3 p-3">
                                      <p className="mb-0">{formData.ingredients}</p>
                                    </div>
                                  </div>
                                )}

                                {/* Дополнительная информация */}
                                {(formData.price || formData.alcohol_content || formData.volume) && (
                                  <div>
                                    <h6 className="fw-bold text-warning mb-3">
                                      <FaStar className="me-2" />
                                      Дополнительная информация
                                    </h6>
                                    <div className="row g-2">
                                      {formData.price && (
                                        <div className="col-12 col-sm-4">
                                          <div className="bg-warning bg-opacity-10 rounded-3 p-3 text-center">
                                            <strong className="text-warning">Цена</strong>
                                            <div className="fw-bold">{formData.price}</div>
                                          </div>
                                        </div>
                                      )}
                                      {formData.alcohol_content && (
                                        <div className="col-12 col-sm-4">
                                          <div className="bg-danger bg-opacity-10 rounded-3 p-3 text-center">
                                            <strong className="text-danger">Крепость</strong>
                                            <div className="fw-bold">{formData.alcohol_content}</div>
                                          </div>
                                        </div>
                                      )}
                                      {formData.volume && (
                                        <div className="col-12 col-sm-4">
                                          <div className="bg-info bg-opacity-10 rounded-3 p-3 text-center">
                                            <strong className="text-info">Объем</strong>
                                            <div className="fw-bold">{formData.volume}</div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Винные карточки */}
                          {formData.category === 'wine' && (
                            <div className="d-flex flex-column flex-lg-row gap-3 gap-lg-4">
                              {/* Левая колонка - Характеристики */}
                              <div className="flex-shrink-0" style={{ width: '100%', maxWidth: '250px' }}>
                                <div className="d-flex flex-column gap-3">
                                  <div className="bg-light rounded-3 p-3" style={{ minHeight: '200px' }}>
                                    <h6 className="fw-bold text-primary mb-2">Вкус</h6>
                                    <p className="small mb-3">{formData.taste || 'Не указано'}</p>
                                    <h6 className="fw-bold text-primary mb-2">Аромат</h6>
                                    <p className="small mb-0">{formData.aroma || 'Не указано'}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Центральная колонка - Описание/История */}
                              <div className="flex-grow-1" style={{ minHeight: '0' }}>
                                <h6 className="fw-bold text-primary mb-3">
                                  <FaBook className="me-2" />
                                  Описание и история
                                </h6>
                                <div className="bg-light rounded-3 p-3 p-md-4">
                                  <p className="mb-0">{formData.detailed_description || formData.preview_description || 'Описание отсутствует'}</p>
                                </div>
                              </div>

                              {/* Правая колонка - Изображение */}
                              <div className="flex-shrink-0" style={{ width: '100%', maxWidth: '320px' }}>
                                {detailedImage ? (
                                  <img 
                                    src={detailedImage}
                                    alt={formData.detailed_title || formData.preview_title}
                                    className="img-fluid rounded-3 shadow-sm"
                                    style={{ width: '100%', height: '400px', objectFit: 'contain', backgroundColor: '#fff' }}
                                  />
                                ) : (
                                  <div 
                                    className="bg-light rounded-3 d-flex align-items-center justify-content-center shadow-sm"
                                    style={{ width: '100%', height: '400px' }}
                                  >
                                    <div className="text-center text-muted">
                                      <FaWineGlassAlt size={48} className="mb-3" />
                                      <p className="mb-0">Изображение отсутствует</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Footer с кнопкой изучения */}
                        <div className="border-top p-3 bg-light">
                          <button className="btn btn-outline-success w-100">
                            <FaStar className="me-2" />
                            Отметить как изученное
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer flex-shrink-0">
                  <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                    Отмена
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingCard ? 'Обновить' : 'Создать'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNewCards;

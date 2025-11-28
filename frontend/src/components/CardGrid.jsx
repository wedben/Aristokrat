import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaHandshake, FaSmile, FaClock, FaUser, FaMapMarkerAlt, FaHeart, FaStar, FaUsers,
  FaUtensils, FaBook, FaLightbulb, FaUserCheck, FaExclamationTriangle, FaThumbsUp, FaShieldAlt, FaCrown,
  FaWineGlassAlt, FaGlobe, FaWineGlass, FaFlask, FaGem, FaChartLine, FaAward,
  FaTimes, FaArrowUp, FaArrowDown, FaCheckCircle, FaChevronLeft, FaChevronRight
} from 'react-icons/fa';
import { api } from '../api';
import { useToast } from '../contexts/ToastContext';

const CardGrid = ({ category = 'service' }) => {
  const { showSuccess, showError } = useToast();
  const [cards, setCards] = useState([]);
  const [cardProgress, setCardProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState(null);
  const [wineCharacteristicIndex, setWineCharacteristicIndex] = useState(0);
  const [pageSize, setPageSize] = useState(9);
  const [currentPage, setCurrentPage] = useState(1);
  const [markingLearned, setMarkingLearned] = useState({});

  useEffect(() => {
    fetchCards();
    fetchCardProgress();
    setCurrentPage(1);
  }, [category]);

  // Сброс индекса при смене карточки
  useEffect(() => {
    setWineCharacteristicIndex(0);
  }, [selectedCard]);

  // Функции навигации по характеристикам вина (по 2 за раз)
  const wineCharacteristics = [
    { key: 'taste', title: 'Вкус', content: 'taste' },
    { key: 'aroma', title: 'Аромат', content: 'aroma' },
    { key: 'color', title: 'Цвет', content: 'color' },
    { key: 'pairings', title: 'Сочетания', content: 'pairings' }
  ];

  const characteristicsPerPage = 2;
  const totalPages = Math.ceil(wineCharacteristics.length / characteristicsPerPage);

  const nextCharacteristic = () => {
    setWineCharacteristicIndex((prev) => 
      prev < totalPages - 1 ? prev + 1 : 0
    );
  };

  const prevCharacteristic = () => {
    setWineCharacteristicIndex((prev) => 
      prev > 0 ? prev - 1 : totalPages - 1
    );
  };

  // Получаем характеристики для текущей страницы
  const getCurrentCharacteristics = () => {
    const startIndex = wineCharacteristicIndex * characteristicsPerPage;
    const endIndex = startIndex + characteristicsPerPage;
    return wineCharacteristics.slice(startIndex, endIndex);
  };

  // Обработка клавиатурной навигации
  const handleKeyDown = (event) => {
    if (selectedCard?.category === 'wine') {
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        prevCharacteristic();
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        nextCharacteristic();
      }
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedCard]);

  const fetchCards = async () => {
    try {
      const response = await api.get(`/cards?category=${category}`);
      setCards(response.data);
    } catch (error) {
      console.error('Ошибка загрузки карточек:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCardProgress = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await api.get('/cards/progress/me');
      setCardProgress(response.data);
    } catch (error) {
      console.error('Ошибка загрузки прогресса карточек:', error);
    }
  };

  const handleMarkLearned = async (cardId, e) => {
    e.stopPropagation(); // Предотвращаем открытие модального окна
    
    try {
      setMarkingLearned(prev => ({ ...prev, [cardId]: true }));
      await api.post(`/cards/${cardId}/mark-learned`);
      
      // Обновляем локальный прогресс (используем строковый ключ)
      setCardProgress(prev => ({
        ...prev,
        [String(cardId)]: {
          ...prev[String(cardId)],
          is_learned: true
        }
      }));
      
      showSuccess('Карточка отмечена как изученная!');
    } catch (err) {
      console.error('Error marking card as learned:', err);
      showError('Ошибка при отметке карточки как изученной');
    } finally {
      setMarkingLearned(prev => ({ ...prev, [cardId]: false }));
    }
  };

  const resolveImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;
    if (path.startsWith('/')) return `${api.defaults.baseURL}${path}`;
    return `${api.defaults.baseURL}/${path}`;
  };

  const shouldContain = (category) => {
    return category === 'wine' || category === 'bar' || category === 'kitchen';
  };

  const totalCards = cards.length;
  const totalPagesCards = Math.max(1, Math.ceil(totalCards / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const visibleCards = cards.slice(startIndex, startIndex + pageSize);

  const getIconComponent = (iconName) => {
    const iconMap = {
      FaHandshake, FaSmile, FaClock, FaUser, FaMapMarkerAlt, FaHeart, FaStar, FaUsers,
      FaUtensils, FaBook, FaLightbulb, FaUserCheck, FaExclamationTriangle, FaThumbsUp, FaShieldAlt, FaCrown,
      FaWineGlassAlt, FaGlobe, FaWineGlass, FaFlask, FaGem, FaChartLine, FaAward
    };
    return iconMap[iconName] || FaStar;
  };

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
    <div className="container-fluid py-4 px-5">
      {/* Заголовок */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-primary">
          {category === 'service' && '📋 Сервис'}
          {category === 'bar' && '🍸 Барная карта'}
          {category === 'kitchen' && '🍽️ Меню'}
          {category === 'wine' && '🍷 Винная карта'}
        </h2>
      </div>

      {/* Панель выбора количества и пагинация */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-3">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span className="text-muted small fw-semibold">Показывать по:</span>
          <div className="btn-group" role="group">
            {[6, 9, 12].map((size) => (
              <button
                key={size}
                type="button"
                className={`btn btn-sm ${pageSize === size ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => { setPageSize(size); setCurrentPage(1); }}
                style={{ minWidth: '40px' }}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-outline-secondary btn-sm d-flex align-items-center justify-content-center"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            style={{ width: '38px', height: '38px', padding: 0 }}
            title="Предыдущая страница"
          >
            <FaChevronLeft />
          </button>
          <span className="small text-muted px-2" style={{ minWidth: '80px', textAlign: 'center' }}>
            {currentPage} / {totalPagesCards}
          </span>
          <button
            className="btn btn-outline-secondary btn-sm d-flex align-items-center justify-content-center"
            disabled={currentPage >= totalPagesCards}
            onClick={() => setCurrentPage((p) => Math.min(totalPagesCards, p + 1))}
            style={{ width: '38px', height: '38px', padding: 0 }}
            title="Следующая страница"
          >
            <FaChevronRight />
          </button>
        </div>
      </div>

      {/* Сетка карточек */}
      <div className="row g-3 g-md-4">
        {visibleCards.map((card, index) => (
          <motion.div
            key={card.id}
            className="col-12 col-sm-6 col-lg-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
          >
            <div
              className="card border-0 shadow-sm h-100 cursor-pointer"
              onClick={() => setSelectedCard(card)}
              style={{ cursor: 'pointer' }}
            >
              <div className="card-body p-4 text-center">
                <div className="mb-3">
                  {card.preview_image ? (
                    <div className="mb-3">
                      <img
                        src={resolveImageUrl(card.preview_image)}
                        alt={card.preview_title}
                        className="img-fluid rounded"
                        style={{ 
                          width: '100%',
                          height: '120px',
                          objectFit: shouldContain(card.category) ? 'contain' : 'cover',
                          backgroundColor: shouldContain(card.category) ? '#fff' : 'transparent',
                        }}
                      />
                    </div>
                  ) : (
                    <div className="fs-2 text-primary mb-2">
                      {React.createElement(getIconComponent(card.preview_icon))}
                    </div>
                  )}
                  <h5 className="card-title mb-0 fw-bold">
                    {card.preview_title}
                  </h5>
                </div>
                
                <p className="card-text text-muted mb-4">
                  {card.preview_description}
                </p>

                {card.service_points && (
                  <div className="standards-preview text-start">
                    {card.service_points.slice(0, 2).map((point, pointIndex) => (
                      <div key={pointIndex} className="d-flex align-items-center mb-2">
                        {React.createElement(getIconComponent(point.icon), { className: "text-success me-2 flex-shrink-0" })}
                        <span className="small">{point.title}</span>
                      </div>
                    ))}
                    {card.service_points.length > 2 && (
                      <div className="text-muted small text-center">
                        +{card.service_points.length - 2} еще...
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
          </motion.div>
        ))}
      </div>

      {/* Модальное окно с детальной информацией */}
      <AnimatePresence>
        {selectedCard && (
          <motion.div
            className="modal fade show d-block bg-dark bg-opacity-50"
            onClick={() => setSelectedCard(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="modal-dialog modal-dialog-centered modal-dialog-scrollable"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              style={{ 
                maxWidth: window.innerWidth < 768 
                  ? 'calc(100% - 1rem)' 
                  : (selectedCard?.category === 'bar' || selectedCard?.category === 'kitchen') 
                    ? '800px' 
                    : (selectedCard?.category === 'wine') 
                      ? '1000px' 
                      : '600px', 
                margin: window.innerWidth < 768 ? '0.5rem auto' : '10px auto',
                maxHeight: '90vh'
              }}
            >
              <div className="modal-content border-0">
                <div className="modal-header bg-primary text-white">
                  <div className="d-flex align-items-center">
                    <div className="fs-3 me-3">
                      {React.createElement(getIconComponent(selectedCard.preview_icon))}
                    </div>
                    <div>
                      <h5 className="modal-title mb-0">{selectedCard.detailed_title || selectedCard.preview_title}</h5>
                      <small>{selectedCard.preview_description}</small>
                    </div>
                  </div>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedCard(null)} />
                </div>
                
                <div className="modal-body p-4">
                  {/* Сервисные карточки */}
                  {selectedCard.category === 'service' && (
                    <>
                      {selectedCard.detailed_description && (
                        <div className="mb-4">
                          <p className="lead">{selectedCard.detailed_description}</p>
                        </div>
                      )}

                      {selectedCard.service_points && (
                        <div className="d-flex flex-column gap-4">
                          <div>
                            <h6 className="fw-bold text-primary mb-3">
                              <FaStar className="me-2" />
                              Основные принципы
                            </h6>
                            {selectedCard.service_points.map((point, index) => (
                              <motion.div
                                key={index}
                                className="d-flex align-items-start mb-3"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.1 }}
                              >
                                <div className="p-2 bg-primary bg-opacity-10 rounded-circle me-3 flex-shrink-0">
                                  {React.createElement(getIconComponent(point.icon), { className: "text-primary" })}
                                </div>
                                <div>
                                  <h6 className="fw-bold mb-1">{point.title}</h6>
                                  <p className="text-muted small mb-0">{point.description}</p>
                                </div>
                              </motion.div>
                            ))}
                          </div>

                          {selectedCard.service_benefits && (
                            <div>
                              <h6 className="fw-bold text-success mb-3">
                                <FaHeart className="me-2" />
                                Преимущества
                              </h6>
                              {selectedCard.service_benefits.map((benefit, index) => (
                                <motion.div
                                  key={index}
                                  className="d-flex align-items-start mb-3"
                                  initial={{ opacity: 0, x: 20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.4, delay: index * 0.1 }}
                                >
                                  <div className="p-2 bg-success bg-opacity-10 rounded-circle me-3 flex-shrink-0">
                                    {React.createElement(getIconComponent(benefit.icon), { className: "text-success" })}
                                  </div>
                                  <div>
                                    <h6 className="fw-bold mb-1">{benefit.title}</h6>
                                    <p className="text-muted small mb-0">{benefit.description}</p>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {/* Барные и кухонные карточки */}
                  {(selectedCard.category === 'bar' || selectedCard.category === 'kitchen') && (
                    <div className="d-flex flex-column gap-4">
                      {/* Изображение - сверху */}
                      <div className="position-relative">
                        {selectedCard.detailed_image ? (
                          <img 
                          src={resolveImageUrl(selectedCard.detailed_image)} 
                            alt={selectedCard.detailed_title || selectedCard.preview_title}
                          className="img-fluid rounded-3 shadow-sm w-100"
                          style={{ height: '350px', objectFit: shouldContain(selectedCard.category) ? 'contain' : 'cover', backgroundColor: shouldContain(selectedCard.category) ? '#fff' : 'transparent' }}
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
                        <div>
                            <h6 className="fw-bold text-primary mb-3">
                              <FaBook className="me-2" />
                              Описание
                            </h6>
                            <div className="bg-light rounded-3 p-3">
                              <p className="mb-0">{selectedCard.detailed_description || selectedCard.preview_description}</p>
                            </div>
                          </div>

                        {/* Состав/Ингредиенты */}
                        <div>
                            <h6 className="fw-bold text-success mb-3">
                              <FaFlask className="me-2" />
                              {selectedCard.category === 'bar' ? 'Состав' : 'Ингредиенты'}
                            </h6>
                            <div className="bg-light rounded-3 p-3">
                              <p className="mb-0">{selectedCard.ingredients || 'Состав не указан'}</p>
                            </div>
                          </div>

                        {/* Дополнительная информация */}
                        {(selectedCard.price || selectedCard.alcohol_content || selectedCard.volume) && (
                          <div>
                            <h6 className="fw-bold text-warning mb-3">
                              <FaStar className="me-2" />
                              Дополнительная информация
                            </h6>
                            <div className="row g-2">
                              {selectedCard.price && (
                                <div className="col-12 col-sm-4">
                                  <div className="bg-warning bg-opacity-10 rounded-3 p-3 text-center">
                                    <strong className="text-warning">Цена</strong>
                                    <div className="fw-bold">{selectedCard.price}</div>
                                  </div>
                                </div>
                              )}
                              {selectedCard.alcohol_content && (
                                <div className="col-12 col-sm-4">
                                  <div className="bg-danger bg-opacity-10 rounded-3 p-3 text-center">
                                    <strong className="text-danger">Крепость</strong>
                                    <div className="fw-bold">{selectedCard.alcohol_content}</div>
                                  </div>
                                </div>
                              )}
                              {selectedCard.volume && (
                                <div className="col-12 col-sm-4">
                                  <div className="bg-info bg-opacity-10 rounded-3 p-3 text-center">
                                    <strong className="text-info">Объем</strong>
                                    <div className="fw-bold">{selectedCard.volume}</div>
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
                  {selectedCard.category === 'wine' && (
                    <div className="d-flex flex-column flex-lg-row gap-3 gap-lg-4 wine-card-mobile" style={{ minHeight: '400px' }}>
                      {/* Левая колонка - Характеристики с навигацией */}
                      <div className="flex-shrink-0 wine-characteristics-mobile" style={{ width: '100%', maxWidth: '250px', height: '400px', display: 'flex', flexDirection: 'column' }}>
                        <div className="d-flex flex-column gap-3" style={{ flex: '1 1 auto', minHeight: '0' }}>
                          {/* Навигационные стрелки */}
                          <div className="d-flex flex-column justify-content-center gap-2 mb-2" style={{ flexShrink: 0 }}>
                            <div className="d-flex justify-content-center gap-2">
                              <button 
                                className="btn btn-outline-primary btn-sm"
                                onClick={prevCharacteristic}
                                style={{ minWidth: '40px' }}
                                title="Предыдущая характеристика"
                              >
                                <FaArrowUp />
                              </button>
                              <span className="badge bg-primary d-flex align-items-center">
                                {wineCharacteristicIndex + 1} / {totalPages}
                              </span>
                              <button 
                                className="btn btn-outline-primary btn-sm"
                                onClick={nextCharacteristic}
                                style={{ minWidth: '40px' }}
                                title="Следующая характеристика"
                              >
                                <FaArrowDown />
                              </button>
                            </div>
                            
                            {/* Индикатор прогресса */}
                            <div className="progress" style={{ height: '4px', minWidth: '100px' }}>
                              <div 
                                className="progress-bar bg-primary" 
                                role="progressbar" 
                                style={{ 
                                  width: `${((wineCharacteristicIndex + 1) / totalPages) * 100}%` 
                                }}
                                aria-valuenow={wineCharacteristicIndex + 1}
                                aria-valuemin="0"
                                aria-valuemax={totalPages}
                              ></div>
                            </div>
                          </div>
                          
                          {/* Текущие характеристики (по 2 за раз) */}
                          <motion.div 
                            key={wineCharacteristicIndex}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="bg-light p-3" 
                            style={{ flex: '1 1 auto', overflowY: 'auto', minHeight: '0' }}
                          >
                            {getCurrentCharacteristics().map((characteristic, index) => (
                              <div key={characteristic.key} className={index > 0 ? 'mt-3' : ''}>
                                <h6 className="fw-bold text-primary mb-2">
                                  {characteristic.title}
                                </h6>
                                <p className="small mb-0">
                                  {selectedCard[characteristic.content] || 'Не указано'}
                                </p>
                              </div>
                            ))}
                          </motion.div>
                        </div>
                      </div>

                      {/* Центральная колонка - Описание/История */}
                      <div className="flex-grow-1 wine-description-mobile" style={{ minHeight: '0', height: '400px', display: 'flex', flexDirection: 'column' }}>
                        <h6 className="fw-bold text-primary mb-3">
                          <FaBook className="me-2" />
                          Описание и история
                        </h6>
                        <div className="bg-light p-3 p-md-4" style={{ flex: '1 1 auto', overflowY: 'auto', minHeight: '0' }}>
                          <p className="mb-0">{selectedCard.detailed_description || selectedCard.preview_description}</p>
                        </div>
                      </div>

                      {/* Правая колонка - Изображение */}
                      <div className="flex-shrink-0 wine-image-mobile" style={{ width: '100%', maxWidth: '320px', height: '400px' }}>
                        {selectedCard.detailed_image ? (
                          <img 
                            src={resolveImageUrl(selectedCard.detailed_image)} 
                            alt={selectedCard.detailed_title || selectedCard.preview_title}
                            className="img-fluid shadow-sm"
                            style={{ width: '100%', height: '400px', objectFit: shouldContain(selectedCard.category) ? 'contain' : 'cover', backgroundColor: shouldContain(selectedCard.category) ? '#fff' : 'transparent' }}
                          />
                        ) : (
                          <div 
                            className="bg-light d-flex align-items-center justify-content-center shadow-sm"
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
                <div className="modal-footer border-top">
                  <button
                    className={`btn ${
                      cardProgress[String(selectedCard.id)]?.is_learned 
                        ? 'btn-success' 
                        : 'btn-outline-success'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkLearned(selectedCard.id, e);
                    }}
                    disabled={markingLearned[selectedCard.id]}
                  >
                    {markingLearned[selectedCard.id] ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Отмечаю...
                      </>
                    ) : cardProgress[String(selectedCard.id)]?.is_learned ? (
                      <>
                        <FaCheckCircle className="me-2" />
                        Изучено
                      </>
                    ) : (
                      <>
                        <FaCheckCircle className="me-2" />
                        Отметить как изученное
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CardGrid;

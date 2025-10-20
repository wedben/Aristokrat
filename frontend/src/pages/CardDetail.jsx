import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../contexts/ToastContext';

export default function CardDetail() {
  const { id } = useParams();
  const { showSuccess, showError } = useToast();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(null);
  const [markingLearned, setMarkingLearned] = useState(false);

  useEffect(() => {
    const fetchCard = async () => {
      try {
        setLoading(true);
        const [cardResponse, progressResponse] = await Promise.all([
          api.get(`/menu/${id}`),
          api.get(`/menu/${id}/progress`)
        ]);
        setCard(cardResponse.data);
        setProgress(progressResponse.data);
      } catch (err) {
        setError('Ошибка загрузки карточки');
        console.error('Error fetching card:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCard();
    }
  }, [id]);

  const handleMarkLearned = async () => {
    try {
      setMarkingLearned(true);
      await api.post(`/menu/${id}/mark-learned`);
      
      // Обновляем прогресс
      const progressResponse = await api.get(`/menu/${id}/progress`);
      setProgress(progressResponse.data);
      
      // Показываем уведомление об успехе
      showSuccess('Карточка отмечена как изученная!');
    } catch (err) {
      console.error('Error marking card as learned:', err);
      showError('Ошибка при отметке карточки как изученной');
    } finally {
      setMarkingLearned(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка карточки...</p>
        </div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Карточка не найдена</h2>
          <p className="text-gray-600 mb-6">{error || 'Запрашиваемая карточка не существует'}</p>
          <Link
            to="/menu"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Вернуться к каталогу
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="row justify-content-center">
        <div className="col-12">
          <div className="card shadow-lg" style={{ minHeight: '70vh', maxHeight: '80vh' }}>
            <div className="row g-0 h-100">
              {/* Специальный layout для винных карточек */}
              {card.category === 'wine' ? (
                <>
                  {/* Первая часть: Винные характеристики */}
                  <div className="col-4">
                    <div className="h-100 d-flex flex-column p-3">
                      {/* Заголовок */}
                      <div className="mb-2">
                        <h1 className="h4 fw-bold text-primary mb-1 text-start">
                          {card.name}
                        </h1>
                        <span className="badge bg-warning text-dark">
                          🍷 Винная карта
                        </span>
                      </div>

                      {/* Винные характеристики - одно целое */}
                      <div className="flex-grow-1">
                        <div className="card border-0 shadow-sm h-100">
                          <div className="card-body p-3 d-flex flex-column gap-2">
                            {/* Вкус */}
                            {card.taste && (
                              <div>
                                <h6 className="fw-bold text-primary mb-1 text-start">
                                  🍷 Вкус
                                </h6>
                                <div 
                                  className="mb-0 text-start small"
                                  dangerouslySetInnerHTML={{ __html: card.taste }}
                                />
                              </div>
                            )}

                            {/* Аромат */}
                            {card.aroma && (
                              <div>
                                <h6 className="fw-bold text-success mb-1 text-start">
                                  🌸 Аромат
                                </h6>
                                <div 
                                  className="mb-0 text-start small"
                                  dangerouslySetInnerHTML={{ __html: card.aroma }}
                                />
                              </div>
                            )}

                            {/* Цвет */}
                            {card.color && (
                              <div>
                                <h6 className="fw-bold text-warning mb-1 text-start">
                                  🎨 Цвет
                                </h6>
                                <div 
                                  className="mb-0 text-start small"
                                  dangerouslySetInnerHTML={{ __html: card.color }}
                                />
                              </div>
                            )}

                            {/* Сочетания */}
                            {card.pairings && (
                              <div>
                                <h6 className="fw-bold text-info mb-1 text-start">
                                  🍽️ Сочетания
                                </h6>
                                <div 
                                  className="mb-0 text-start small"
                                  dangerouslySetInnerHTML={{ __html: card.pairings }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Кнопки действий */}
                      <div className="mt-3">
                        <div className="d-grid gap-2">
                          <button
                            onClick={() => window.history.back()}
                            className="btn btn-outline-secondary btn-sm"
                          >
                            ← Назад
                          </button>
                          <button
                            onClick={handleMarkLearned}
                            disabled={markingLearned || (progress && progress.is_learned)}
                            className={`btn btn-sm ${
                              progress && progress.is_learned 
                                ? 'btn-success' 
                                : 'btn-outline-success'
                            }`}
                          >
                            {markingLearned ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                Обработка...
                              </>
                            ) : progress && progress.is_learned ? (
                              <>
                                ✅ Изучено
                              </>
                            ) : (
                              <>
                                📚 Отметить как изученное
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Вторая часть: Описание */}
                  <div className="col-4">
                    <div className="h-100 d-flex flex-column p-3">
                      <div className="mb-2">
                        <h3 className="h5 fw-bold mb-2 text-start">
                          📝 Описание
                        </h3>
                      </div>
                      <div className="flex-grow-1">
                        <div className="alert alert-info h-100 d-flex align-items-start p-3">
                          <div 
                            className="mb-0 text-start"
                            dangerouslySetInnerHTML={{ 
                              __html: card.description || 'Описание отсутствует' 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Третья часть: Изображение */}
                  <div className="col-4">
                    <div className="position-relative h-100 d-flex align-items-center justify-content-center p-3">
                      {card.image_path ? (
                        <img
                          src={card.image_path}
                          alt={card.name}
                          className="img-fluid"
                          style={{ 
                            maxHeight: 'calc(100% - 2rem)', 
                            maxWidth: 'calc(100% - 2rem)', 
                            objectFit: 'contain',
                            marginTop: '1rem'
                          }}
                        />
                      ) : (
                        <div className="h-100 bg-light d-flex align-items-center justify-content-center">
                          <div className="text-center text-muted">
                            <div className="display-1 mb-3 opacity-50">
                              🍷
                            </div>
                            <p className="h6">Изображение отсутствует</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Флажок изучения - круг в левом верхнем углу */}
                      {progress && (
                        <div className="position-absolute top-0 start-0 m-3">
                          <div className={`rounded-circle border border-2 ${
                            progress.is_learned 
                              ? 'bg-success border-success' 
                              : 'bg-white border-secondary'
                          }`} style={{ width: '24px', height: '24px' }}>
                            {progress.is_learned && (
                              <div className="w-100 h-100 d-flex align-items-center justify-content-center">
                                <span className="text-white" style={{ fontSize: '12px' }}>✓</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                /* Обычный layout для барных и кухонных карточек */
                <>
                  {/* Изображение */}
                  <div className="col-md-6">
                    <div className="position-relative h-100" style={{ minHeight: '400px' }}>
                      {card.image_path ? (
                        <img
                          src={card.image_path}
                          alt={card.name}
                          className="img-fluid h-100 w-100 object-fit-cover"
                        />
                      ) : (
                        <div className="h-100 bg-light d-flex align-items-center justify-content-center">
                          <div className="text-center text-muted">
                            <div className="display-1 mb-3 opacity-50">
                              {card.category === 'bar' ? '🍸' : '🍽️'}
                            </div>
                            <p className="h5">Изображение отсутствует</p>
                          </div>
                        </div>
                      )}
                      {card.category && (
                        <span className={`position-absolute top-0 start-0 m-3 badge fs-6 ${
                          card.category === 'bar' ? 'bg-primary' : 'bg-success'
                        }`}>
                          {card.category === 'bar' ? '🍸 Барная карта' : '🍽️ Кухня'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Информация о товаре */}
                  <div className="col-md-6">
                    <div className="card-body h-100 d-flex flex-column p-4">
                      <div className="mb-4">
                        <h1 className="display-6 fw-bold text-primary mb-3 text-start">
                          {card.name}
                        </h1>
                        <span className={`badge fs-6 ${
                          card.category === 'bar' ? 'bg-primary' : 'bg-success'
                        }`}>
                          {card.category === 'bar' ? '🍸 Бар' : '🍽️ Кухня'}
                        </span>
                      </div>

                  {/* Описание */}
                  <div className="mb-4">
                    <h3 className="h4 fw-bold mb-3 text-start">
                      📝 Описание
                    </h3>
                    <div className="alert alert-info">
                      <div 
                        className="mb-0 text-start"
                        dangerouslySetInnerHTML={{ 
                          __html: card.description || 'Описание отсутствует' 
                        }}
                      />
                    </div>
                  </div>

                  {/* Ингредиенты */}
                  {card.ingredients && (
                    <div className="mb-4">
                      <h3 className="h4 fw-bold mb-3 text-start">
                        🥘 Ингредиенты
                      </h3>
                      <div className="alert alert-success">
                        <div 
                          className="mb-0 text-start"
                          dangerouslySetInnerHTML={{ __html: card.ingredients }}
                        />
                      </div>
                    </div>
                  )}

                      {/* Кнопки действий */}
                      <div className="mt-auto">
                        <div className="d-grid gap-2 d-md-flex">
                          <button
                            onClick={() => window.history.back()}
                            className="btn btn-outline-secondary btn-lg flex-fill"
                          >
                            ← Назад
                          </button>
                          <button
                            onClick={handleMarkLearned}
                            disabled={markingLearned || (progress && progress.is_learned)}
                            className={`btn btn-lg flex-fill ${
                              progress && progress.is_learned 
                                ? 'btn-success' 
                                : 'btn-outline-success'
                            }`}
                          >
                            {markingLearned ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Обработка...
                              </>
                            ) : progress && progress.is_learned ? (
                              <>
                                ✅ Изучено
                              </>
                            ) : (
                              <>
                                📚 Отметить как изученное
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

export default function Catalog() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [cardProgress, setCardProgress] = useState({});

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const response = await api.get("/menu/");
        setItems(response.data);
        
        // Загружаем прогресс для всех карточек
        const progressPromises = response.data.map(item => 
          api.get(`/menu/${item.id}/progress`).catch(() => null)
        );
        
        const progressResults = await Promise.all(progressPromises);
        const progressMap = {};
        
        response.data.forEach((item, index) => {
          if (progressResults[index]) {
            progressMap[item.id] = progressResults[index].data;
          }
        });
        
        setCardProgress(progressMap);
      } catch (err) {
        setError('Ошибка загрузки каталога');
        console.error('Error fetching items:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  // Получаем уникальные категории
  const categories = [...new Set(items.map(item => item.category).filter(Boolean))];

  // Фильтрация товаров
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка каталога...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Ошибка загрузки</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Заголовок */}
      <div className="row mb-4">
        <div className="col-12 text-center">
          <h1 className="display-4 fw-bold text-primary mb-3">
            🍽️ Меню и барная карта
          </h1>
          <p className="lead text-muted">Изучайте карточки блюд и напитков с подробными описаниями</p>
        </div>
      </div>

      {/* Фильтры */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="row g-3">
                {/* Поиск */}
                <div className="col-md-6">
                  <label htmlFor="search" className="form-label fw-semibold">
                    🔍 Поиск по названию или описанию
                  </label>
                  <input
                    type="text"
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Введите название или описание..."
                    className="form-control form-control-lg"
                  />
                </div>

                {/* Категория */}
                <div className="col-md-6">
                  <label htmlFor="category" className="form-label fw-semibold">
                    📂 Категория
                  </label>
                  <select
                    id="category"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="form-select form-select-lg"
                  >
                    <option value="">Все категории</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category === 'bar' ? '🍸 Бар' : category === 'kitchen' ? '🍽️ Кухня' : '🍷 Винная карта'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Результаты */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="alert alert-info d-inline-block">
            <strong>Найдено товаров: {filteredItems.length}</strong>
          </div>
        </div>
      </div>

      {/* Плиточная сетка товаров */}
      {filteredItems.length === 0 ? (
        <div className="row">
          <div className="col-12 text-center py-5">
            <div className="display-1 mb-4">🔍</div>
            <h3 className="h2 text-muted mb-3">Товары не найдены</h3>
            <p className="lead text-muted">Попробуйте изменить параметры поиска</p>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {filteredItems.map((item) => (
            <div key={item.id} className="col-6 col-sm-4 col-md-3 col-lg-2">
              <Link
                to={`/menu/${item.id}`}
                className={`card h-100 text-decoration-none shadow-sm hover-shadow-lg transition-all ${
                  cardProgress[item.id] && cardProgress[item.id].is_learned 
                    ? 'border-success border-2' 
                    : ''
                }`}
                style={{ aspectRatio: '1/1' }}
              >
                {/* Изображение */}
                <div className="position-relative" style={{ height: '75%' }}>
                  {item.image_path ? (
                    <img
                      src={item.image_path}
                      alt={item.name}
                      className="card-img-top h-100 object-fit-cover"
                    />
                  ) : (
                    <div className="card-img-top h-100 bg-light d-flex align-items-center justify-content-center">
                      <div className="display-4 text-muted opacity-50">
                        {item.category === 'bar' ? '🍸' : item.category === 'kitchen' ? '🍽️' : '🍷'}
                      </div>
                    </div>
                  )}
                  {item.category && (
                    <span className={`position-absolute top-0 start-0 m-2 badge ${
                      item.category === 'bar' ? 'bg-primary' : item.category === 'kitchen' ? 'bg-success' : 'bg-warning'
                    }`}>
                      {item.category === 'bar' ? '🍸 Бар' : item.category === 'kitchen' ? '🍽️ Кухня' : '🍷 Винная карта'}
                    </span>
                  )}
                  {/* Индикатор изучения */}
                  {cardProgress[item.id] && cardProgress[item.id].is_learned && (
                    <span className="position-absolute top-0 end-0 m-2 badge bg-success">
                      ✅ Изучено
                    </span>
                  )}
                </div>

                {/* Информация о товаре */}
                <div className="card-body d-flex align-items-center justify-content-center p-2" style={{ height: '25%' }}>
                  <h6 className="card-title text-center mb-0 text-truncate">
                    {item.name}
                  </h6>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

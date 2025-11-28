import React, { useState, useEffect, useRef } from 'react';
import { FaTimes, FaEdit, FaSave, FaPlus, FaTrash } from 'react-icons/fa';
import { api } from '../api';
import './WheelOfFortune.css';

const WheelOfFortune = ({ onClose }) => {
  const [prizes, setPrizes] = useState([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newItem, setNewItem] = useState({ text: '', color: '#3498db' });
  const [waiters, setWaiters] = useState([]);
  const [loading, setLoading] = useState(true);

  const wheelRef = useRef(null);
  const spinnerRef = useRef(null);
  const tickerRef = useRef(null);
  const rotationRef = useRef(0);
  const currentSliceRef = useRef(0);
  const tickerAnimRef = useRef(null);

  // Генерация цветов для секторов
  const generateColors = (count) => {
    const colors = [
      'hsl(197 30% 43%)',
      'hsl(173 58% 39%)',
      'hsl(43 74% 66%)',
      'hsl(27 87% 67%)',
      'hsl(12 76% 61%)',
      'hsl(350 60% 52%)',
      'hsl(91 43% 54%)',
      'hsl(140 36% 74%)',
      'hsl(240 50% 50%)',
      'hsl(300 50% 50%)',
      'hsl(60 80% 50%)',
      'hsl(180 60% 45%)',
    ];
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(colors[i % colors.length]);
    }
    return result;
  };

  // Загрузка официантов из API
  useEffect(() => {
    const fetchWaiters = async () => {
      try {
        setLoading(true);
        const response = await api.get('/admin/users');
        const waitersList = response.data
          .filter(user => user.is_active && !user.is_pending_verification)
          .map(user => ({
            text: user.full_name || user.email,
            color: generateColors(1)[0]
          }));
        
        if (waitersList.length > 0) {
          const colors = generateColors(waitersList.length);
          const waitersWithColors = waitersList.map((waiter, i) => ({
            ...waiter,
            color: colors[i]
          }));
          setPrizes(waitersWithColors);
        } else {
          // Если нет официантов, используем примерные данные
          setPrizes([
            { text: 'Официант 1', color: 'hsl(197 30% 43%)' },
            { text: 'Официант 2', color: 'hsl(173 58% 39%)' },
            { text: 'Официант 3', color: 'hsl(43 74% 66%)' },
          ]);
        }
      } catch (error) {
        console.error('Ошибка загрузки официантов:', error);
        // Используем примерные данные при ошибке
        setPrizes([
          { text: 'Официант 1', color: 'hsl(197 30% 43%)' },
          { text: 'Официант 2', color: 'hsl(173 58% 39%)' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchWaiters();
  }, []);

  // Создание градиента для колеса
  useEffect(() => {
    if (spinnerRef.current && prizes.length > 0) {
      const colors = prizes.map(p => p.color);
      spinnerRef.current.setAttribute(
        'style',
        `background: conic-gradient(
          from -90deg,
          ${colors
            .map((color, i) => `${color} 0 ${(100 / prizes.length) * (prizes.length - i)}%`)
            .reverse()
            .join(', ')}
        );`
      );
    }
  }, [prizes]);

  const prizeSlice = prizes.length > 0 ? 360 / prizes.length : 0;
  const prizeOffset = prizes.length > 0 ? Math.floor(180 / prizes.length) : 0;

  const spinertia = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const runTickerAnimation = () => {
    if (!spinnerRef.current) return;

    const spinnerStyles = window.getComputedStyle(spinnerRef.current);
    const transform = spinnerStyles.transform;
    
    if (transform === 'none') {
      tickerAnimRef.current = requestAnimationFrame(runTickerAnimation);
      return;
    }

    const values = transform.split('(')[1].split(')')[0].split(',');
    const a = parseFloat(values[0]);
    const b = parseFloat(values[1]);
    let rad = Math.atan2(b, a);

    if (rad < 0) rad += (2 * Math.PI);

    const angle = Math.round(rad * (180 / Math.PI));
    const slice = Math.floor(angle / prizeSlice);

    if (currentSliceRef.current !== slice) {
      if (tickerRef.current) {
        tickerRef.current.style.animation = 'none';
        setTimeout(() => {
          if (tickerRef.current) {
            tickerRef.current.style.animation = null;
          }
        }, 10);
      }
      currentSliceRef.current = slice;
    }

    tickerAnimRef.current = requestAnimationFrame(runTickerAnimation);
  };

  const selectPrize = () => {
    const selected = Math.floor(rotationRef.current / prizeSlice);
    if (selected >= 0 && selected < prizes.length) {
      setSelectedPrize(prizes[selected]);
    }
  };

  const handleSpin = () => {
    if (prizes.length === 0 || isSpinning) return;

    setIsSpinning(true);
    setSelectedPrize(null);
    rotationRef.current = Math.floor(Math.random() * 360 + spinertia(2000, 5000));

    if (wheelRef.current) {
      wheelRef.current.classList.add('is-spinning');
    }
    if (spinnerRef.current) {
      spinnerRef.current.style.setProperty('--rotate', rotationRef.current);
    }
    if (tickerRef.current) {
      tickerRef.current.style.animation = 'none';
    }

    runTickerAnimation();
  };

  const handleTransitionEnd = () => {
    if (tickerAnimRef.current) {
      cancelAnimationFrame(tickerAnimRef.current);
    }

    rotationRef.current %= 360;
    selectPrize();

    if (wheelRef.current) {
      wheelRef.current.classList.remove('is-spinning');
    }
    if (spinnerRef.current) {
      spinnerRef.current.style.setProperty('--rotate', rotationRef.current);
    }

    setIsSpinning(false);
  };

  const handleAddItem = () => {
    if (newItem.text.trim()) {
      const colors = generateColors(prizes.length + 1);
      setPrizes([...prizes, { ...newItem, color: colors[prizes.length] }]);
      setNewItem({ text: '', color: '#3498db' });
    }
  };

  const handleRemoveItem = (index) => {
    const newPrizes = prizes.filter((_, i) => i !== index);
    if (newPrizes.length > 0) {
      const colors = generateColors(newPrizes.length);
      setPrizes(newPrizes.map((p, i) => ({ ...p, color: colors[i] })));
    } else {
      setPrizes([]);
    }
  };

  const handleEditItem = (index, newText) => {
    const newPrizes = [...prizes];
    newPrizes[index].text = newText;
    setPrizes(newPrizes);
  };

  if (loading) {
    return (
      <div className="wheel-modal-overlay">
        <div className="wheel-modal">
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Загрузка...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wheel-modal-overlay" onClick={onClose}>
      <div className="wheel-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wheel-modal-header">
          <h5 className="mb-0">🎰 Колесо фортуны</h5>
          <button className="btn-close" onClick={onClose} />
        </div>

        <div className="wheel-modal-body">
          {isEditing ? (
            <div className="wheel-edit-mode">
              <h6 className="mb-3">Редактирование списка</h6>
              <div className="mb-3">
                {prizes.map((prize, index) => (
                  <div key={index} className="d-flex align-items-center gap-2 mb-2">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={prize.text}
                      onChange={(e) => handleEditItem(index, e.target.value)}
                    />
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleRemoveItem(index)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
                <div className="d-flex align-items-center gap-2">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Новое значение"
                    value={newItem.text}
                    onChange={(e) => setNewItem({ ...newItem, text: e.target.value })}
                  />
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={handleAddItem}
                  >
                    <FaPlus />
                  </button>
                </div>
              </div>
              <button
                className="btn btn-primary w-100"
                onClick={() => setIsEditing(false)}
              >
                <FaSave className="me-2" />
                Сохранить
              </button>
            </div>
          ) : (
            <>
              <div className="deal-wheel" ref={wheelRef}>
                <ul className="spinner" ref={spinnerRef} onTransitionEnd={handleTransitionEnd}>
                  {prizes.map((prize, i) => {
                    const rotation = ((prizeSlice * i) * -1) - prizeOffset;
                    return (
                      <li
                        key={i}
                        className={`prize ${selectedPrize === prize ? 'selected' : ''}`}
                        style={{ '--rotate': `${rotation}deg` }}
                      >
                        <span className="text">{prize.text}</span>
                      </li>
                    );
                  })}
                </ul>
                <div className="ticker" ref={tickerRef}></div>
                <button
                  className="btn-spin"
                  onClick={handleSpin}
                  disabled={isSpinning || prizes.length === 0}
                >
                  {isSpinning ? 'Крутится...' : 'Испытай удачу'}
                </button>
              </div>

              {selectedPrize && (
                <div className="alert alert-success mt-3 text-center">
                  <h5 className="mb-0">🎉 Выпало: {selectedPrize.text}</h5>
                </div>
              )}

              <button
                className="btn btn-outline-secondary w-100 mt-3"
                onClick={() => setIsEditing(true)}
              >
                <FaEdit className="me-2" />
                Редактировать список
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WheelOfFortune;


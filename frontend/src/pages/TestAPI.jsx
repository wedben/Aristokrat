import React, { useState } from 'react';
import { api } from '../api';

const TestAPI = () => {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', {
        email: 'admin@aristokrat.com',
        password: 'Wersaderba12x.---.'
      });
      setResult(`✅ Успешно! Токен: ${response.data.access_token.substring(0, 50)}...`);
    } catch (error) {
      setResult(`❌ Ошибка: ${error.message}`);
      if (error.response) {
        setResult(`❌ Ошибка ${error.response.status}: ${JSON.stringify(error.response.data)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const testHealth = async () => {
    setLoading(true);
    try {
      const response = await api.get('/health');
      setResult(`✅ Health check: ${JSON.stringify(response.data)}`);
    } catch (error) {
      setResult(`❌ Ошибка: ${error.message}`);
      if (error.response) {
        setResult(`❌ Ошибка ${error.response.status}: ${JSON.stringify(error.response.data)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h3>🔧 Тест API</h3>
            </div>
            <div className="card-body">
              <p><strong>API URL:</strong> {api.defaults.baseURL}</p>
              
              <div className="d-grid gap-2 mb-3">
                <button 
                  className="btn btn-primary" 
                  onClick={testHealth}
                  disabled={loading}
                >
                  {loading ? '⏳ Тестируем...' : '🔍 Тест Health Check'}
                </button>
                
                <button 
                  className="btn btn-success" 
                  onClick={testLogin}
                  disabled={loading}
                >
                  {loading ? '⏳ Тестируем...' : '🔐 Тест Авторизации'}
                </button>
              </div>

              {result && (
                <div className="alert alert-info">
                  <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>{result}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestAPI;

import React, { useState } from 'react';
import { X, Lock, LogIn, Loader2 } from 'lucide-react';
import { api } from '../services/api';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (success: boolean) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
        const response = await api.login(username, password);
        if (response.success && response.token) {
            // Token'ı localStorage'a kaydet
            localStorage.setItem('lsv_cafe_token', response.token);
            localStorage.setItem('lsv_cafe_user', JSON.stringify(response.user || { username: 'admin', role: 'admin' }));
            onLogin(true);
            setUsername('');
            setPassword('');
            onClose();
        } else {
            setError(response.message || 'Giriş başarısız.');
        }
    } catch (err) {
        setError('Sunucu hatası. Lütfen tekrar deneyin.');
    } finally {
        setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
          <h2 className="font-bold flex items-center gap-2">
            <Lock size={18} />
            Kullanıcı Girişi
          </h2>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded transition">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Etkinlik oluşturmak için lütfen kullanıcı adı ve şifrenizi giriniz.
          </p>
          
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Kullanıcı Adı</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => { setError(null); setUsername(e.target.value); }}
              className={`w-full p-2 border rounded outline-none focus:ring-2 ${error ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-indigo-500'}`}
              placeholder="Kullanıcı adınız"
              autoFocus
              disabled={loading}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Şifre</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => { setError(null); setPassword(e.target.value); }}
              className={`w-full p-2 border rounded outline-none focus:ring-2 ${error ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-indigo-500'}`}
              placeholder="••••••"
              disabled={loading}
              required
            />
            {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2 rounded transition flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <LogIn size={18} />}
            {loading ? 'Kontrol Ediliyor...' : 'Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  );
};
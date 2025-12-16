import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Key, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { User } from '../../types';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ username: '', password: '', role: 'USER' });
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetUserId, setResetUserId] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Load users error:', error);
      alert('Kullanıcılar yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, formData);
      } else {
        await api.createUser(formData);
      }
      await loadUsers();
      closeModal();
    } catch (error: any) {
      alert(error.message || 'İşlem başarısız.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;
    try {
      await api.deleteUser(id);
      await loadUsers();
    } catch (error: any) {
      alert(error.message || 'Silme başarısız.');
    }
  };

  const openModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({ username: user.username, password: '', role: user.role });
    } else {
      setEditingUser(null);
      setFormData({ username: '', password: '', role: 'USER' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormData({ username: '', password: '', role: 'USER' });
  };

  const openResetModal = (userId: string) => {
    setResetUserId(userId);
    setNewPassword('');
    setIsResetModalOpen(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      alert('Şifre en az 6 karakter olmalı.');
      return;
    }
    try {
      await api.resetPassword(resetUserId, newPassword);
      alert('Şifre başarıyla sıfırlandı.');
      setIsResetModalOpen(false);
      setResetUserId('');
      setNewPassword('');
    } catch (error: any) {
      alert(error.message || 'Şifre sıfırlama başarısız.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800">Kullanıcı Yönetimi</h3>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          <Plus size={18} />
          Yeni Kullanıcı
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kullanıcı Adı</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Oluşturulma</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{user.username}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.role === 'ADMIN'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => openResetModal(user.id)}
                    className="text-yellow-600 hover:text-yellow-900 mr-3"
                    title="Şifre Sıfırla"
                  >
                    <Key size={18} />
                  </button>
                  <button
                    onClick={() => openModal(user)}
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">
              {editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kullanıcı Adı
                </label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Şifre {editingUser && '(boş bırakın değiştirmek istemiyorsanız)'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                  minLength={6}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
                >
                  {editingUser ? 'Güncelle' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Şifre Sıfırla</h3>
            <form onSubmit={handleResetPassword}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Yeni Şifre
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                  minLength={6}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition"
                >
                  Şifreyi Sıfırla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

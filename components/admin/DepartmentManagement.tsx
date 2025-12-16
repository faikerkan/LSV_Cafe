import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { DepartmentConfig } from '../../types';

const DepartmentManagement: React.FC = () => {
  const [departments, setDepartments] = useState<DepartmentConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentConfig | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '' });

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const data = await api.getDepartments();
      setDepartments(data);
    } catch (error) {
      console.error('Load departments error:', error);
      alert('Departmanlar yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDept) {
        await api.updateDepartment(editingDept.id, formData);
      } else {
        await api.createDepartment(formData);
      }
      await loadDepartments();
      closeModal();
    } catch (error: any) {
      alert(error.message || 'İşlem başarısız.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu departmanı silmek istediğinize emin misiniz?')) return;
    try {
      await api.deleteDepartment(id);
      await loadDepartments();
    } catch (error: any) {
      alert(error.message || 'Silme başarısız.');
    }
  };

  const openModal = (dept?: DepartmentConfig) => {
    if (dept) {
      setEditingDept(dept);
      setFormData({ name: dept.name, code: dept.code || '' });
    } else {
      setEditingDept(null);
      setFormData({ name: '', code: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDept(null);
    setFormData({ name: '', code: '' });
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
        <h3 className="text-2xl font-bold text-gray-800">Departman Yönetimi</h3>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          <Plus size={18} />
          Yeni Departman
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ad</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kod</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {departments.map((dept) => (
              <tr key={dept.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{dept.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {dept.code || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      dept.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {dept.active ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => openModal(dept)}
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(dept.id)}
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">
              {editingDept ? 'Departman Düzenle' : 'Yeni Departman'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Departman Adı
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kod (Opsiyonel)
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                />
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
                  {editingDept ? 'Güncelle' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentManagement;

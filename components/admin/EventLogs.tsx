import React, { useState, useEffect } from 'react';
import { Loader2, FileText } from 'lucide-react';
import { api } from '../../services/api';
import { EventLog } from '../../types';

const EventLogs: React.FC = () => {
  const [logs, setLogs] = useState<EventLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getAllLogs();
      setLogs(data);
    } catch (error) {
      console.error('Load logs error:', error);
      alert('Loglar yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      create: 'Oluşturuldu',
      update: 'Güncellendi',
      approve: 'Onaylandı',
      reject: 'Reddedildi',
      delete: 'Silindi'
    };
    return labels[action] || action;
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      create: 'bg-blue-100 text-blue-800',
      update: 'bg-yellow-100 text-yellow-800',
      approve: 'bg-green-100 text-green-800',
      reject: 'bg-red-100 text-red-800',
      delete: 'bg-gray-100 text-gray-800'
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
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
        <h3 className="text-2xl font-bold text-gray-800">Etkinlik Logları</h3>
        <button
          onClick={loadLogs}
          className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
        >
          <FileText size={18} />
          Yenile
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Henüz log kaydı yok.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tarih
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Etkinlik
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  İşlem
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Kullanıcı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Detay
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(log.createdAt).toLocaleString('tr-TR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">
                      {log.event?.title || 'Bilinmiyor'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getActionColor(
                        log.action
                      )}`}
                    >
                      {getActionLabel(log.action)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.actor?.username || 'Sistem'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">
                    {log.payload ? (
                      <details>
                        <summary className="cursor-pointer text-indigo-600 hover:text-indigo-800">
                          Detayları gör
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto max-h-40">
                          {JSON.stringify(JSON.parse(log.payload), null, 2)}
                        </pre>
                      </details>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default EventLogs;

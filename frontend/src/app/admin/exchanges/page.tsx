'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminExchangesPage() {
  const { isAdmin } = useAuth();
  const [exchanges, setExchanges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('requested');

  useEffect(() => {
    if (isAdmin) {
      fetchExchanges();
    }
  }, [isAdmin, filter]);

  const fetchExchanges = async () => {
    try {
      const params = filter ? `?status=${filter}` : '';
      const response = await api.get(`/exchanges/admin/all${params}`);
      setExchanges(response.data.data.exchanges || []);
    } catch (error) {
      toast.error('Failed to load exchanges');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string, notes?: string) => {
    const adminNotes = notes || prompt('Add notes (optional):') || '';
    
    try {
      await api.put(`/exchanges/admin/${id}/status`, {
        status,
        admin_notes: adminNotes,
      });
      toast.success('Exchange status updated');
      fetchExchanges();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to update status');
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Exchange Requests</h2>
        <select
          className="form-select"
          style={{ width: 'auto' }}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">All</option>
          <option value="requested">Requested</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div className="card">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" />
            </div>
          ) : exchanges.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">No exchange requests found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Reason</th>
                    <th>Requested On</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {exchanges.map((exchange) => (
                    <tr key={exchange.id}>
                      <td className="fw-medium">{exchange.order_number}</td>
                      <td>
                        <div>{exchange.user_name}</div>
                        <small className="text-muted">{exchange.user_email}</small>
                      </td>
                      <td>
                        <div className="text-capitalize">{exchange.reason.replace(/_/g, ' ')}</div>
                        <small className="text-muted d-block text-truncate" style={{ maxWidth: '200px' }}>
                          {exchange.reason_details}
                        </small>
                      </td>
                      <td>
                        <small>{new Date(exchange.created_at).toLocaleDateString('en-IN')}</small>
                      </td>
                      <td>
                        <span className={`badge ${
                          exchange.status === 'approved' ? 'bg-success' :
                          exchange.status === 'rejected' ? 'bg-danger' :
                          exchange.status === 'completed' ? 'bg-info' :
                          'bg-warning'
                        }`}>
                          {exchange.status}
                        </span>
                      </td>
                      <td>
                        {exchange.status === 'requested' && (
                          <div className="d-flex gap-1">
                            <button
                              onClick={() => handleUpdateStatus(exchange.id, 'approved')}
                              className="btn btn-sm btn-success"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(exchange.id, 'rejected')}
                              className="btn btn-sm btn-danger"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {exchange.status === 'approved' && (
                          <button
                            onClick={() => handleUpdateStatus(exchange.id, 'completed')}
                            className="btn btn-sm btn-primary"
                          >
                            Mark Completed
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

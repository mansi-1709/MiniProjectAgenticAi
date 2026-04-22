import { useState, useEffect } from 'react';
import { medicineAPI, patientAPI, orderAPI, logsAPI, authAPI } from '../api';
import { useToast } from '../context/ToastContext';

// ── Confirm Modal ────────────────────────────────────────────────────────────
function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="modal-panel bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
        <h3 className="text-base font-bold text-slate-900 mb-3">Confirm Action</h3>
        <p className="text-sm text-slate-600 mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
          <button onClick={onConfirm} className="btn-danger flex-1">Confirm</button>
        </div>
      </div>
    </div>
  );
}

// ── Stock Edit Modal ─────────────────────────────────────────────────────────
function StockEditModal({ medicine, onClose, onSave }) {
  const [value, setValue] = useState(String(medicine.stockQty));
  const showToast = useToast();

  const handleSave = () => {
    const num = parseInt(value);
    if (isNaN(num) || num < 0) {
      showToast('Enter a valid non-negative number.', 'warning');
      return;
    }
    onSave(num);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="modal-panel bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-bold text-slate-900 mb-1">Update Stock</h3>
        <p className="text-sm text-slate-500 mb-4">
          <span className="font-semibold text-slate-700">{medicine.name}</span> — current: {medicine.stockQty}
        </p>
        <input
          type="number"
          min="0"
          className="input-field text-lg font-semibold mb-4"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
        />
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} className="btn-primary flex-1">Save</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const showToast = useToast();
  const [activeTab, setActiveTab] = useState('medicines');
  const [medicines, setMedicines] = useState([]);
  const [patients, setPatients] = useState([]);
  const [orders, setOrders] = useState([]);
  const [logs, setLogs] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const [medicineForm, setMedicineForm] = useState({
    name: '', unit: 'tablet', price: '', stockQty: '',
    minStockThreshold: '', prescriptionRequired: false,
  });

  // Modals
  const [stockEditModal, setStockEditModal] = useState(null);   // medicine object
  const [confirmModal, setConfirmModal] = useState(null);       // { message, onConfirm }

  useEffect(() => { fetchData(); }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'medicines') {
        const res = await medicineAPI.getAll();
        setMedicines(res.data.medicines || []);
      } else if (activeTab === 'patients') {
        const res = await patientAPI.getAll();
        setPatients(res.data.patients || []);
      } else if (activeTab === 'orders') {
        const res = await orderAPI.getAll();
        setOrders(res.data.orders || []);
      } else if (activeTab === 'logs') {
        const res = await logsAPI.getAll(200);
        setLogs(res.data.logs || []);
      } else if (activeTab === 'users') {
        const [pendingRes, allUsersRes] = await Promise.all([
          authAPI.getPendingUsers(),
          authAPI.getAllUsers(),
        ]);
        setPendingUsers(pendingRes.data.data.users || []);
        setAllUsers(allUsersRes.data.data.users || []);
      }
    } catch (err) {
      showToast('Failed to load data. Please refresh.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    try {
      await medicineAPI.add(medicineForm);
      showToast(`Medicine "${medicineForm.name}" added successfully!`, 'success');
      setMedicineForm({ name: '', unit: 'tablet', price: '', stockQty: '', minStockThreshold: '', prescriptionRequired: false });
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error adding medicine.', 'error');
    }
  };

  const handleUpdateStock = async (medicine) => {
    setStockEditModal(medicine);
  };

  const doUpdateStock = async (medicineId, newStock) => {
    try {
      await medicineAPI.updateStock(medicineId, newStock);
      showToast('Stock updated successfully!', 'success');
      fetchData();
    } catch {
      showToast('Error updating stock.', 'error');
    }
  };

  const handleApproveUser = (userId, userName) => {
    setConfirmModal({
      message: `Approve pharmacist "${userName}"? They will gain access to the system.`,
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await authAPI.approveUser(userId);
          showToast('User approved successfully!', 'success');
          fetchData();
        } catch {
          showToast('Error approving user.', 'error');
        }
      },
    });
  };

  const handleRejectUser = (userId, userName) => {
    setConfirmModal({
      message: `Reject registration for "${userName}"? This action cannot be undone.`,
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await authAPI.rejectUser(userId);
          showToast('User rejected.', 'info');
          fetchData();
        } catch {
          showToast('Error rejecting user.', 'error');
        }
      },
    });
  };

  const TABS = [
    { id: 'medicines', label: 'Medicines', icon: '💊' },
    { id: 'patients',  label: 'Patients',  icon: '👥' },
    { id: 'orders',    label: 'Orders',    icon: '📦' },
    { id: 'logs',      label: 'Logs',      icon: '📋' },
    { id: 'users',     label: 'Users',     icon: '👤' },
  ];

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-slate-100 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="card mb-6 flex items-center justify-between">
          <div>
            <h1 className="section-title">Admin Dashboard</h1>
            <p className="muted-text mt-1">Manage medicines, patients, orders and system activity</p>
          </div>
          <div className="hidden md:flex items-center gap-2 rounded-full bg-primary-50 border border-primary-200 px-4 py-2 text-sm font-medium text-primary-800">
            👑 {currentUser.role === 'super_admin' ? 'Super Admin' : 'Admin'}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-btn ${activeTab === tab.id ? 'tab-btn-active' : 'tab-btn-inactive'}`}
            >
              {tab.icon} {tab.label}
              {tab.id === 'users' && pendingUsers.length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-red-500 text-white rounded-full">
                  {pendingUsers.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="card">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="spinner" />
            </div>
          ) : (
            <>
              {/* ── MEDICINES TAB ── */}
              {activeTab === 'medicines' && (
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-5">Medicine Management</h2>

                  {/* Add Medicine Form */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6">
                    <h3 className="font-bold text-base text-slate-800 mb-4">➕ Add New Medicine</h3>
                    <form onSubmit={handleAddMedicine} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input type="text" placeholder="Medicine Name" className="input-field"
                        value={medicineForm.name} onChange={(e) => setMedicineForm({ ...medicineForm, name: e.target.value })} required />
                      <select className="input-field" value={medicineForm.unit}
                        onChange={(e) => setMedicineForm({ ...medicineForm, unit: e.target.value })}>
                        <option value="tablet">Tablet</option>
                        <option value="capsule">Capsule</option>
                        <option value="syrup">Syrup</option>
                        <option value="injection">Injection</option>
                        <option value="cream">Cream</option>
                        <option value="drops">Drops</option>
                      </select>
                      <input type="number" placeholder="Price (₹)" className="input-field"
                        value={medicineForm.price} onChange={(e) => setMedicineForm({ ...medicineForm, price: e.target.value })} required />
                      <input type="number" placeholder="Stock Quantity" className="input-field"
                        value={medicineForm.stockQty} onChange={(e) => setMedicineForm({ ...medicineForm, stockQty: e.target.value })} required />
                      <input type="number" placeholder="Min Stock Threshold" className="input-field"
                        value={medicineForm.minStockThreshold} onChange={(e) => setMedicineForm({ ...medicineForm, minStockThreshold: e.target.value })} required />
                      <label className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                        <input type="checkbox" checked={medicineForm.prescriptionRequired}
                          onChange={(e) => setMedicineForm({ ...medicineForm, prescriptionRequired: e.target.checked })} />
                        <span className="text-sm text-slate-700">Prescription Required</span>
                      </label>
                      <button type="submit" className="btn-primary md:col-span-3">Add Medicine</button>
                    </form>
                  </div>

                  {/* Medicines Table */}
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100">
                        <tr>
                          {['Medicine','Unit','Price','Stock','Threshold','Rx','Actions'].map((h) => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {medicines.map((med) => (
                          <tr key={med._id} className={`border-t border-slate-100 hover:bg-slate-50 transition-colors ${med.stockQty <= med.minStockThreshold ? 'bg-red-50/30' : ''}`}>
                            <td className="px-4 py-3 font-semibold text-slate-900">{med.name}</td>
                            <td className="px-4 py-3 text-slate-500 capitalize">{med.unit}</td>
                            <td className="px-4 py-3">₹{med.price}</td>
                            <td className={`px-4 py-3 font-bold ${med.stockQty <= med.minStockThreshold ? 'text-red-600' : 'text-emerald-700'}`}>{med.stockQty}</td>
                            <td className="px-4 py-3 text-slate-500">{med.minStockThreshold}</td>
                            <td className="px-4 py-3">{med.prescriptionRequired ? '✅' : '❌'}</td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleUpdateStock(med)}
                                className="text-xs px-3 py-1.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors font-medium"
                              >
                                Update Stock
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── PATIENTS TAB ── */}
              {activeTab === 'patients' && (
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-5">Registered Patients ({patients.length})</h2>
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100">
                        <tr>
                          {['Name','Phone','Age','Registered'].map((h) => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {patients.map((pt) => (
                          <tr key={pt._id} className="border-t border-slate-100 hover:bg-slate-50">
                            <td className="px-4 py-3 font-semibold text-slate-900">{pt.name}</td>
                            <td className="px-4 py-3">{pt.phone}</td>
                            <td className="px-4 py-3 text-center">{pt.age}</td>
                            <td className="px-4 py-3 text-slate-500 text-sm">{new Date(pt.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── ORDERS TAB ── */}
              {activeTab === 'orders' && (
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-5">Order History ({orders.length})</h2>
                  <div className="space-y-3">
                    {orders.map((order) => (
                      <div key={order._id} className="border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-semibold text-slate-900">{order.patientId?.name || 'Unknown Patient'}</p>
                            <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleString()}</p>
                          </div>
                          <span className={`status-chip ${order.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-3">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm mb-1">
                              <span>{item.medicineName} × {item.quantity}</span>
                              <span className="font-medium">₹{item.subtotal}</span>
                            </div>
                          ))}
                          <div className="border-t mt-2 pt-2 flex justify-between font-bold text-sm">
                            <span>Total:</span>
                            <span className="text-primary-600">₹{order.totalAmount}</span>
                          </div>
                        </div>
                        {order.rejectionReason && (
                          <p className="text-xs text-red-600 mt-2">Reason: {order.rejectionReason}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── LOGS TAB ── */}
              {activeTab === 'logs' && (
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-5">Execution Logs ({logs.length})</h2>
                  <div className="space-y-3">
                    {logs.map((log) => (
                      <div key={log._id} className="border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">{log.agentName}</span>
                            <span className="text-xs text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                          </div>
                          {log.executionTimeMs && (
                            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{log.executionTimeMs}ms</span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <p className="font-semibold text-slate-500 mb-1 uppercase tracking-wide">Input</p>
                            <pre className="bg-slate-50 border border-slate-200 p-2 rounded-lg overflow-x-auto font-mono">
                              {JSON.stringify(log.input, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-500 mb-1 uppercase tracking-wide">Output</p>
                            <pre className="bg-slate-50 border border-slate-200 p-2 rounded-lg overflow-x-auto font-mono">
                              {JSON.stringify(log.output, null, 2)}
                            </pre>
                          </div>
                        </div>
                        {log.reasoning && (
                          <div className="mt-3 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800">
                            <span className="font-semibold">Reasoning: </span>{log.reasoning}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── USERS TAB ── */}
              {activeTab === 'users' && (
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-5">User Management</h2>

                  {pendingUsers.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-base font-bold text-amber-700 mb-3 flex items-center gap-2">
                        ⏳ Pending Approvals
                        <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold bg-amber-500 text-white rounded-full">{pendingUsers.length}</span>
                      </h3>
                      <div className="space-y-3">
                        {pendingUsers.map((user) => (
                          <div key={user._id} className="border border-amber-200 bg-amber-50 rounded-xl p-4 flex justify-between items-center gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-slate-900">{user.name}</h4>
                                <span className={`status-chip text-xs ${user.role === 'super_admin' ? 'bg-red-100 text-red-800' : user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                  {user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Doctor' : 'Pharmacist'}
                                </span>
                              </div>
                              <p className="text-sm text-slate-600">{user.email}</p>
                              <p className="text-xs text-slate-400 mt-1">Registered: {new Date(user.createdAt).toLocaleString()}</p>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <button
                                onClick={() => handleApproveUser(user._id, user.name)}
                                className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold transition-colors"
                              >
                                ✓ Approve
                              </button>
                              <button
                                onClick={() => handleRejectUser(user._id, user.name)}
                                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors"
                              >
                                ✗ Reject
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-base font-bold text-slate-700 mb-3">All Users ({allUsers.filter((u) => u._id !== currentUser._id).length})</h3>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-100">
                          <tr>
                            {['Name','Email','Phone','Role','Status','Registered'].map((h) => (
                              <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {allUsers.filter((u) => u._id !== currentUser._id).map((user) => (
                            <tr key={user._id} className="border-t border-slate-100 hover:bg-slate-50">
                              <td className="px-4 py-3 font-medium text-slate-900">{user.name}</td>
                              <td className="px-4 py-3 text-slate-600">{user.email}</td>
                              <td className="px-4 py-3 text-slate-600">{user.phone || '—'}</td>
                              <td className="px-4 py-3">
                                <span className={`status-chip ${user.role === 'super_admin' ? 'bg-red-100 text-red-800' : user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                  {user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Doctor' : 'Pharmacist'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`status-chip ${user.status === 'active' ? 'bg-emerald-100 text-emerald-800' : user.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                                  {user.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-500 text-xs">{new Date(user.createdAt).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Stock Edit Modal */}
      {stockEditModal && (
        <StockEditModal
          medicine={stockEditModal}
          onClose={() => setStockEditModal(null)}
          onSave={(newQty) => doUpdateStock(stockEditModal._id, newQty)}
        />
      )}

      {/* Confirm Modal */}
      {confirmModal && (
        <ConfirmModal
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { medicineAPI, patientAPI, orderAPI, logsAPI, authAPI } from '../api';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('medicines');
  const [medicines, setMedicines] = useState([]);
  const [patients, setPatients] = useState([]);
  const [orders, setOrders] = useState([]);
  const [logs, setLogs] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Get current user from localStorage
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  // Medicine form
  const [medicineForm, setMedicineForm] = useState({
    name: '',
    unit: 'tablet',
    price: '',
    stockQty: '',
    minStockThreshold: '',
    prescriptionRequired: false,
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

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
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    try {
      await medicineAPI.add(medicineForm);
      alert('Medicine added successfully!');
      setMedicineForm({
        name: '',
        unit: 'tablet',
        price: '',
        stockQty: '',
        minStockThreshold: '',
        prescriptionRequired: false,
      });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error adding medicine');
    }
  };

  const handleUpdateStock = async (id, currentStock) => {
    const newStock = prompt(`Enter new stock quantity (current: ${currentStock}):`, currentStock);
    if (newStock !== null) {
      try {
        await medicineAPI.updateStock(id, parseInt(newStock));
        alert('Stock updated successfully!');
        fetchData();
      } catch (error) {
        alert('Error updating stock');
      }
    }
  };

  const handleApproveUser = async (userId) => {
    if (confirm('Approve this pharmacist registration?')) {
      try {
        await authAPI.approveUser(userId);
        alert('User approved successfully!');
        fetchData();
      } catch (error) {
        alert('Error approving user');
      }
    }
  };

  const handleRejectUser = async (userId) => {
    if (confirm('Reject this pharmacist registration?')) {
      try {
        await authAPI.rejectUser(userId);
        alert('User rejected');
        fetchData();
      } catch (error) {
        alert('Error rejecting user');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <span className="text-4xl">⚙️</span>
            Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Manage medicines, patients, orders & logs</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { id: 'medicines', label: '💊 Medicines', icon: '💊' },
            { id: 'patients', label: '👥 Patients', icon: '👥' },
            { id: 'orders', label: '📦 Orders', icon: '📦' },
            { id: 'logs', label: '📋 Agent Logs', icon: '📋' },
            { id: 'users', label: '👤 User Management', icon: '👤' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-primary-600 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="card">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="spinner"></div>
            </div>
          ) : (
            <>
              {/* Medicines Tab */}
              {activeTab === 'medicines' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Medicine Management</h2>
                  
                  {/* Add Medicine Form */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                    <h3 className="font-bold text-lg mb-4">Add New Medicine</h3>
                    <form onSubmit={handleAddMedicine} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input
                        type="text"
                        placeholder="Medicine Name"
                        className="input-field"
                        value={medicineForm.name}
                        onChange={(e) => setMedicineForm({ ...medicineForm, name: e.target.value })}
                        required
                      />
                      <select
                        className="input-field"
                        value={medicineForm.unit}
                        onChange={(e) => setMedicineForm({ ...medicineForm, unit: e.target.value })}
                      >
                        <option value="tablet">Tablet</option>
                        <option value="capsule">Capsule</option>
                        <option value="syrup">Syrup</option>
                        <option value="injection">Injection</option>
                        <option value="cream">Cream</option>
                        <option value="drops">Drops</option>
                      </select>
                      <input
                        type="number"
                        placeholder="Price (₹)"
                        className="input-field"
                        value={medicineForm.price}
                        onChange={(e) => setMedicineForm({ ...medicineForm, price: e.target.value })}
                        required
                      />
                      <input
                        type="number"
                        placeholder="Stock Quantity"
                        className="input-field"
                        value={medicineForm.stockQty}
                        onChange={(e) => setMedicineForm({ ...medicineForm, stockQty: e.target.value })}
                        required
                      />
                      <input
                        type="number"
                        placeholder="Min Stock Threshold"
                        className="input-field"
                        value={medicineForm.minStockThreshold}
                        onChange={(e) => setMedicineForm({ ...medicineForm, minStockThreshold: e.target.value })}
                        required
                      />
                      <label className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg">
                        <input
                          type="checkbox"
                          checked={medicineForm.prescriptionRequired}
                          onChange={(e) =>
                            setMedicineForm({ ...medicineForm, prescriptionRequired: e.target.checked })
                          }
                        />
                        <span className="text-sm">Prescription Required</span>
                      </label>
                      <button type="submit" className="btn-primary md:col-span-3">
                        ➕ Add Medicine
                      </button>
                    </form>
                  </div>

                  {/* Medicines Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-3 text-left">Medicine</th>
                          <th className="p-3 text-left">Unit</th>
                          <th className="p-3 text-right">Price</th>
                          <th className="p-3 text-right">Stock</th>
                          <th className="p-3 text-right">Threshold</th>
                          <th className="p-3 text-center">Prescription</th>
                          <th className="p-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {medicines.map((med) => (
                          <tr key={med._id} className="border-b hover:bg-gray-50">
                            <td className="p-3 font-medium">{med.name}</td>
                            <td className="p-3 text-sm text-gray-600">{med.unit}</td>
                            <td className="p-3 text-right">₹{med.price}</td>
                            <td className={`p-3 text-right font-semibold ${
                              med.stockQty <= med.minStockThreshold ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {med.stockQty}
                            </td>
                            <td className="p-3 text-right text-gray-600">{med.minStockThreshold}</td>
                            <td className="p-3 text-center">
                              {med.prescriptionRequired ? '✅' : '❌'}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => handleUpdateStock(med._id, med.stockQty)}
                                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
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

              {/* Patients Tab */}
              {activeTab === 'patients' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Registered Patients ({patients.length})</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-3 text-left">Name</th>
                          <th className="p-3 text-left">Phone</th>
                          <th className="p-3 text-center">Age</th>
                          <th className="p-3 text-left">Registered On</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patients.map((patient) => (
                          <tr key={patient._id} className="border-b hover:bg-gray-50">
                            <td className="p-3 font-medium">{patient.name}</td>
                            <td className="p-3">{patient.phone}</td>
                            <td className="p-3 text-center">{patient.age}</td>
                            <td className="p-3 text-sm text-gray-600">
                              {new Date(patient.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Orders Tab */}
              {activeTab === 'orders' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Order History ({orders.length})</h2>
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-semibold">
                              {order.patientId?.name || 'Unknown Patient'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {new Date(order.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            order.status === 'APPROVED'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="bg-gray-50 rounded p-3">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm mb-1">
                              <span>{item.medicineName} × {item.quantity}</span>
                              <span className="font-medium">₹{item.subtotal}</span>
                            </div>
                          ))}
                          <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                            <span>Total:</span>
                            <span className="text-primary-600">₹{order.totalAmount}</span>
                          </div>
                        </div>
                        {order.rejectionReason && (
                          <p className="text-sm text-red-600 mt-2">
                            Reason: {order.rejectionReason}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Logs Tab */}
              {activeTab === 'logs' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">AI Agent Execution Logs ({logs.length})</h2>
                  <div className="space-y-3">
                    {logs.map((log) => (
                      <div key={log._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                              {log.agentName}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>
                          {log.executionTimeMs && (
                            <span className="text-xs text-gray-600">
                              ⚡ {log.executionTimeMs}ms
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="font-semibold text-gray-700 mb-1">Input:</p>
                            <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                              {JSON.stringify(log.input, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-700 mb-1">Output:</p>
                            <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                              {JSON.stringify(log.output, null, 2)}
                            </pre>
                          </div>
                        </div>
                        
                        {log.reasoning && (
                          <div className="mt-3 p-2 bg-blue-50 rounded text-sm">
                            <span className="font-semibold">Reasoning:</span> {log.reasoning}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Users Tab */}
              {activeTab === 'users' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">User Management</h2>
                  
                  {/* Pending Approvals */}
                  {pendingUsers.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-xl font-bold mb-4 text-orange-600">
                        🔔 Pending Approvals ({pendingUsers.length})
                      </h3>
                      <div className="space-y-4">
                        {pendingUsers.map((user) => (
                          <div 
                            key={user._id} 
                            className="border border-orange-200 bg-orange-50 rounded-lg p-4"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="font-bold text-lg">{user.name}</h4>
                                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                    user.role === 'super_admin' 
                                      ? 'bg-red-100 text-red-800'
                                      : user.role === 'admin' 
                                      ? 'bg-purple-100 text-purple-800' 
                                      : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {user.role === 'super_admin' ? '👑 Super Admin' : user.role === 'admin' ? '👨‍⚕️ Doctor' : '💊 Pharmacist'}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600">{user.email}</p>
                                {user.phone && (
                                  <p className="text-sm text-gray-600">📞 {user.phone}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-2">
                                  Registered: {new Date(user.createdAt).toLocaleString()}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleApproveUser(user._id)}
                                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                                >
                                  ✓ Approve
                                </button>
                                <button
                                  onClick={() => handleRejectUser(user._id)}
                                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                                >
                                  ✗ Reject
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* All Users */}
                  <div>
                    <h3 className="text-xl font-bold mb-4">All Users ({allUsers.filter(u => u._id !== currentUser._id).length})</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Phone</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Role</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Registered</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allUsers.filter(u => u._id !== currentUser._id).map((user) => (
                            <tr key={user._id} className="border-t border-gray-200 hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm">{user.name}</td>
                              <td className="px-4 py-3 text-sm">{user.email}</td>
                              <td className="px-4 py-3 text-sm">{user.phone || '-'}</td>
                              <td className="px-4 py-3 text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  user.role === 'super_admin' 
                                    ? 'bg-red-100 text-red-800'
                                    : user.role === 'admin' 
                                    ? 'bg-purple-100 text-purple-800' 
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {user.role === 'super_admin' ? '👑 Super Admin' : user.role === 'admin' ? '👨‍⚕️ Doctor' : '💊 Pharmacist'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  user.status === 'active' 
                                    ? 'bg-green-100 text-green-800' 
                                    : user.status === 'pending'
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {user.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {new Date(user.createdAt).toLocaleDateString()}
                              </td>
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
    </div>
  );
}

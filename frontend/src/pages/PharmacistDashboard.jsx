import { useState, useEffect } from 'react';
import { patientAPI, orderAPI, medicineAPI, patientHistoryAPI } from '../api';

export default function PharmacistDashboard() {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patients, setPatients] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [bill, setBill] = useState(null);
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [patientHistory, setPatientHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Form states
  const [patientForm, setPatientForm] = useState({
    name: '',
    phone: '',
    age: '',
  });
  const [searchPhone, setSearchPhone] = useState('');

  useEffect(() => {
    fetchPatients();
    fetchLowStock();
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await patientAPI.getAll();
      setPatients(res.data.patients || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const fetchLowStock = async () => {
    try {
      const res = await medicineAPI.getLowStock();
      setLowStockAlerts(res.data.medicines || []);
    } catch (error) {
      console.error('Error fetching low stock:', error);
    }
  };

  const handleRegisterPatient = async (e) => {
    e.preventDefault();
    try {
      const res = await patientAPI.register(patientForm);
      alert(res.data.message);
      setPatientForm({ name: '', phone: '', age: '' });
      setShowPatientForm(false);
      fetchPatients();
    } catch (error) {
      alert(error.response?.data?.message || 'Error registering patient');
    }
  };

  const handleSearchPatient = async () => {
    try {
      const res = await patientAPI.getByPhone(searchPhone);
      setSelectedPatient(res.data.patient);
      setResponse(null);
      setBill(null);
      setPatientHistory([]);
      setShowHistory(false);
      // Load patient medication history
      loadPatientHistory(res.data.patient._id);
    } catch (error) {
      alert('Patient not found');
    }
  };

  const loadPatientHistory = async (patientId) => {
    try {
      const res = await patientHistoryAPI.getMedicationHistory(patientId);
      setPatientHistory(res.data.medicationHistory || []);
      setShowHistory(true);
    } catch (error) {
      console.error('Error loading patient history:', error);
      setPatientHistory([]);
      setShowHistory(true);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!selectedPatient) {
      alert('Please select a patient first');
      return;
    }

    setLoading(true);
    setResponse(null);
    setBill(null);
    setRecommendations(null);

    try {
      // Use the new conversational endpoint
      const res = await orderAPI.processConversational({
        message,
        patientId: selectedPatient._id,
      });

      setResponse(res.data);
      
      // Handle recommendations
      if (res.data.status === 'RECOMMENDATION_NEEDED') {
        setRecommendations(res.data.recommendations);
      } else if (res.data.status === 'APPROVED') {
        setBill(res.data.bill);
      }
      
      setMessage('');
      fetchLowStock(); // Refresh low stock alerts
    } catch (error) {
      setResponse({
        success: false,
        message: error.response?.data?.message || 'Error processing order',
        status: 'ERROR',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRecommendation = async (medicineName, quantity = 1) => {
    setLoading(true);
    setResponse(null);
    setBill(null);
    setRecommendations(null);

    try {
      const res = await orderAPI.processChat({
        message: `Give ${quantity} ${medicineName}`,
        patientId: selectedPatient._id,
      });

      setResponse(res.data);
      if (res.data.status === 'APPROVED') {
        setBill(res.data.bill);
      }
      fetchLowStock();
    } catch (error) {
      setResponse({
        success: false,
        message: error.response?.data?.message || 'Error processing order',
        status: 'ERROR',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <span className="text-4xl">🏥</span>
            AI Pharmacy - Pharmacist Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Powered by Intelligent AI Agents</p>
        </div>

        {/* Low Stock Alerts */}
        {lowStockAlerts.length > 0 && (
          <div className="alert alert-warning mb-6 flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-semibold">Low Stock Alert!</p>
              <p className="text-sm">
                {lowStockAlerts.map((med, i) => (
                  <span key={med._id}>
                    {med.name} ({med.stockQty} left)
                    {i < lowStockAlerts.length - 1 && ', '}
                  </span>
                ))}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Patient Management */}
          <div className="lg:col-span-1 space-y-6">
            {/* Register Patient */}
            <div className="card">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span>👤</span> Patient Management
              </h2>
              
              {!showPatientForm ? (
                <button
                  onClick={() => setShowPatientForm(true)}
                  className="btn-primary w-full mb-4"
                >
                  + Register New Patient
                </button>
              ) : (
                <form onSubmit={handleRegisterPatient} className="space-y-3 mb-4">
                  <input
                    type="text"
                    placeholder="Patient Name"
                    className="input-field"
                    value={patientForm.name}
                    onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })}
                    required
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number (10 digits)"
                    className="input-field"
                    value={patientForm.phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setPatientForm({ ...patientForm, phone: value });
                    }}
                    pattern="[789][0-9]{9}"
                    maxLength="10"
                    title="Enter 10-digit phone number starting with 7, 8, or 9"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Age"
                    className="input-field"
                    value={patientForm.age}
                    onChange={(e) => setPatientForm({ ...patientForm, age: e.target.value })}
                    required
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary flex-1">
                      Register
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPatientForm(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Search Patient */}
              <div className="border-t pt-4">
                <label className="block text-sm font-semibold mb-2">Search Patient</label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    placeholder="Phone Number (10 digits)"
                    className="input-field"
                    value={searchPhone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setSearchPhone(value);
                    }}
                    pattern="[789][0-9]{9}"
                    maxLength="10"
                    title="Enter 10-digit phone number starting with 7, 8, or 9"
                  />
                  <button onClick={handleSearchPatient} className="btn-primary">
                    🔍
                  </button>
                </div>
              </div>

              {/* Selected Patient */}
              {selectedPatient && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-green-800">Selected Patient:</p>
                      <p className="text-sm text-green-700">{selectedPatient.name}</p>
                      <p className="text-xs text-green-600">
                        {selectedPatient.phone} • {selectedPatient.age} years
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => loadPatientHistory(selectedPatient._id)}
                    className="btn-secondary text-xs w-full mt-2"
                  >
                    📜 Load Medication History
                  </button>
                </div>
              )}
            </div>

            {/* Patient Medication History */}
            {selectedPatient && showHistory && patientHistory.length === 0 && (
              <div className="card">
                <div className="text-center p-6">
                  <p className="text-gray-500 text-sm">📋 No medication history found</p>
                  <p className="text-gray-400 text-xs mt-1">This patient has no approved orders yet</p>
                </div>
              </div>
            )}

            {selectedPatient && patientHistory.length > 0 && (
              <div className="card">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <span>📜</span> Medication History
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {patientHistory.map((order, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-800">
                            {order.medicines?.map(m => m.name).join(', ') || 'N/A'}
                          </p>
                          {order.medicines?.map((med, i) => (
                            <p key={i} className="text-xs text-gray-600 mt-1">
                              💊 {med.quantity} units
                              {med.dosageDuration && med.dosageDuration !== 'Not specified' && ` • ${med.dosageDuration}`}
                              {med.totalDaysSupply > 0 && ` • ${med.totalDaysSupply} days`}
                            </p>
                          ))}
                        </div>
                        <div className="text-right ml-2">
                          <p className="text-xs text-gray-500">
                            {new Date(order.date).toLocaleDateString()}
                          </p>
                          <p className="text-xs font-semibold text-green-700 mt-1">
                            ₹{order.totalAmount}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Patients */}
            <div className="card">
              <h3 className="font-bold mb-3">Recent Patients</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {patients.slice(0, 10).map((patient) => (
                  <button
                    key={patient._id}
                    onClick={() => {
                      setSelectedPatient(patient);
                      setSearchPhone(patient.phone);
                      setShowHistory(false);
                      setPatientHistory([]);
                    }}
                    className="w-full text-left p-3 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
                  >
                    <p className="font-medium text-sm">{patient.name}</p>
                    <p className="text-xs text-gray-600">{patient.phone}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Chat Interface */}
          <div className="lg:col-span-2 space-y-6">
            {/* Chat Box */}
            <div className="card">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span>🤖</span> AI Order Assistant
              </h2>
              
              <form onSubmit={handleSendMessage} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Describe symptoms or request medicine:
                  </label>
                  <textarea
                    className="input-field resize-none"
                    rows="4"
                    placeholder="Type your request here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={!selectedPatient || loading}
                  />
                </div>
                <button
                  type="submit"
                  className="btn-primary w-full"
                  disabled={!selectedPatient || loading || !message.trim()}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </span>
                  ) : (
                    '🚀 Submit Request'
                  )}
                </button>
              </form>

              {/* Response */}
              {response && (
                <div className="mt-6 p-4 rounded-lg border-2 bg-white">
                  <div className={`p-3 rounded-lg ${
                    response.status === 'APPROVED' ? 'bg-green-50 border border-green-200' : 
                    response.status === 'PRESCRIPTION_REQUIRED' ? 'bg-red-50 border border-red-200' :
                    response.status === 'CLARIFICATION_NEEDED' ? 'bg-blue-50 border border-blue-200' :
                    response.status === 'RECOMMENDATION_NEEDED' ? 'bg-purple-50 border border-purple-200' :
                    response.status === 'REJECTED' ? 'bg-red-50 border border-red-200' :
                    'bg-gray-50 border border-gray-200'
                  }`}>
                    <p className="font-bold text-sm flex items-center gap-2 mb-1">{
                      response.status === 'APPROVED' ? '✅ Order Approved' : 
                      response.status === 'PRESCRIPTION_REQUIRED' ? '🔒 Prescription Required' :
                      response.status === 'CLARIFICATION_NEEDED' ? '❓ Need More Info' :
                      response.status === 'RECOMMENDATION_NEEDED' ? '💡 Recommendations' : 
                      response.status === 'REJECTED' ? '❌ Order Rejected' :
                      '⚠️ Alert'
                    }</p>
                    <p className="text-sm text-gray-700">{response.message}</p>
                  </div>

                  {/* Order Details for Approved */}
                  {response.status === 'APPROVED' && response.order && (
                    <div className="mt-3 space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-600">Medicine:</p>
                          <p className="font-semibold">{response.order.medicine}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Quantity:</p>
                          <p className="font-semibold">{response.order.quantity} units</p>
                        </div>
                        {response.order.dosageDuration && (
                          <div className="col-span-2">
                            <p className="text-gray-600">💊 Dosage:</p>
                            <p className="font-semibold text-blue-700">{response.order.dosageDuration}</p>
                          </div>
                        )}
                        {response.order.totalDaysSupply > 0 && (
                          <div>
                            <p className="text-gray-600">📅 Duration:</p>
                            <p className="font-semibold">{response.order.totalDaysSupply} days</p>
                          </div>
                        )}
                        <div>
                          <p className="text-gray-600">Total:</p>
                          <p className="font-bold text-green-700">₹{response.order.totalAmount}</p>
                        </div>
                      </div>

                      {/* Age Consideration */}
                      {response.ageConsideration && (
                        <p className="text-xs bg-blue-50 p-2 rounded border border-blue-200">
                          👤 {response.ageConsideration}
                        </p>
                      )}

                      {/* Warnings */}
                      {response.warnings && response.warnings.length > 0 && (
                        <div className="bg-yellow-50 p-2 rounded border border-yellow-200">
                          <p className="font-semibold text-yellow-800 text-xs mb-1">⚠️ Warnings:</p>
                          <ul className="text-xs text-yellow-700 list-disc list-inside space-y-1">
                            {response.warnings.map((warning, index) => (
                              <li key={index}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Prescription Required */}
                  {response.status === 'PRESCRIPTION_REQUIRED' && response.medicine && (
                    <div className="mt-3 text-sm">
                      <p className="text-red-700"><strong>Medicine:</strong> {response.medicine}</p>
                      {response.warnings && response.warnings.length > 0 && (
                        <ul className="text-xs text-red-600 list-disc list-inside mt-2 space-y-1">
                          {response.warnings.map((warning, index) => (
                            <li key={index}>{warning}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {/* Clarification Needed */}
                  {response.status === 'CLARIFICATION_NEEDED' && response.questions && (
                    <ul className="text-sm text-blue-700 list-disc list-inside space-y-1 mt-3">
                      {response.questions.map((question, index) => (
                        <li key={index}>{question}</li>
                      ))}
                    </ul>
                  )}

                  {/* Low Stock Alert */}
                  {response.lowStockAlert && (
                    <div className="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300">
                      <p className="font-semibold text-yellow-800 text-xs">⚠️ Low Stock: {response.lowStockAlert.medicineName}</p>
                      <p className="text-xs text-yellow-700">
                        {response.lowStockAlert.currentStock} remaining • Refill: {response.lowStockAlert.recommendedRefillQty}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Recommendations */}
              {recommendations && (
                <div className="mt-6 card bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span>🎯</span> AI Recommendations for {selectedPatient?.name} (Age: {selectedPatient?.age})
                  </h3>
                  
                  {/* Primary Recommendation */}
                  {recommendations.primaryRecommendation && (
                    <div className="bg-white rounded-lg p-4 mb-4 border-2 border-green-300 shadow-md">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-sm font-bold text-green-700 mb-1">✨ BEST MATCH</p>
                          <p className="text-xl font-bold text-gray-800 mb-2">
                            {recommendations.primaryRecommendation.medicineName}
                          </p>
                          <p className="text-sm text-gray-700 mb-2">
                            <strong>Why:</strong> {recommendations.primaryRecommendation.reason}
                          </p>
                          <p className="text-sm text-blue-700 mb-3">
                            <strong>Dosage Advice:</strong> {recommendations.primaryRecommendation.dosageAdvice}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleSelectRecommendation(recommendations.primaryRecommendation.medicineName, 1)}
                        className="btn-primary w-full"
                        disabled={loading}
                      >
                        ✅ Select This Medicine
                      </button>
                    </div>
                  )}

                  {/* Alternative Options */}
                  {recommendations.alternatives && recommendations.alternatives.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold mb-2">Other Options:</p>
                      <div className="space-y-2">
                        {recommendations.alternatives.map((alt, index) => (
                          <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                            <div className="flex justify-between items-center">
                              <div className="flex-1">
                                <p className="font-semibold text-gray-800">{alt.medicineName}</p>
                                <p className="text-xs text-gray-600">{alt.reason}</p>
                              </div>
                              <button
                                onClick={() => handleSelectRecommendation(alt.medicineName, 1)}
                                className="btn-secondary text-sm px-3 py-1"
                                disabled={loading}
                              >
                                Select
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Warnings */}
                  {recommendations.warnings && recommendations.warnings.length > 0 && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                      <p className="text-sm font-semibold text-yellow-800 mb-1">⚠️ Important Notes:</p>
                      <ul className="text-xs text-yellow-700 list-disc list-inside space-y-1">
                        {recommendations.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {recommendations.needsPrescription && (
                    <p className="text-xs text-red-600 mt-3 font-semibold">
                      📋 Prescription Required - Please ensure patient has valid prescription
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Bill Display */}
            {bill && (
              <div className="card print-area">
                <div className="flex justify-between items-center mb-4 no-print">
                  <h2 className="text-xl font-bold">📄 Bill</h2>
                  <button onClick={handlePrint} className="btn-primary">
                    🖨️ Print Bill
                  </button>
                </div>

                <div className="border-2 border-gray-300 rounded-lg p-6">
                  {/* Bill Header */}
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-primary-600">{bill.pharmacy.name}</h3>
                    <p className="text-sm text-gray-600">{bill.pharmacy.address}</p>
                    <p className="text-sm text-gray-600">📞 {bill.pharmacy.phone}</p>
                  </div>

                  {/* Bill Info */}
                  <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                    <div>
                      <p><strong>Bill No:</strong> {bill.billNumber}</p>
                      <p><strong>Date:</strong> {bill.date}</p>
                      <p><strong>Time:</strong> {bill.time}</p>
                    </div>
                    <div className="text-right">
                      <p><strong>Patient:</strong> {bill.patient.name}</p>
                      <p><strong>Phone:</strong> {bill.patient.phone}</p>
                      <p><strong>Age:</strong> {bill.patient.age} years</p>
                    </div>
                  </div>

                  {/* Items Table */}
                  <table className="w-full mb-6">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2 text-left">Medicine</th>
                        <th className="p-2 text-center">Qty</th>
                        <th className="p-2 text-right">Price</th>
                        <th className="p-2 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bill.items.map((item, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{item.medicineName}</td>
                          <td className="p-2 text-center">{item.quantity}</td>
                          <td className="p-2 text-right">₹{item.price}</td>
                          <td className="p-2 text-right">₹{item.subtotal}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Total */}
                  <div className="border-t-2 border-gray-800 pt-4">
                    <div className="flex justify-between items-center text-xl font-bold">
                      <span>Total Amount:</span>
                      <span className="text-primary-600">₹{bill.totalAmount}</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-6 text-center text-sm text-gray-600">
                    <p>Thank you for your visit!</p>
                    <p className="text-xs mt-2">Powered by AI Agents</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

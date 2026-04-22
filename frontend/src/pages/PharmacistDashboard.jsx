import { useState, useEffect, useRef } from 'react';
import { patientAPI, orderAPI, medicineAPI, patientHistoryAPI, inventoryAgentAPI } from '../api';
import { useToast } from '../context/ToastContext';

// ─── Helpers ────────────────────────────────────────────────────────────────
const toCurrency = (amount) => `₹${Number(amount || 0).toFixed(2)}`;
const formatTime = (ts) =>
  new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const formatDate = (ts) =>
  new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const isPatientDetailQuery = (text) => {
  const n = text.toLowerCase();
  return (
    n.includes('patient detail') || n.includes('patient details') ||
    n.includes('details of patient') || n.includes('show patient') ||
    n.includes('patient info') || n.includes('patient information')
  );
};

const isMedicineOnlyRequest = (text) => {
  const n = text.toLowerCase().trim();
  const symptomWords = [
    'fever', 'pain', 'headache', 'cough', 'cold', 'symptom', 'hurt', 'ache',
    'infection', 'allergy', 'sore', 'nausea', 'vomit', 'dizzy', 'rash',
    'bleeding', 'itching', 'swelling', 'diarrhea', 'loose motion', 'stomach',
    'bp', 'sugar', 'diabetes', 'pressure', 'last time', 'previous', 'same medicine',
    'history', 'prescription', 'doctor', 'have been', 'suffering', 'feeling',
    'for days', 'for hours', 'since',
  ];
  if (symptomWords.some((w) => n.includes(w))) return false;
  const actionWords = ['give', 'provide', 'need', 'want', 'get', 'buy', 'order'];
  const hasAction = actionWords.some((w) => n.startsWith(w) || n.includes(w));
  return hasAction && n.split(/\s+/).length <= 5;
};

const SYMPTOM_ASK_MSG =
  "Before I recommend a medicine, could you tell me the patient's symptoms? (e.g., fever, headache, cough) This helps me give the safest recommendation.";

// ─── Avatar ──────────────────────────────────────────────────────────────────
function Avatar({ name, size = 'md' }) {
  const colors = [
    'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500',
    'bg-rose-500', 'bg-cyan-500', 'bg-fuchsia-500', 'bg-orange-500',
  ];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  const sizeClass = size === 'lg'
    ? 'w-14 h-14 text-xl'
    : size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';
  return (
    <div className={`${color} ${sizeClass} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  );
}

// ─── Stock Update Modal ──────────────────────────────────────────────────────
function StockModal({ medicine, onClose, onSuccess }) {
  const [mode, setMode] = useState('adjust');
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const showToast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const num = parseInt(value);
    if (isNaN(num) || num < 0) { showToast('Enter a valid non-negative number.', 'warning'); return; }
    setLoading(true);
    try {
      if (mode === 'adjust') {
        await medicineAPI.adjustStock(medicine._id, num);
        showToast(`+${num} added to ${medicine.name} stock.`, 'success');
      } else {
        await medicineAPI.updateStock(medicine._id, num);
        showToast(`${medicine.name} stock set to ${num}.`, 'success');
      }
      onSuccess(); onClose();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update stock.', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="modal-panel bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-slate-900 mb-1">Update Stock</h3>
        <p className="text-sm text-slate-500 mb-4">
          <span className="font-semibold text-slate-700">{medicine.name}</span> — current:{' '}
          <span className="font-bold text-primary-700">{medicine.stockQty}</span>
        </p>
        <div className="flex rounded-lg overflow-hidden border border-slate-200 mb-4">
          <button type="button" onClick={() => setMode('adjust')}
            className={`flex-1 py-2 text-sm font-semibold transition-colors ${mode === 'adjust' ? 'bg-primary-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
            ➕ Add Stock
          </button>
          <button type="button" onClick={() => setMode('set')}
            className={`flex-1 py-2 text-sm font-semibold transition-colors ${mode === 'set' ? 'bg-primary-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
            ✏️ Set Quantity
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="number" min="0" className="input-field text-lg font-semibold"
            placeholder={mode === 'adjust' ? 'Quantity to add (e.g. 50)' : 'New total quantity'}
            value={value} onChange={(e) => setValue(e.target.value)} autoFocus required />
          <p className="text-xs text-slate-500">
            {mode === 'adjust'
              ? `New stock: ${medicine.stockQty} + ${value || 0} = ${medicine.stockQty + (parseInt(value) || 0)}`
              : `Will replace: ${medicine.stockQty} → ${value || 0}`}
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Patient Detail Panel ────────────────────────────────────────────────────
function PatientDetailPanel({ patient, onBack, onLoadToChat, onDelete }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const showToast = useToast();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await patientHistoryAPI.getMedicationHistory(patient._id);
        setHistory(res.data.medicationHistory || []);
      } catch { setHistory([]); }
      finally { setLoading(false); }
    };
    load();
  }, [patient._id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await patientAPI.delete(patient._id);
      showToast(`Patient "${patient.name}" deleted successfully.`, 'success');
      onDelete();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete patient.', 'error');
      setConfirmDelete(false);
    } finally { setDeleting(false); }
  };

  return (
    <div className="flex-1 overflow-y-auto hide-scrollbar p-5">
      {/* Back + Actions */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={onBack}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          All Patients
        </button>
        <div className="flex items-center gap-2">
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors font-medium"
            >
              🗑️ Delete
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
              <span className="text-xs text-red-700 font-medium">Delete {patient.name}?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs px-2 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold"
              >
                {deleting ? 'Deleting…' : 'Yes, delete'}
              </button>
              <button onClick={() => setConfirmDelete(false)} className="text-xs px-2 py-1 bg-white border border-slate-200 text-slate-600 rounded-md hover:bg-slate-50">
                Cancel
              </button>
            </div>
          )}
          <button
            onClick={() => onLoadToChat(patient)}
            className="btn-primary text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Load to Chat
          </button>
        </div>
      </div>

      {/* Patient Card */}
      <div className="rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 text-white p-5 mb-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold">
            {patient.name[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{patient.name}</h2>
            <p className="text-primary-200 text-sm mt-0.5">{patient.phone}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="bg-white/20 px-3 py-0.5 rounded-full text-xs font-medium">
                Age: {patient.age} years
              </span>
              <span className="bg-white/20 px-3 py-0.5 rounded-full text-xs font-medium">
                {history.length} visit{history.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-primary-600">{history.length}</p>
          <p className="text-xs text-slate-500 mt-1">Total Visits</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">
            {toCurrency(history.reduce((s, e) => s + (e.totalAmount || 0), 0))}
          </p>
          <p className="text-xs text-slate-500 mt-1">Total Spent</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">
            {history.length > 0 ? formatDate(history[0].date).split(' ')[0] + ' ' + formatDate(history[0].date).split(' ')[1] : '—'}
          </p>
          <p className="text-xs text-slate-500 mt-1">Last Visit</p>
        </div>
      </div>

      {/* Medication History */}
      <div>
        <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
          📋 Medication History
          <span className="text-sm font-normal text-slate-400">({history.length} records)</span>
        </h3>

        {loading ? (
          <div className="flex justify-center py-10"><div className="spinner" /></div>
        ) : history.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-slate-500 text-sm">No medication history found for this patient.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((entry, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center text-xs font-bold">
                      #{history.length - i}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{formatDate(entry.date)}</p>
                      <p className="text-xs text-slate-400">{(entry.medicines || []).length} medicine{(entry.medicines || []).length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                    {toCurrency(entry.totalAmount)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(entry.medicines || []).map((med, j) => (
                    <span key={j} className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-full font-medium">
                      💊 {med.name}
                      {med.quantity && <span className="text-slate-400">× {med.quantity}</span>}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Patients Tab ────────────────────────────────────────────────────────────
function PatientsTab({ patients, onLoadToChat, loadingPatients, onRefresh }) {
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);

  const filtered = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.phone || '').includes(search)
  );

  if (selectedPatient) {
    return (
      <PatientDetailPanel
        patient={selectedPatient}
        onBack={() => setSelectedPatient(null)}
        onLoadToChat={(pt) => { onLoadToChat(pt); setSelectedPatient(null); }}
        onDelete={() => { setSelectedPatient(null); onRefresh(); }}
      />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto hide-scrollbar p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">All Patients</h2>
          <p className="text-sm text-slate-500">{patients.length} registered patients</p>
        </div>
        <input
          type="text"
          placeholder="Search by name or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field text-sm w-56"
        />
      </div>

      {loadingPatients ? (
        <div className="flex justify-center py-12"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-12 text-center">
          <p className="text-3xl mb-2">🔍</p>
          <p className="text-slate-500 text-sm">No patients match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((pt) => (
            <button
              key={pt._id}
              type="button"
              onClick={() => setSelectedPatient(pt)}
              className="text-left rounded-xl border border-slate-200 bg-white p-4 hover:border-primary-300 hover:shadow-md hover:-translate-y-0.5 transition-all group"
            >
              <div className="flex items-center gap-3">
                <Avatar name={pt.name} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate group-hover:text-primary-700 transition-colors">
                    {pt.name}
                  </p>
                  <p className="text-xs text-slate-500">{pt.phone || 'No phone'}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Age: {pt.age} years</p>
                </div>
                <svg className="w-4 h-4 text-slate-300 group-hover:text-primary-400 transition-colors flex-shrink-0"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Since {new Date(pt.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                </span>
                <span className="text-xs text-primary-600 font-medium group-hover:underline">
                  View History →
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function PharmacistDashboard() {
  const showToast = useToast();

  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'patients' | 'inventory'

  // Patient state
  const [patients, setPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [registeringPatient, setRegisteringPatient] = useState(false);
  const [patientForm, setPatientForm] = useState({ name: '', phone: '', age: '' });
  const [searchPhone, setSearchPhone] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Inventory state
  const [medicines, setMedicines] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [stockModal, setStockModal] = useState(null);
  const [inventorySearch, setInventorySearch] = useState('');

  // AI Inventory Agent state
  const [agentQuery, setAgentQuery] = useState('');
  const [agentProcessing, setAgentProcessing] = useState(false);
  const [agentHistory, setAgentHistory] = useState([]);
  const agentEndRef = useRef(null);

  // Chat state
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [bill, setBill] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1, role: 'assistant',
      text: 'Welcome to PharmaBooks. Load a patient by phone number, then describe symptoms or ask for medicines.',
      timestamp: new Date().toISOString(),
    },
  ]);
  const messageEndRef = useRef(null);

  useEffect(() => { fetchPatients(); fetchLowStock(); }, []);
  useEffect(() => { messageEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);
  useEffect(() => { agentEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [agentHistory]);
  useEffect(() => { if (activeTab === 'inventory') fetchAllMedicines(); }, [activeTab]);

  // ── Data Fetchers ────────────────────────────────────────────────────────
  const fetchPatients = async () => {
    setPatientsLoading(true);
    try {
      const res = await patientAPI.getAll();
      setPatients(res.data.patients || []);
    } catch { setPatients([]); }
    finally { setPatientsLoading(false); }
  };

  const fetchLowStock = async () => {
    try {
      const res = await medicineAPI.getLowStock();
      const list = res.data.medicines || [];
      setLowStockAlerts(list);
      if (list.length > 0) {
        showToast(`⚠️ ${list.length} medicine${list.length > 1 ? 's are' : ' is'} running low on stock.`, 'warning', 5000);
      }
    } catch { /* non-critical */ }
  };

  const fetchAllMedicines = async () => {
    setInventoryLoading(true);
    try {
      const res = await medicineAPI.getAll();
      setMedicines(res.data.medicines || []);
    } catch { showToast('Failed to load inventory.', 'error'); }
    finally { setInventoryLoading(false); }
  };

  // ── Chat Helpers ─────────────────────────────────────────────────────────
  const appendMessage = (role, text) => {
    setChatMessages((prev) => [...prev, { id: Date.now() + Math.random(), role, text, timestamp: new Date().toISOString() }]);
  };

  const formatPatientSummary = () => {
    if (!selectedPatient) return 'No patient selected.';
    return [
      `Patient Name: ${selectedPatient.name}`,
      `Phone: ${selectedPatient.phone}`,
      `Age: ${selectedPatient.age}`,
      'For full medication history, go to the Patients tab.',
    ].join('\n');
  };

  const handleLoadPatient = async () => {
    if (!searchPhone || searchPhone.length !== 10) {
      showToast('Enter a valid 10-digit phone number.', 'warning'); return;
    }
    setLoading(true);
    try {
      const res = await patientAPI.getByPhone(searchPhone);
      const patient = res.data.patient;
      setSelectedPatient(patient);
      setBill(null); setRecommendations(null);
      showToast(`Patient loaded: ${patient.name}`, 'success');
      appendMessage('assistant', `Patient loaded: ${patient.name} (${patient.phone}). Describe symptoms to get started.`);
    } catch {
      showToast('Patient not found for this phone number.', 'error');
      appendMessage('assistant', 'Patient not found. Check the number or register a new patient.');
      setSelectedPatient(null);
    } finally { setLoading(false); }
  };

  // Load patient from Patients tab → switch to Chat
  const handleLoadPatientToChat = async (patient) => {
    setSelectedPatient(patient);
    setBill(null); setRecommendations(null);
    setSearchPhone(patient.phone || '');
    showToast(`${patient.name} loaded to chat.`, 'success');
    appendMessage('assistant', `Patient loaded: ${patient.name} (${patient.phone}). Describe symptoms to get started.`);
    setActiveTab('chat');
  };

  const handleRegisterPatient = async (e) => {
    e.preventDefault();
    if (!patientForm.name || !patientForm.phone || !patientForm.age) {
      showToast('Fill in name, phone and age.', 'warning'); return;
    }
    setRegisteringPatient(true);
    try {
      const res = await patientAPI.register({
        name: patientForm.name, phone: patientForm.phone, age: Number(patientForm.age),
      });
      appendMessage('assistant', res.data?.message || 'Patient registered successfully.');
      showToast('Patient registered successfully.', 'success');
      setPatientForm({ name: '', phone: '', age: '' });
      setShowRegisterForm(false);
      await fetchPatients();
    } catch (err) {
      showToast(err.response?.data?.message || 'Unable to register patient.', 'error');
    } finally { setRegisteringPatient(false); }
  };

  const handleSelectRecommendation = async (medicineName, quantity = 1) => {
    if (!selectedPatient) return;
    setLoading(true);
    appendMessage('user', `Give ${quantity} ${medicineName}`);
    try {
      const res = await orderAPI.processChat({ message: `Give ${quantity} ${medicineName}`, patientId: selectedPatient._id });
      const data = res.data;
      appendMessage('assistant', data.message || 'Request processed.');
      if (data.status === 'APPROVED' && data.bill) {
        setBill(data.bill); setRecommendations(null);
        showToast('Order approved! Bill generated.', 'success');
      }
      await fetchLowStock();
    } catch (err) {
      showToast('Unable to process recommendation.', 'error');
      appendMessage('assistant', err.response?.data?.message || 'Unable to process recommendation.');
    } finally { setLoading(false); }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const input = message.trim();
    if (!input) return;
    appendMessage('user', input);
    setMessage('');

    if (!selectedPatient) {
      showToast('Load a patient first.', 'warning');
      appendMessage('assistant', 'Please load a patient using their phone number before sending requests.');
      return;
    }
    if (isPatientDetailQuery(input)) { appendMessage('assistant', formatPatientSummary()); return; }
    if (isMedicineOnlyRequest(input)) { appendMessage('assistant', SYMPTOM_ASK_MSG); return; }

    setLoading(true); setBill(null); setRecommendations(null);
    try {
      const res = await orderAPI.processConversational({ message: input, patientId: selectedPatient._id });
      const data = res.data;
      appendMessage('assistant', data.message || 'Request processed.');
      if (data.status === 'RECOMMENDATION_NEEDED') {
        setRecommendations(data.recommendations || null);
        showToast('AI recommendations ready.', 'info');
      }
      if (data.status === 'APPROVED' && data.bill) {
        setBill(data.bill); showToast('Order approved! Bill generated.', 'success');
      }
      if (data.questions?.length) appendMessage('assistant', `Clarification:\n- ${data.questions.join('\n- ')}`);
      if (data.warnings?.length) {
        appendMessage('assistant', `⚠️ Warnings:\n- ${data.warnings.join('\n- ')}`);
        showToast(data.warnings[0], 'warning');
      }
      if (data.lowStockAlert) {
        const la = data.lowStockAlert;
        appendMessage('assistant', `⚠️ Low stock: ${la.medicineName} (${la.currentStock} left).`);
        showToast(`Low stock: ${la.medicineName}`, 'warning');
      }
      await fetchLowStock();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error processing request.', 'error');
      appendMessage('assistant', err.response?.data?.message || 'Error processing request.');
    } finally { setLoading(false); }
  };

  // ── AI Inventory Agent ───────────────────────────────────────────────────
  const handleAgentQuery = async (e) => {
    e.preventDefault();
    const input = agentQuery.trim();
    if (!input) return;
    setAgentHistory((prev) => [...prev, { id: Date.now(), role: 'user', text: input, timestamp: new Date().toISOString() }]);
    setAgentQuery('');
    setAgentProcessing(true);
    try {
      const res = await inventoryAgentAPI.processCommand(input);
      const data = res.data;
      setAgentHistory((prev) => [...prev, {
        id: Date.now() + 1, role: 'agent', text: data.message, success: data.success,
        details: data.success ? { old: data.oldStock, new: data.newStock } : null,
        timestamp: new Date().toISOString(),
      }]);
      if (data.success) { showToast(data.message, data.isLowStock ? 'warning' : 'success'); fetchAllMedicines(); fetchLowStock(); }
      else showToast(data.message, 'error');
    } catch (err) {
      setAgentHistory((prev) => [...prev, { id: Date.now() + 1, role: 'agent', text: err.response?.data?.message || 'Failed to process command.', success: false, timestamp: new Date().toISOString() }]);
      showToast('Inventory agent error.', 'error');
    } finally { setAgentProcessing(false); }
  };

  const handlePrint = () => window.print();
  const filteredMedicines = medicines.filter((m) => m.name.toLowerCase().includes(inventorySearch.toLowerCase()));

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 min-h-0 bg-[#eef5ff] p-3 md:p-4 overflow-hidden">
      <div className="mx-auto max-w-7xl h-full rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-lg">
        <div className="h-full grid grid-cols-1 lg:grid-cols-[280px_1fr]">

          {/* ── SIDEBAR ── */}
          <aside className="h-full border-r border-slate-200 bg-slate-50 flex flex-col gap-3 overflow-y-auto hide-scrollbar p-4">
            {/* Brand */}
            <div className="rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 text-white p-4">
              <p className="text-xs uppercase tracking-widest text-primary-200">PharmaBooks</p>
              <h1 className="text-xl font-bold mt-1">Patient Console</h1>
              <p className="text-xs text-primary-200 mt-1 leading-relaxed">Load patient by phone, then describe symptoms.</p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                AI-powered workflow
              </div>
            </div>

            {/* Phone search */}
            <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Find Patient</label>
              <div className="flex gap-2">
                <input type="tel" value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="input-field text-sm" placeholder="10-digit number" maxLength={10} />
                <button type="button" onClick={handleLoadPatient} className="btn-primary whitespace-nowrap" disabled={loading}>
                  Load
                </button>
              </div>
            </div>

            {/* Active Patient (loaded in chat) */}
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Loaded in Chat</p>
              {selectedPatient ? (
                <div className="flex items-center gap-3">
                  <Avatar name={selectedPatient.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{selectedPatient.name}</p>
                    <p className="text-xs text-slate-500">{selectedPatient.phone} · {selectedPatient.age}y</p>
                    <button
                      onClick={() => { setActiveTab('patients'); }}
                      className="text-xs text-primary-600 hover:underline mt-0.5"
                    >
                      View history →
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-slate-400 italic">No patient loaded in chat</p>
                  <p className="text-xs text-slate-400 mt-1">Use the 👥 Patients tab to browse and load a patient.</p>
                </div>
              )}
            </div>

            {/* Register patient */}
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Register Patient</p>
                <button type="button"
                  className="text-xs font-semibold text-primary-600 hover:text-primary-800"
                  onClick={() => setShowRegisterForm((p) => !p)}>
                  {showRegisterForm ? '✕ Close' : '+ New'}
                </button>
              </div>
              {showRegisterForm ? (
                <form onSubmit={handleRegisterPatient} className="space-y-2">
                  <input type="text" className="input-field text-sm" placeholder="Patient name"
                    value={patientForm.name} onChange={(e) => setPatientForm((p) => ({ ...p, name: e.target.value }))} required />
                  <input type="tel" className="input-field text-sm" placeholder="10-digit phone"
                    value={patientForm.phone}
                    onChange={(e) => setPatientForm((p) => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                    maxLength={10} required />
                  <input type="number" className="input-field text-sm" placeholder="Age" min={0}
                    value={patientForm.age} onChange={(e) => setPatientForm((p) => ({ ...p, age: e.target.value }))} required />
                  <button type="submit" className="btn-primary w-full text-sm" disabled={registeringPatient}>
                    {registeringPatient ? 'Registering…' : 'Register Patient'}
                  </button>
                </form>
              ) : (
                <p className="text-xs text-slate-400">Add a new patient profile to the system.</p>
              )}
            </div>

            {/* Low stock alerts */}
            {lowStockAlerts.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-700 mb-2">
                  ⚠️ Low Stock ({lowStockAlerts.length})
                </p>
                <div className="space-y-1">
                  {lowStockAlerts.slice(0, 5).map((med) => (
                    <div key={med._id} className="flex items-center justify-between text-xs">
                      <span className="text-amber-900 font-medium">{med.name}</span>
                      <span className="bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-bold">{med.stockQty}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* ── MAIN AREA ── */}
          <main className="h-full flex flex-col min-h-0">
            {/* Top tab bar */}
            <div className="border-b border-slate-200 bg-white px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button onClick={() => setActiveTab('chat')} className={`tab-btn ${activeTab === 'chat' ? 'tab-btn-active' : 'tab-btn-inactive'}`}>
                  💬 Chat
                </button>
                <button onClick={() => setActiveTab('patients')} className={`tab-btn ${activeTab === 'patients' ? 'tab-btn-active' : 'tab-btn-inactive'}`}>
                  👥 Patients
                  <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'patients' ? 'bg-white/30 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    {patients.length}
                  </span>
                </button>
                <button onClick={() => setActiveTab('inventory')} className={`tab-btn ${activeTab === 'inventory' ? 'tab-btn-active' : 'tab-btn-inactive'}`}>
                  📦 Inventory
                </button>
              </div>
              {selectedPatient && activeTab === 'chat' && (
                <div className="hidden md:flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {selectedPatient.name} · {selectedPatient.phone}
                </div>
              )}
            </div>

            {/* ── CHAT TAB ── */}
            {activeTab === 'chat' && (
              <>
                <div className="flex-1 overflow-y-auto hide-scrollbar bg-[#f4f8ff] p-4 space-y-3">
                  {chatMessages.map((item) => (
                    <div key={item.id} className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-3 whitespace-pre-line text-sm leading-relaxed shadow-sm ${
                        item.role === 'user'
                          ? 'bg-primary-700 text-white rounded-br-md'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-bl-md'
                      }`}>
                        <p>{item.text}</p>
                        <p className={`text-[11px] mt-1.5 ${item.role === 'user' ? 'text-primary-200' : 'text-slate-400'}`}>
                          {formatTime(item.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                        <div className="dot-blink flex gap-1 items-center"><span /><span /><span /></div>
                      </div>
                    </div>
                  )}

                  {recommendations && (
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                      <p className="font-bold text-slate-900 mb-3 flex items-center gap-2">🤖 AI Recommendations</p>
                      {recommendations.primaryRecommendation && (
                        <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-3 mb-3">
                          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-1">Best Match</p>
                          <p className="text-base font-bold text-slate-900">{recommendations.primaryRecommendation.medicineName}</p>
                          <p className="text-sm text-slate-600 mt-1">{recommendations.primaryRecommendation.reason}</p>
                          <button className="btn-primary mt-3 text-sm"
                            onClick={() => handleSelectRecommendation(recommendations.primaryRecommendation.medicineName, 1)} disabled={loading}>
                            ✓ Select This
                          </button>
                        </div>
                      )}
                      {recommendations.alternatives?.length > 0 && (
                        <div className="space-y-2">
                          {recommendations.alternatives.map((alt, i) => (
                            <div key={i} className="rounded-xl border border-slate-200 p-3 flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{alt.medicineName}</p>
                                <p className="text-xs text-slate-500">{alt.reason}</p>
                              </div>
                              <button className="btn-secondary text-sm"
                                onClick={() => handleSelectRecommendation(alt.medicineName, 1)} disabled={loading}>Select</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {bill && (
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm print-area">
                      <div className="flex items-center justify-between mb-3 no-print">
                        <p className="font-bold text-slate-900">🧾 Bill Generated</p>
                        <button onClick={handlePrint} className="btn-secondary text-sm">Print</button>
                      </div>
                      <div className="text-sm text-slate-700 space-y-1 mb-3">
                        <p><strong>Bill No:</strong> {bill.billNumber}</p>
                        <p><strong>Patient:</strong> {bill.patient?.name}</p>
                        <p><strong>Date:</strong> {bill.date} {bill.time}</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-100">
                            <tr>
                              <th className="px-3 py-2 text-left">Medicine</th>
                              <th className="px-3 py-2 text-center">Qty</th>
                              <th className="px-3 py-2 text-right">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bill.items?.map((item, i) => (
                              <tr key={i} className="border-t border-slate-200">
                                <td className="px-3 py-2">{item.medicineName}</td>
                                <td className="px-3 py-2 text-center">{item.quantity}</td>
                                <td className="px-3 py-2 text-right">{toCurrency(item.subtotal)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-3 text-right font-bold text-slate-900">Total: {toCurrency(bill.totalAmount)}</div>
                    </div>
                  )}
                  <div ref={messageEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="border-t border-slate-200 bg-white p-3 md:p-4">
                  <div className="flex gap-3 items-end">
                    <textarea rows={2} value={message} onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } }}
                      className="input-field resize-none text-sm"
                      placeholder="Describe symptoms or ask for medicines… (Enter to send)" disabled={loading} />
                    <button type="submit" className="btn-primary px-6 h-[44px]" disabled={loading || !message.trim()}>Send</button>
                  </div>
                </form>
              </>
            )}

            {/* ── PATIENTS TAB ── */}
            {activeTab === 'patients' && (
              <PatientsTab
                patients={patients}
                loadingPatients={patientsLoading}
                onLoadToChat={handleLoadPatientToChat}
                onRefresh={fetchPatients}
              />
            )}

            {/* ── INVENTORY TAB ── */}
            {activeTab === 'inventory' && (
              <div className="flex-1 overflow-y-auto hide-scrollbar p-5 space-y-6">
                {/* AI Inventory Agent */}
                <div className="rounded-2xl border-2 border-primary-100 bg-gradient-to-br from-primary-50 to-blue-50 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center text-xl">🤖</div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">AI Inventory Agent</h2>
                      <p className="text-xs text-slate-500">Type natural language — e.g. "add 20 paracetamol to stock"</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-3 mb-3 min-h-[100px] max-h-56 overflow-y-auto hide-scrollbar space-y-2">
                    {agentHistory.length === 0 && (
                      <div className="flex items-center justify-center h-full text-slate-400 text-sm italic py-4">
                        Try: "add 50 paracetamol", "set ibuprofen to 100"
                      </div>
                    )}
                    {agentHistory.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                          msg.role === 'user' ? 'bg-primary-700 text-white rounded-br-sm'
                            : msg.success === false ? 'bg-red-50 border border-red-200 text-red-800 rounded-bl-sm'
                            : 'bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-bl-sm'
                        }`}>
                          <p>{msg.text}</p>
                          {msg.details && (
                            <div className="mt-1 pt-1 border-t border-emerald-200 text-xs font-mono flex gap-2">
                              <span>Before: {msg.details.old}</span>
                              <span>→</span>
                              <span className="font-bold">After: {msg.details.new}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {agentProcessing && (
                      <div className="flex justify-start">
                        <div className="bg-white border border-slate-200 rounded-xl px-3 py-2">
                          <div className="dot-blink flex gap-1 items-center"><span /><span /><span /></div>
                        </div>
                      </div>
                    )}
                    <div ref={agentEndRef} />
                  </div>
                  <form onSubmit={handleAgentQuery} className="flex gap-2">
                    <input type="text" value={agentQuery} onChange={(e) => setAgentQuery(e.target.value)}
                      className="input-field text-sm" placeholder='e.g. "add 30 amoxicillin in stock"' disabled={agentProcessing} />
                    <button type="submit" className="btn-primary whitespace-nowrap" disabled={agentProcessing || !agentQuery.trim()}>
                      {agentProcessing ? '⏳' : 'Run'}
                    </button>
                  </form>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['add 20  in stock', 'set  to 100', 'remove 5 '].map((s) => (
                      <button key={s} type="button"
                        className="text-xs bg-white border border-slate-200 text-slate-600 px-3 py-1 rounded-full hover:bg-primary-50 hover:border-primary-200 hover:text-primary-700 transition-colors"
                        onClick={() => setAgentQuery(s)}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Medicine Table */}
                <div>
                  <div className="flex items-center justify-between mb-3 gap-3">
                    <h2 className="text-base font-bold text-slate-900">
                      Medicine Inventory
                      <span className="ml-2 text-sm font-normal text-slate-500">({filteredMedicines.length})</span>
                    </h2>
                    <div className="flex gap-2">
                      <input type="text" placeholder="Search…" value={inventorySearch}
                        onChange={(e) => setInventorySearch(e.target.value)} className="input-field text-sm w-40" />
                      <button type="button" onClick={fetchAllMedicines} className="btn-secondary text-sm" disabled={inventoryLoading}>
                        {inventoryLoading ? '…' : '↻'}
                      </button>
                    </div>
                  </div>
                  {inventoryLoading ? (
                    <div className="flex justify-center py-10"><div className="spinner" /></div>
                  ) : (
                    <div className="rounded-xl border border-slate-200 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-100 text-slate-600 text-xs uppercase tracking-wide">
                          <tr>
                            <th className="px-4 py-3 text-left">Medicine</th>
                            <th className="px-4 py-3 text-left">Unit</th>
                            <th className="px-4 py-3 text-right">Price</th>
                            <th className="px-4 py-3 text-right">Stock</th>
                            <th className="px-4 py-3 text-center">Status</th>
                            <th className="px-4 py-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredMedicines.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-8 text-slate-400 italic">No medicines found.</td></tr>
                          ) : filteredMedicines.map((med) => {
                            const isLow = med.stockQty <= med.minStockThreshold;
                            return (
                              <tr key={med._id} className={`border-t border-slate-100 hover:bg-slate-50 ${isLow ? 'bg-amber-50/40' : ''}`}>
                                <td className="px-4 py-3 font-semibold text-slate-900">{med.name}</td>
                                <td className="px-4 py-3 text-slate-500 capitalize">{med.unit}</td>
                                <td className="px-4 py-3 text-right">₹{med.price}</td>
                                <td className={`px-4 py-3 text-right font-bold ${isLow ? 'text-red-600' : 'text-emerald-700'}`}>{med.stockQty}</td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`status-chip ${isLow ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                    {isLow ? '⚠️ Low' : '✓ OK'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <button onClick={() => setStockModal(med)}
                                    className="text-xs px-3 py-1.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors font-medium">
                                    Update
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {stockModal && (
        <StockModal medicine={stockModal} onClose={() => setStockModal(null)}
          onSuccess={() => { fetchAllMedicines(); fetchLowStock(); }} />
      )}
    </div>
  );
}

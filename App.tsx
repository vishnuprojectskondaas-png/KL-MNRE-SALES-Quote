import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { fetchFullState, saveSettingsToLocal, saveQuotationToLocal, deleteQuotationFromLocal, INITIAL_STATE } from './services/store';
import { AppState, Quotation, BOMTemplate, BOMItem, User } from './types';
import AdminPanel from './components/AdminPanel';
import QuotationForm from './components/QuotationForm';
import PrintableView from './components/PrintableView';
import { LogIn, FileText, Settings, LayoutDashboard, PlusCircle, LogOut, Loader2, AlertCircle } from 'lucide-react';

const SettingsView = lazy(() => import('./components/SettingsView'));

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'create' | 'settings'>('dashboard');
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [printingQuote, setPrintingQuote] = useState<Quotation | null>(null);
  const [downloadingQuote, setDownloadingQuote] = useState<Quotation | null>(null);
  
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const pdfRef = useRef<HTMLDivElement>(null);
  const printTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const downloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (printTimerRef.current) clearTimeout(printTimerRef.current);
      if (downloadTimerRef.current) clearTimeout(downloadTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const remoteState = await fetchFullState();
      setState(remoteState);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = state.users.find(u => u.username === loginUsername && u.password === loginPassword);
    
    if (user) {
      setCurrentUser(user);
      setLoginUsername('');
      setLoginPassword('');
    } else {
      alert('Invalid credentials');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  const handleCreateQuotation = async (q: Quotation) => {
    const currentQuotes = state.quotations || [];
    const isEdit = currentQuotes.some(item => item.id === q.id);
    let updatedQuotes: Quotation[];
    let nextId = state.nextId;
    
    if (isEdit) {
      updatedQuotes = currentQuotes.map(item => item.id === q.id ? q : item);
    } else {
      updatedQuotes = [...currentQuotes, q];
      nextId = state.nextId + 1;
    }

    const newState = {
      ...state,
      quotations: updatedQuotes,
      nextId: nextId
    };
    
    setState(newState);
    setActiveTab('dashboard');
    await saveQuotationToLocal(q);
  };

  const handleDeleteQuotation = async (id: string) => {
    const currentQuotes = state.quotations || [];
    const updatedQuotes = currentQuotes.filter(q => q.id !== id);
    setState(prev => ({ ...prev, quotations: updatedQuotes }));
    await deleteQuotationFromLocal(id);
  };

  const handleSaveTemplate = (name: string, items: BOMItem[]) => {
    const newTemplate: BOMTemplate = {
      id: Date.now().toString(),
      name,
      items
    };
    updateSettingsState(prev => ({
      ...prev,
      bomTemplates: [...(prev.bomTemplates || []), newTemplate]
    }));
    alert(`BOM saved as template: ${name}`);
  };

  const saveQueue = useRef<Promise<any>>(Promise.resolve());

  const handleSettingsUpdate = async (newState: AppState) => {
    setState(newState);
    saveQueue.current = saveQueue.current.then(() => saveSettingsToLocal(newState));
    await saveQueue.current;
  };

  // Helper for functional updates to settings
  const updateSettingsState = (updater: (prev: AppState) => AppState) => {
    setState(prev => {
      const next = updater(prev);
      saveQueue.current = saveQueue.current.then(() => saveSettingsToLocal(next));
      return next;
    });
  };

  const editQuotation = (q: Quotation) => {
    setSelectedQuotation(q);
    setActiveTab('create');
  };

  const handlePrint = (q: Quotation) => {
    setPrintingQuote(q);
    if (printTimerRef.current) clearTimeout(printTimerRef.current);
    printTimerRef.current = setTimeout(() => {
      window.print();
      setPrintingQuote(null);
    }, 250);
  };

  const handleDownloadPDF = async (q: Quotation) => {
    setDownloadingQuote(q);
    if (downloadTimerRef.current) clearTimeout(downloadTimerRef.current);
    
    downloadTimerRef.current = setTimeout(async () => {
      if (!pdfRef.current) return;
      
      try {
        const { generateAndDownloadPdf } = await import('./utils/pdfGenerator');
        await generateAndDownloadPdf(q, pdfRef.current, state);
      } catch (err) {
        console.error("PDF generation failed:", err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        alert(`Failed to generate PDF: ${errorMessage}. This can happen if the content is too large or images fail to load. Please use the Print button instead for a more reliable result.`);
      } finally {
        setDownloadingQuote(null);
      }
    }, 1500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <Loader2 className="w-10 h-10 text-red-600 animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Connecting to Supabase...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8 flex flex-col items-center">
            {state.company.logo ? (
              <img src={state.company.logo} alt="Company Logo" className="h-20 w-auto mb-6 object-contain" />
            ) : (
              <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg">
                <FileText className="w-10 h-10" />
              </div>
            )}
            <h1 className="text-3xl font-bold text-gray-900">Kondaas QuotePro</h1>
            <p className="text-gray-500 mt-2">Login to your account</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <input 
                type="text" 
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 outline-none" 
                placeholder="Username"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input 
                type="password" 
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 outline-none" 
                placeholder="Password"
                required
              />
            </div>
            <button 
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <LogIn className="w-5 h-5 mr-2" /> Login
            </button>
          </form>
          <div className="mt-8 text-center">
             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Powered by {state.company.name}</p>
             <p className="text-[8px] text-gray-300 mt-1">Developed by Vishnu</p>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = currentUser.role === 'admin';

  if (state.maintenanceMode && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Quote Pro Under Maintenance</h1>
          <p className="text-gray-500 mb-6">Quote Pro is currently undergoing maintenance. Please try again later. Only administrators can access the system at this time.</p>
          <button 
            onClick={handleLogout}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen flex flex-col md:flex-row no-print">
        <aside className="w-full md:w-64 bg-black text-white flex-shrink-0">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-red-600">KAPL {isAdmin ? 'Admin' : 'Sales'}</h2>
            <div className="mt-2 flex items-center gap-2">
               <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold">{currentUser.name?.charAt(0) || 'U'}</div>
               <div className="overflow-hidden">
                 <p className="text-sm font-medium truncate">{currentUser.name}</p>
                 <p className="text-xs text-gray-400 capitalize">{currentUser.role}</p>
               </div>
            </div>
          </div>
          <nav className="mt-4 px-4 space-y-2">
            <button 
              onClick={() => { setActiveTab('dashboard'); setSelectedQuotation(null); }}
              className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-red-600 text-white' : 'hover:bg-gray-800 text-gray-400'}`}
            >
              <LayoutDashboard className="w-5 h-5 mr-3" /> Dashboard
            </button>
            <button 
              onClick={() => { setActiveTab('create'); setSelectedQuotation(null); }}
              className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === 'create' ? 'bg-red-600 text-white' : 'hover:bg-gray-800 text-gray-400'}`}
            >
              <PlusCircle className="w-5 h-5 mr-3" /> Create Quote
            </button>
            {isAdmin && (
              <button 
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-red-600 text-white' : 'hover:bg-gray-800 text-gray-400'}`}
              >
                <Settings className="w-5 h-5 mr-3" /> Config Panel
              </button>
            )}
          </nav>
          <div className="mt-auto p-4">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center p-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" /> Logout
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-6xl mx-auto">
            {activeTab === 'dashboard' && (
              <AdminPanel 
                state={state} 
                currentUser={currentUser}
                onEdit={editQuotation}
                onPrint={handlePrint}
                onDownload={handleDownloadPDF}
                onDelete={handleDeleteQuotation}
              />
            )}
            {activeTab === 'create' && (
              <QuotationForm 
                state={state} 
                currentUser={currentUser}
                editData={selectedQuotation}
                onSave={handleCreateQuotation}
                onSaveTemplate={handleSaveTemplate}
                onCancel={() => setActiveTab('dashboard')}
              />
            )}
            {activeTab === 'settings' && isAdmin && (
              <Suspense fallback={
                <div className="flex flex-col items-center justify-center p-16">
                  <Loader2 className="w-8 h-8 animate-spin text-red-600 mb-3" />
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Loading Configuration Panel...</span>
                </div>
              }>
                <SettingsView 
                  state={state} 
                  onUpdate={handleSettingsUpdate} 
                  onUpdateState={updateSettingsState}
                />
              </Suspense>
            )}
          </div>
        </main>
      </div>

      {printingQuote && (
        <div className="print-only">
          <PrintableView quotation={printingQuote} state={state} />
        </div>
      )}

      {downloadingQuote && (
        <div style={{ position: 'fixed', left: '-10000px', top: '0', zIndex: -1, pointerEvents: 'none' }}>
          <div ref={pdfRef} className="pdf-container">
            <PrintableView quotation={downloadingQuote} state={state} />
          </div>
        </div>
      )}

      {downloadingQuote && (
        <div className="fixed inset-0 bg-black/70 flex flex-col items-center justify-center z-[9999] no-print">
          <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center text-center">
            <div className="w-14 h-14 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-6"></div>
            <h2 className="text-xl font-black text-gray-900 mb-2">Generating Quote</h2>
            <p className="text-sm text-gray-500">Creating PDF document...</p>
          </div>
        </div>
      )}
    </>
  );
};

export default App;

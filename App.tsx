import React, { useState, useEffect, useRef } from 'react';
import { fetchFullState, saveSettingsToLocal, saveQuotationToLocal, deleteQuotationFromLocal, INITIAL_STATE } from './store';
import { AppState, Quotation, BOMTemplate, BOMItem, ProductPricing, ProductDescription, User, UserRole, PROJECT_TYPES, STRUCTURE_TYPES, PANEL_TYPES, ProjectType, StructureType, PanelType, WarrantyPackage, Term } from './types';
import AdminPanel from './components/AdminPanel';
import QuotationForm from './components/QuotationForm';
import PrintableView from './components/PrintableView';
import { LogIn, FileText, Settings, LayoutDashboard, PlusCircle, LogOut, Trash2, Plus, Copy, ChevronDown, ChevronUp, Loader2, Link, Users, UserPlus, CheckCircle, AlertCircle, Edit, Filter, RefreshCw, Upload, DownloadCloud, ShieldCheck, Search } from 'lucide-react';
import * as XLSX from 'xlsx';

declare var html2pdf: any;

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
    await saveQuotationToLocal(q, currentQuotes);
  };

  const handleDeleteQuotation = async (id: string) => {
    if (confirm('Delete this quotation?')) {
      const currentQuotes = state.quotations || [];
      const updatedQuotes = currentQuotes.filter(q => q.id !== id);
      setState(prev => ({ ...prev, quotations: updatedQuotes }));
      await deleteQuotationFromLocal(id, currentQuotes);
    }
  };

  const handleSaveTemplate = (name: string, items: BOMItem[]) => {
    const newTemplate: BOMTemplate = {
      id: Date.now().toString(),
      name,
      items
    };
    const newState = {
      ...state,
      bomTemplates: [...(state.bomTemplates || []), newTemplate]
    };
    setState(newState);
    saveSettingsToLocal(newState);
    alert(`BOM saved as template: ${name}`);
  };

  const handleSettingsUpdate = async (newState: AppState) => {
    setState(newState);
    await saveSettingsToLocal(newState);
  };

  const editQuotation = (q: Quotation) => {
    setSelectedQuotation(q);
    setActiveTab('create');
  };

  const handlePrint = (q: Quotation) => {
    setPrintingQuote(q);
    setTimeout(() => {
      window.print();
      setPrintingQuote(null);
    }, 250);
  };

  const handleDownloadPDF = async (q: Quotation) => {
    setDownloadingQuote(q);
    
    setTimeout(async () => {
      if (!pdfRef.current) return;
      
      const element = pdfRef.current;
      
      // Determine filename: Use Product Description if Site Survey Pending
      const fileName = q.status === 'Site Survey Pending' 
        ? `${q.systemDescription.replace(/\s+/g, '_')}.pdf`
        : `${q.customerName.replace(/\s+/g, '_')}_${q.id}.pdf`;

      const opt = {
        margin: 0,
        filename: fileName,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { 
          scale: 2,
          useCORS: true, 
          logging: false,
          letterRendering: false,
          scrollX: 0,
          scrollY: 0,
          x: 0,
          y: 0,
          windowWidth: 794, 
          backgroundColor: '#ffffff'
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait', 
          compress: true,
          putOnlyUsedFonts: true,
          precision: 12
        },
        pagebreak: { mode: ['css', 'legacy'] }
      };

      try {
        await html2pdf().set(opt).from(element).save();
      } catch (err) {
        console.error("PDF generation failed:", err);
        alert("Failed to generate PDF. Please use the Print button instead.");
      } finally {
        setDownloadingQuote(null);
      }
    }, 800);
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
              <SettingsView 
                state={state} 
                onUpdate={handleSettingsUpdate} 
              />
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
        <div style={{ position: 'fixed', left: '-9999px', top: '0', zIndex: -1 }}>
          <div ref={pdfRef} className="pdf-container">
            <PrintableView quotation={downloadingQuote} state={state} />
          </div>
        </div>
      )}

      {downloadingQuote && (
        <div className="fixed inset-0 bg-black/70 flex flex-col items-center justify-center z-[9999] no-print">
          <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center text-center">
            <div className="w-14 h-14 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-6"></div>
            <h2 className="text-xl font-black text-gray-900 mb-2">Generating Optimized PDF</h2>
            <p className="text-sm text-gray-500">Compressing graphics for fast sharing while maintaining HD clarity...</p>
          </div>
        </div>
      )}
    </>
  );
};

const SettingsView: React.FC<{ state: AppState, onUpdate: (s: AppState) => Promise<void> }> = ({ state, onUpdate }) => {
  const [activeSubTab, setActiveSubTab] = useState<'company' | 'users' | 'pricing' | 'terms' | 'bank' | 'warranty' | 'bom' | 'products'>('company');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const [filterProjectType, setFilterProjectType] = useState<string>('All');
  const [filterStructureType, setFilterStructureType] = useState<string>('All');
  const [filterPanelType, setFilterPanelType] = useState<string>('All');
  const [bomSearch, setBomSearch] = useState<string>('');

  const [newUser, setNewUser] = useState<Partial<User>>({ role: 'user', name: '', username: '', password: '', salesPersonName: '', salesPersonMobile: '' });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const productFileInputRef = useRef<HTMLInputElement>(null);
  const termsFileInputRef = useRef<HTMLInputElement>(null);
  const bomFileInputRef = useRef<HTMLInputElement>(null);
  const warrantyFileInputRef = useRef<HTMLInputElement>(null);

  const updateSub = async (key: keyof AppState, data: any) => {
    setSaveStatus('saving');
    try {
        await onUpdate({ ...state, [key]: data });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
    } catch(e) {
        setSaveStatus('error');
    }
  };

  const handleAddOrUpdateUser = () => {
    if(!newUser.name || !newUser.username || !newUser.password) {
      alert("Please fill all required user fields");
      return;
    }
    const currentUsers = state.users || [];
    if (editingUserId) {
        const updatedUsers = currentUsers.map(u => 
            u.id === editingUserId 
            ? { ...u, name: newUser.name!, username: newUser.username!, password: newUser.password!, role: (newUser.role as UserRole) || 'user', salesPersonName: newUser.salesPersonName, salesPersonMobile: newUser.salesPersonMobile }
            : u
        );
        updateSub('users', updatedUsers);
        setEditingUserId(null);
    } else {
        const user: User = {
          id: Date.now().toString(),
          name: newUser.name!,
          username: newUser.username!,
          password: newUser.password!,
          role: (newUser.role as UserRole) || 'user',
          salesPersonName: newUser.salesPersonName,
          salesPersonMobile: newUser.salesPersonMobile
        };
        updateSub('users', [...currentUsers, user]);
    }
    setNewUser({ role: 'user', name: '', username: '', password: '', salesPersonName: '', salesPersonMobile: '' });
  };

  const handleEditUser = (user: User) => {
      setNewUser({ name: user.name, username: user.username, password: user.password, role: user.role, salesPersonName: user.salesPersonName, salesPersonMobile: user.salesPersonMobile });
      setEditingUserId(user.id);
  };

  const handleDeleteUser = (id: string) => {
    const currentUsers = state.users || [];
    if(currentUsers.length <= 1) {
      alert("Cannot delete the last user");
      return;
    }
    if(confirm("Delete this user?")) {
      updateSub('users', currentUsers.filter(u => u.id !== id));
    }
  };

  const handleAddPricing = () => {
    const currentPricing = state.productPricing || [];
    const newId = Date.now().toString();
    const newItem: ProductPricing = {
      id: newId,
      name: 'New Pricing Package',
      projectType: filterProjectType !== 'All' ? filterProjectType as ProjectType : 'Ongrid Subsidy',
      structureType: filterStructureType !== 'All' ? filterStructureType as StructureType : '2 Meter Flat Roof Structure',
      panelType: filterPanelType !== 'All' ? filterPanelType as PanelType : 'TOPCON G12R',
      actualPlantCost: 0,
      discount: 0,
      subsidyAmount: 0,
      ksebCharges: 0,
      additionalMaterialCost: 0,
      customizedStructureCost: 0,
      netMeterCost: 0
    };
    updateSub('productPricing', [...currentPricing, newItem]);
    setEditingItemId(newId);
  };

  const updatePricingItem = (id: string, updates: Partial<ProductPricing>) => {
    const currentPricing = state.productPricing || [];
    updateSub('productPricing', currentPricing.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const handleAddWarranty = () => {
    const currentWarranties = state.warrantyPackages || [];
    const newId = Date.now().toString();
    const newPackage: WarrantyPackage = {
      id: newId,
      projectType: filterProjectType !== 'All' ? filterProjectType as ProjectType : 'Ongrid Subsidy',
      structureType: filterStructureType !== 'All' ? filterStructureType as StructureType : '2 Meter Flat Roof Structure',
      panelType: filterPanelType !== 'All' ? filterPanelType as PanelType : 'TOPCON G12R',
      panelWarranty: '',
      inverterWarranty: '',
      batteryWarranty: '',
      systemWarranty: '',
      monitoringSystem: ''
    };
    updateSub('warrantyPackages', [...currentWarranties, newPackage]);
    setEditingItemId(newId);
  };

  const handleCopyWarranty = (w: WarrantyPackage) => {
    const currentWarranties = state.warrantyPackages || [];
    const newId = Date.now().toString();
    const copiedPackage: WarrantyPackage = {
      ...w,
      id: newId
    };
    updateSub('warrantyPackages', [...currentWarranties, copiedPackage]);
    setEditingItemId(newId);
    alert('Warranty package duplicated successfully');
  };

  const updateWarrantyPackage = (id: string, updates: Partial<WarrantyPackage>) => {
    const currentWarranties = state.warrantyPackages || [];
    updateSub('warrantyPackages', currentWarranties.map(w => w.id === id ? { ...w, ...updates } : w));
  };

  const handleCopyTerm = (term: Term) => {
    const currentTerms = state.terms || [];
    const newId = Date.now().toString();
    const copiedTerm: Term = {
      ...term,
      id: newId
    };
    updateSub('terms', [...currentTerms, copiedTerm]);
    alert('Term copied successfully');
  };

  const handleBulkImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          alert("Excel sheet is empty");
          return;
        }

        const newPricingList: ProductPricing[] = data.map((row: any) => ({
          id: Math.random().toString(36).substr(2, 9),
          name: row['Package Name'] || 'Imported Package',
          projectType: (row['Project Type'] || 'Ongrid Subsidy') as ProjectType,
          structureType: (row['Structure Type'] || '2 Meter Flat Roof Structure') as StructureType,
          panelType: (row['Panel Type'] || 'TOPCON G12R') as PanelType,
          actualPlantCost: Number(row['Actual Cost'] || 0),
          discount: Number(row['Discount'] || 0),
          subsidyAmount: Number(row['Subsidy Amount'] || 0),
          ksebCharges: Number(row['KSEB Charges'] || 0),
          netMeterCost: Number(row['Net Meter Cost'] || 0),
          additionalMaterialCost: 0,
          customizedStructureCost: 0
        }));

        if (confirm(`Import ${newPricingList.length} pricing packages? This will append to existing list.`)) {
          updateSub('productPricing', [...(state.productPricing || []), ...newPricingList]);
        }
      } catch (error) {
        console.error("Bulk import failed:", error);
        alert("Failed to import data. Please check Excel format.");
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  const handleBulkImportProducts = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          alert("Excel sheet is empty");
          return;
        }

        const newProductList: ProductDescription[] = data.map((row: any) => ({
          id: Math.random().toString(36).substr(2, 9),
          name: row['Heading/Name'] || 'Imported Product',
          projectType: (row['Project Type'] || 'Ongrid Subsidy') as ProjectType,
          structureType: (row['Structure Type'] || '2 Meter Flat Roof Structure') as StructureType,
          panelType: (row['Panel Type'] || 'TOPCON G12R') as PanelType,
          defaultPricingId: row['Pricing ID Link'] || '',
          defaultBomTemplateId: row['BOM Template ID Link'] || ''
        }));

        if (confirm(`Import ${newProductList.length} product specifications? This will append to existing list.`)) {
          updateSub('productDescriptions', [...(state.productDescriptions || []), ...newProductList]);
        }
      } catch (error) {
        console.error("Bulk import failed:", error);
        alert("Failed to import product data. Please check Excel format.");
      }
      if (productFileInputRef.current) productFileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  const handleBulkImportTerms = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          alert("Excel sheet is empty");
          return;
        }

        const newTerms: Term[] = data.map((row: any, idx: number) => ({
          id: Math.random().toString(36).substr(2, 9),
          text: row['Term Text'] || 'New Term',
          enabled: row['Enabled']?.toString().toLowerCase() === 'false' ? false : true,
          order: state.terms.length + idx + 1,
          projectType: (row['Project Type'] || 'Ongrid Subsidy') as ProjectType,
          structureType: (row['Structure Type'] || '2 Meter Flat Roof Structure') as StructureType,
          panelType: (row['Panel Type'] || 'TOPCON G12R') as PanelType
        }));

        if (confirm(`Import ${newTerms.length} terms? This will append to existing list.`)) {
          updateSub('terms', [...(state.terms || []), ...newTerms]);
        }
      } catch (error) {
        console.error("Bulk import failed:", error);
        alert("Failed to import terms data. Please check Excel format.");
      }
      if (termsFileInputRef.current) termsFileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  const handleBulkImportBOM = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          alert("Excel sheet is empty");
          return;
        }

        // Group rows by Template Name
        const templatesMap: Record<string, BOMItem[]> = {};
        data.forEach((row: any) => {
          const templateName = row['Template Name'] || 'Imported BOM Template';
          if (!templatesMap[templateName]) {
            templatesMap[templateName] = [];
          }
          templatesMap[templateName].push({
            id: Math.random().toString(36).substr(2, 9),
            product: row['Product Component'] || '',
            uom: row['UOM'] || '',
            quantity: row['Qty']?.toString() || '',
            specification: row['Specification'] || '',
            make: row['Make / Brand'] || ''
          });
        });

        const newTemplates: BOMTemplate[] = Object.entries(templatesMap).map(([name, items]) => ({
          id: Math.random().toString(36).substr(2, 9),
          name: name,
          items: items
        }));

        if (confirm(`Import ${newTemplates.length} BOM templates with total ${data.length} components? This will append to existing list.`)) {
          updateSub('bomTemplates', [...(state.bomTemplates || []), ...newTemplates]);
        }
      } catch (error) {
        console.error("Bulk BOM import failed:", error);
        alert("Failed to import BOM data. Please check Excel format.");
      }
      if (bomFileInputRef.current) bomFileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  const handleBulkImportWarranties = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          alert("Excel sheet is empty");
          return;
        }

        const newWarranties: WarrantyPackage[] = data.map((row: any) => ({
          id: Math.random().toString(36).substr(2, 9),
          projectType: (row['Project Type'] || 'Ongrid Subsidy') as ProjectType,
          structureType: (row['Structure Type'] || '2 Meter Flat Roof Structure') as StructureType,
          panelType: (row['Panel Type'] || 'TOPCON G12R') as PanelType,
          panelWarranty: row['Panel Warranty'] || '',
          inverterWarranty: row['Inverter Warranty'] || '',
          batteryWarranty: row['Battery Warranty'] || '',
          systemWarranty: row['System Warranty'] || '',
          monitoringSystem: row['Monitoring System'] || ''
        }));

        if (confirm(`Import ${newWarranties.length} warranty declarations? This will append to existing list.`)) {
          updateSub('warrantyPackages', [...(state.warrantyPackages || []), ...newWarranties]);
        }
      } catch (error) {
        console.error("Bulk Warranty import failed:", error);
        alert("Failed to import warranty data. Please check Excel format.");
      }
      if (warrantyFileInputRef.current) warrantyFileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  const downloadSampleExcel = () => {
    const sampleData = [
      {
        'Package Name': '3kW Sample Package',
        'Project Type': 'Ongrid Subsidy',
        'Structure Type': '2 Meter Flat Roof Structure',
        'Panel Type': 'TOPCON G12R',
        'Actual Cost': 185000,
        'Discount': 5000,
        'Subsidy Amount': 78000,
        'KSEB Charges': 1500,
        'Net Meter Cost': 2000
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pricing_Template");
    XLSX.writeFile(wb, "Solar_Pricing_Import_Sample.xlsx");
  };

  const downloadSampleProductsExcel = () => {
    const sampleData = [
      {
        'Heading/Name': '3kW ON-GRID SOLAR POWER GENERATING SYSTEM',
        'Project Type': 'Ongrid Subsidy',
        'Structure Type': '2 Meter Flat Roof Structure',
        'Panel Type': 'TOPCON G12R',
        'Pricing ID Link': '',
        'BOM Template ID Link': ''
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products_Template");
    XLSX.writeFile(wb, "Solar_Products_Import_Sample.xlsx");
  };

  const downloadSampleTermsExcel = () => {
    const sampleData = [
      {
        'Term Text': 'The system will be installed within 15 days of advance payment.',
        'Project Type': 'Ongrid Subsidy',
        'Structure Type': '2 Meter Flat Roof Structure',
        'Panel Type': 'TOPCON G12R',
        'Enabled': 'True'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Terms_Template");
    XLSX.writeFile(wb, "Solar_Terms_Import_Sample.xlsx");
  };

  const downloadSampleBOMExcel = () => {
    const sampleData = [
      {
        'Template Name': '3kW Sample BOM',
        'Product Component': 'Solar Panels',
        'UOM': 'Nos',
        'Qty': '8',
        'Specification': '550Wp Mono PERC',
        'Make / Brand': 'Adani'
      },
      {
        'Template Name': '3kW Sample BOM',
        'Product Component': 'On-Grid Inverter',
        'UOM': 'No',
        'Qty': '1',
        'Specification': '3kW String Inverter',
        'Make / Brand': 'Growatt'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "BOM_Template");
    XLSX.writeFile(wb, "Solar_BOM_Import_Sample.xlsx");
  };

  const downloadSampleWarrantyExcel = () => {
    const sampleData = [
      {
        'Project Type': 'Ongrid Subsidy',
        'Structure Type': '2 Meter Flat Roof Structure',
        'Panel Type': 'TOPCON G12R',
        'Panel Warranty': '25 Years Performance Warranty',
        'Inverter Warranty': '10 Years Product Warranty',
        'Battery Warranty': '',
        'System Warranty': '5 Years Free Service',
        'Monitoring System': 'Standard Online Monitoring'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Warranty_Template");
    XLSX.writeFile(wb, "Solar_Warranty_Import_Sample.xlsx");
  };

  const handleAddProduct = () => {
    const currentProducts = state.productDescriptions || [];
    const newId = Date.now().toString();
    const newProduct: ProductDescription = {
      id: newId,
      name: 'New Product Specification',
      projectType: filterProjectType !== 'All' ? filterProjectType as ProjectType : 'Ongrid Subsidy',
      structureType: filterStructureType !== 'All' ? filterStructureType as StructureType : '2 Meter Flat Roof Structure',
      panelType: filterPanelType !== 'All' ? filterPanelType as PanelType : 'TOPCON G12R',
      defaultPricingId: '',
      defaultBomTemplateId: ''
    };
    updateSub('productDescriptions', [...currentProducts, newProduct]);
    setExpandedProductId(newId);
  };

  const updateProductDesc = (id: string, updates: Partial<ProductDescription>) => {
    const currentProducts = state.productDescriptions || [];
    updateSub('productDescriptions', currentProducts.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const handleCreateTemplate = () => {
    const currentTemplates = state.bomTemplates || [];
    const newId = Date.now().toString();
    const newTemplate: BOMTemplate = { id: newId, name: 'New BOM Template', items: [] };
    updateSub('bomTemplates', [...currentTemplates, newTemplate]);
    setExpandedTemplateId(newId);
  };

  const handleUpdateTemplate = (id: string, updates: Partial<BOMTemplate>) => {
    const currentTemplates = state.bomTemplates || [];
    updateSub('bomTemplates', currentTemplates.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const pricingList = state.productPricing || [];
  const productsList = state.productDescriptions || [];
  const templatesList = state.bomTemplates || [];
  const termsList = state.terms || [];
  const usersList = state.users || [];
  const warrantiesList = state.warrantyPackages || [];

  const filteredPricing = pricingList.filter(p => {
    const ptMatch = filterProjectType === 'All' || p.projectType === filterProjectType;
    const stMatch = filterStructureType === 'All' || p.structureType === filterStructureType;
    const paMatch = filterPanelType === 'All' || p.panelType === filterPanelType;
    return ptMatch && stMatch && paMatch;
  });

  const filteredProducts = productsList.filter(p => {
    const ptMatch = filterProjectType === 'All' || p.projectType === filterProjectType;
    const stMatch = filterStructureType === 'All' || p.structureType === filterStructureType;
    const paMatch = filterPanelType === 'All' || p.panelType === filterPanelType;
    return ptMatch && stMatch && paMatch;
  });

  const filteredWarranties = warrantiesList.filter(w => {
    const ptMatch = filterProjectType === 'All' || w.projectType === filterProjectType;
    const stMatch = filterStructureType === 'All' || w.structureType === filterStructureType;
    const paMatch = filterPanelType === 'All' || w.panelType === filterPanelType;
    return ptMatch && stMatch && paMatch;
  });

  const filteredTerms = termsList.filter(t => {
    const ptMatch = filterProjectType === 'All' || t.projectType === filterProjectType;
    const stMatch = filterStructureType === 'All' || t.structureType === filterStructureType;
    const paMatch = filterPanelType === 'All' || t.panelType === filterPanelType;
    return ptMatch && stMatch && paMatch;
  });

  const filteredBOMTemplates = templatesList.filter(t => 
    t.name.toLowerCase().includes(bomSearch.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
         {saveStatus === 'saving' && <span className="flex items-center text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full shadow-sm"><Loader2 className="w-3 h-3 animate-spin mr-2"/> Saving...</span>}
         {saveStatus === 'saved' && <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full shadow-sm"><CheckCircle className="w-3 h-3 mr-2"/> Saved</span>}
         {saveStatus === 'error' && <span className="flex items-center text-xs font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full shadow-sm"><AlertCircle className="w-3 h-3 mr-2"/> Error</span>}
      </div>

      <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto">
        {(['company', 'users', 'pricing', 'terms', 'bank', 'warranty', 'bom', 'products'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveSubTab(tab); setEditingItemId(null); }}
            className={`px-6 py-4 text-sm font-medium capitalize whitespace-nowrap transition-colors ${activeSubTab === tab ? 'text-red-600 border-b-2 border-red-600 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab === 'bom' ? 'BOM Templates' : tab === 'products' ? 'Product Names & Links' : tab === 'pricing' ? 'Pricing Table' : tab}
          </button>
        ))}
      </div>
      
      <div className="p-8">
        {(activeSubTab === 'pricing' || activeSubTab === 'products' || activeSubTab === 'warranty' || activeSubTab === 'terms' || activeSubTab === 'bom') && (
           <div className="flex flex-wrap gap-4 items-center mb-6 p-4 bg-gray-100 rounded-lg border border-gray-200">
             <div className="flex items-center gap-2">
               <Filter className="w-4 h-4 text-gray-500" />
               <span className="text-xs font-black uppercase text-gray-400">View Filters:</span>
             </div>
             
             {activeSubTab !== 'bom' ? (
               <>
                 <select 
                   className="text-xs font-bold border rounded p-1.5 bg-white outline-none focus:ring-1 focus:ring-red-500"
                   value={filterProjectType}
                   onChange={e => setFilterProjectType(e.target.value)}
                 >
                   <option value="All">All Project Types</option>
                   {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                 </select>
                 <select 
                   className="text-xs font-bold border rounded p-1.5 bg-white outline-none focus:ring-1 focus:ring-red-500"
                   value={filterStructureType}
                   onChange={e => setFilterStructureType(e.target.value)}
                 >
                   <option value="All">All Structure Types</option>
                   {STRUCTURE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                 </select>
                 <select 
                   className="text-xs font-bold border rounded p-1.5 bg-white outline-none focus:ring-1 focus:ring-red-500"
                   value={filterPanelType}
                   onChange={e => setFilterPanelType(e.target.value)}
                 >
                   <option value="All">All Panel Types</option>
                   {PANEL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                 </select>
               </>
             ) : (
               <div className="relative flex-1 md:max-w-sm">
                 <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                 <input 
                   type="text" 
                   placeholder="Search templates by name..."
                   value={bomSearch}
                   onChange={e => setBomSearch(e.target.value)}
                   className="pl-8 pr-4 py-1.5 w-full bg-white border rounded text-xs font-bold outline-none focus:ring-1 focus:ring-red-500"
                 />
               </div>
             )}

             <button 
               onClick={() => { setFilterProjectType('All'); setFilterStructureType('All'); setFilterPanelType('All'); setBomSearch(''); }}
               className="text-[10px] font-black text-gray-400 uppercase hover:text-red-600 flex items-center gap-1 transition-colors ml-auto"
             >
               <RefreshCw className="w-3 h-3"/> Reset
             </button>
           </div>
        )}

        {activeSubTab === 'company' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold">Company Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="flex items-center gap-6 p-4 border rounded-lg bg-gray-50">
                  {state.company?.logo && <img src={state.company.logo} className="h-16 w-auto object-contain border bg-white p-1 rounded" alt="Logo" />}
                  <div>
                    <label className="bg-white border px-4 py-2 rounded-lg text-sm font-bold cursor-pointer hover:bg-gray-50 inline-block shadow-sm">
                      Change Logo
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => updateSub('company', { ...state.company, logo: reader.result as string });
                          reader.readAsDataURL(file);
                        }
                      }} />
                    </label>
                  </div>
               </div>
               <div className="flex items-center gap-6 p-4 border rounded-lg bg-gray-50">
                  {state.company?.seal && <img src={state.company.seal} className="h-16 w-auto object-contain border bg-white p-1 rounded" alt="Seal" />}
                  <div>
                    <label className="bg-white border px-4 py-2 rounded-lg text-sm font-bold cursor-pointer hover:bg-gray-50 inline-block shadow-sm">
                      Upload Seal
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => updateSub('company', { ...state.company, seal: reader.result as string });
                          reader.readAsDataURL(file);
                        }
                      }} />
                    </label>
                  </div>
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2"><label className="block text-xs uppercase font-black text-gray-400 mb-1">Company Full Name</label><input value={state.company?.name || ''} onChange={e => updateSub('company', { ...state.company, name: e.target.value })} className="w-full border p-2 rounded" /></div>
              <div className="md:col-span-2"><label className="block text-xs uppercase font-black text-gray-400 mb-1">Head Office Address</label><textarea value={state.company?.headOffice || ''} onChange={e => updateSub('company', { ...state.company, headOffice: e.target.value })} className="w-full border p-2 rounded" rows={2} /></div>
              <div><label className="block text-xs uppercase font-black text-gray-400 mb-1">Regional Branch 1</label><input value={state.company?.regionalOffice1 || ''} onChange={e => updateSub('company', { ...state.company, regionalOffice1: e.target.value })} className="w-full border p-2 rounded" /></div>
              <div><label className="block text-xs uppercase font-black text-gray-400 mb-1">Regional Branch 2</label><input value={state.company?.regionalOffice2 || ''} onChange={e => updateSub('company', { ...state.company, regionalOffice2: e.target.value })} className="w-full border p-2 rounded" /></div>
              <div><label className="block text-xs uppercase font-black text-gray-400 mb-1">Website URL</label><input value={state.company?.website || ''} onChange={e => updateSub('company', { ...state.company, website: e.target.value })} className="w-full border p-2 rounded" placeholder="e.g. www.kondaas.com" /></div>
              <div><label className="block text-xs uppercase font-black text-gray-400 mb-1">Mail ID (Email)</label><input value={state.company?.email || ''} onChange={e => updateSub('company', { ...state.company, email: e.target.value })} className="w-full border p-2 rounded" placeholder="e.g. info@kondaas.com" /></div>
              <div><label className="block text-xs uppercase font-black text-gray-400 mb-1">GSTIN</label><input value={state.company?.gstin || ''} onChange={e => updateSub('company', { ...state.company, gstin: e.target.value })} className="w-full border p-2 rounded" /></div>
              <div><label className="block text-xs uppercase font-black text-gray-400 mb-1">Contact Phone</label><input value={state.company?.phone || ''} onChange={e => updateSub('company', { ...state.company, phone: e.target.value })} className="w-full border p-2 rounded" /></div>
            </div>
          </div>
        )}

        {activeSubTab === 'users' && (
          <div className="space-y-6">
             <h3 className="text-lg font-bold">User Management</h3>
             <div className="p-6 rounded-lg border bg-gray-50 shadow-inner">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-4">
                   <div><label className="text-[10px] uppercase font-black text-gray-400 mb-1 block">Full Display Name</label><input className="w-full border p-2 rounded bg-white" value={newUser.name || ''} onChange={e => setNewUser({...newUser, name: e.target.value})} /></div>
                   <div><label className="text-[10px] uppercase font-black text-gray-400 mb-1 block">Username (Login ID)</label><input className="w-full border p-2 rounded bg-white" value={newUser.username || ''} onChange={e => setNewUser({...newUser, username: e.target.value})} /></div>
                   <div><label className="text-[10px] uppercase font-black text-gray-400 mb-1 block">Access Password</label><input className="w-full border p-2 rounded bg-white" type="password" value={newUser.password || ''} onChange={e => setNewUser({...newUser, password: e.target.value})} /></div>
                   <div><label className="text-[10px] uppercase font-black text-gray-400 mb-1 block">Role Level</label>
                      <select className="w-full border p-2 rounded bg-white text-sm font-bold" value={newUser.role || 'user'} onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}>
                         <option value="user">User</option><option value="TL">Team Leader</option><option value="admin">Administrator</option>
                      </select>
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                   <div><label className="text-[10px] uppercase font-black text-gray-400 mb-1 block">Sales Person Label</label><input className="w-full border p-2 rounded bg-white" placeholder="e.g. John Doe" value={newUser.salesPersonName || ''} onChange={e => setNewUser({...newUser, salesPersonName: e.target.value})} /></div>
                   <div className="flex gap-2">
                     <div className="flex-1"><label className="text-[10px] uppercase font-black text-gray-400 mb-1 block">Sales Person Mobile No</label><input className="w-full border p-2 rounded bg-white" placeholder="e.g. +91 99999 00000" value={newUser.salesPersonMobile || ''} onChange={e => setNewUser({...newUser, salesPersonMobile: e.target.value})} /></div>
                     <button onClick={handleAddOrUpdateUser} className="bg-black text-white px-6 py-2 rounded font-black uppercase text-xs shadow-md active:translate-y-0.5 transition-transform self-end h-[42px]">{editingUserId ? 'Update' : 'Add'}</button>
                   </div>
                </div>
             </div>
             <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50"><tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest"><th className="px-6 py-4 text-left">Staff Name</th><th className="px-6 py-4 text-left">Login ID</th><th className="px-6 py-4 text-left">Sales Profile</th><th className="px-6 py-4 text-left">System Role</th><th className="px-6 py-4 text-right">Actions</th></tr></thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                     {usersList.map(u => (
                       <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm font-bold text-gray-900">{u.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{u.username}</td>
                          <td className="px-6 py-4">
                            <div className="text-[10px]">
                              <p className="font-bold">{u.salesPersonName || u.name}</p>
                              <p className="text-gray-400">{u.salesPersonMobile || 'No Mobile'}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4"><span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-full border ${u.role === 'admin' ? 'bg-red-50 text-red-600 border-red-100' : u.role === 'TL' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-gray-50 text-gray-600 border-gray-100'}`}>{u.role}</span></td>
                          <td className="px-6 py-4 text-right space-x-3">
                             <button onClick={() => handleEditUser(u)} className="text-blue-600 hover:text-blue-800"><Edit className="w-4 h-4 inline"/></button>
                             <button onClick={() => handleDeleteUser(u.id)} className="text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4 inline"/></button>
                          </td>
                       </tr>
                     ))}
                  </tbody>
                </table>
             </div>
          </div>
        )}

        {activeSubTab === 'pricing' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h3 className="text-lg font-bold">Pricing Packages</h3>
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <button 
                  onClick={downloadSampleExcel} 
                  className="flex-1 md:flex-none border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded text-xs font-black uppercase flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <DownloadCloud className="w-4 h-4" /> Sample Excel
                </button>
                <label className="flex-1 md:flex-none bg-blue-600 text-white px-4 py-2 rounded text-xs font-black uppercase flex items-center justify-center gap-2 cursor-pointer hover:bg-blue-700 transition-colors shadow-md shadow-blue-100">
                  <Upload className="w-4 h-4" /> Bulk Import
                  <input ref={fileInputRef} type="file" accept=".xlsx, .xls" className="hidden" onChange={handleBulkImport} />
                </label>
                <button 
                  onClick={handleAddPricing} 
                  className="flex-1 md:flex-none bg-black text-white px-4 py-2 rounded text-xs font-black uppercase flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" /> Add Single
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              {filteredPricing.map(p => (
                <div key={p.id} className="border rounded-lg bg-gray-50 overflow-hidden shadow-sm">
                  <div className="p-4 bg-white flex justify-between items-center border-b">
                    <div className="flex-1 min-w-0 pr-4">
                      <input className="font-black text-gray-900 border-b border-transparent focus:border-red-600 outline-none uppercase text-[11px] tracking-tight w-full truncate" value={p.name || ''} onChange={e => updatePricingItem(p.id, { name: e.target.value })} />
                      <div className="flex gap-2 mt-1.5">
                        <span className="text-[9px] font-black uppercase bg-gray-100 text-gray-500 px-2 py-0.5 rounded border">{p.projectType}</span>
                        <span className="text-[9px] font-black uppercase bg-gray-100 text-gray-500 px-2 py-0.5 rounded border">{p.structureType}</span>
                        <span className="text-[9px] font-black uppercase bg-red-50 text-red-500 px-2 py-0.5 rounded border border-red-100">{p.panelType}</span>
                      </div>
                    </div>
                    <div className="flex gap-2"><button onClick={() => setEditingItemId(editingItemId === p.id ? null : p.id)} className={`text-xs font-black uppercase px-4 py-1.5 rounded border transition-colors shadow-sm ${editingItemId === p.id ? 'bg-black text-white' : 'bg-white text-blue-600 hover:bg-gray-50'}`}>{editingItemId === p.id ? 'Save' : 'Edit Prices'}</button><button onClick={() => updateSub('productPricing', pricingList.filter(item => item.id !== p.id))} className="text-red-400 hover:text-red-600 p-1"><Trash2 className="w-4 h-4" /> </button></div>
                  </div>
                  {editingItemId === p.id && (
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                      <div><label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Project Type</label><select className="w-full border p-2 rounded text-xs font-bold bg-white" value={p.projectType} onChange={e => updatePricingItem(p.id, { projectType: e.target.value as ProjectType })}>{PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                      <div><label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Structure Type</label><select className="w-full border p-2 rounded text-xs font-bold bg-white" value={p.structureType} onChange={e => updatePricingItem(p.id, { structureType: e.target.value as StructureType })}>{STRUCTURE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                      <div><label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Panel Type</label><select className="w-full border p-2 rounded text-xs font-bold bg-white" value={p.panelType} onChange={e => updatePricingItem(p.id, { panelType: e.target.value as PanelType })}>{PANEL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                      <div><label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Actual Plant Cost (₹)</label><input type="number" value={p.actualPlantCost} onChange={e => updatePricingItem(p.id, { actualPlantCost: Number(e.target.value) })} className="w-full border p-2 rounded font-black text-gray-900 bg-white" /></div>
                      <div><label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Discount Amount (₹)</label><input type="number" value={p.discount} onChange={e => updatePricingItem(p.id, { discount: Number(e.target.value) })} className="w-full border p-2 rounded text-green-600 font-bold bg-white" /></div>
                      {!p.projectType.toLowerCase().includes('non subsidy') && (
                        <div><label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Subsidy Amount (₹)</label><input type="number" value={p.subsidyAmount} onChange={e => updatePricingItem(p.id, { subsidyAmount: Number(e.target.value) })} className="w-full border p-2 rounded text-red-600 font-bold bg-white" /></div>
                      )}
                      <div><label className="block text-[10px] uppercase font-black text-gray-400 mb-1">KSEB Charges (₹)</label><input type="number" value={p.ksebCharges} onChange={e => updatePricingItem(p.id, { ksebCharges: Number(e.target.value) })} className="w-full border p-2 rounded bg-white" /></div>
                      <div><label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Net Meter Cost (₹)</label><input type="number" value={p.netMeterCost || 0} onChange={e => updatePricingItem(p.id, { netMeterCost: Number(e.target.value) })} className="w-full border p-3 rounded bg-white" /></div>
                    </div>
                  )}
                </div>
              ))}
              {filteredPricing.length === 0 && <p className="text-center py-10 text-gray-400 text-xs font-bold uppercase tracking-widest border-2 border-dashed rounded-lg">No pricing packages found for these filters.</p>}
            </div>
          </div>
        )}

        {activeSubTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h3 className="text-lg font-bold">Product Specifications & Headings</h3>
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <button 
                  onClick={downloadSampleProductsExcel} 
                  className="flex-1 md:flex-none border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded text-xs font-black uppercase flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <DownloadCloud className="w-4 h-4" /> Sample Excel
                </button>
                <label className="flex-1 md:flex-none bg-blue-600 text-white px-4 py-2 rounded text-xs font-black uppercase flex items-center justify-center gap-2 cursor-pointer hover:bg-blue-700 transition-colors shadow-md shadow-blue-100">
                  <Upload className="w-4 h-4" /> Bulk Import
                  <input ref={productFileInputRef} type="file" accept=".xlsx, .xls" className="hidden" onChange={handleBulkImportProducts} />
                </label>
                <button 
                  onClick={handleAddProduct} 
                  className="flex-1 md:flex-none bg-black text-white px-4 py-2 rounded text-xs font-black uppercase flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" /> Add Specification
                </button>
              </div>
            </div>
            <div className="space-y-4">
              {filteredProducts.map((desc) => (
                <div key={desc.id} className="border rounded-xl overflow-hidden shadow-sm border-gray-100 bg-white transition-all hover:border-red-100">
                  {/* Collapsible Header */}
                  <div 
                    onClick={() => setExpandedProductId(expandedProductId === desc.id ? null : desc.id)}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors border-b border-transparent"
                  >
                    <div className="flex flex-col flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-3">
                        {expandedProductId === desc.id ? <ChevronUp className="w-5 h-5 text-red-600 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />}
                        <h4 className="font-black text-gray-900 uppercase truncate text-[11px] tracking-tight">{desc.name || 'Untitled Specification'}</h4>
                      </div>
                      <div className="flex gap-2 mt-1.5 ml-8">
                        <span className="text-[9px] font-black uppercase bg-gray-100 text-gray-500 px-2 py-0.5 rounded border">{desc.projectType}</span>
                        <span className="text-[9px] font-black uppercase bg-red-50 text-red-500 px-2 py-0.5 rounded border border-red-100">{desc.panelType}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <button onClick={(e) => { e.stopPropagation(); updateSub('productDescriptions', productsList.filter(i => i.id !== desc.id)); }} className="text-red-300 hover:text-red-500 p-2"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </div>

                  {/* Collapsible Content */}
                  {expandedProductId === desc.id && (
                    <div className="p-6 bg-gray-50 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="md:col-span-2">
                        <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Full Product Description Heading (A4 PDF Title)</label>
                        <input className="w-full bg-white border p-3 rounded-lg text-sm font-black text-gray-900 uppercase tracking-tight focus:ring-2 focus:ring-red-500 outline-none" value={desc.name || ''} onChange={e => updateProductDesc(desc.id, { name: e.target.value })} />
                      </div>
                      <div><label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Category Classification</label><select className="w-full border p-2.5 rounded-lg bg-white text-xs font-bold" value={desc.projectType || 'Ongrid Subsidy'} onChange={e => updateProductDesc(desc.id, { projectType: e.target.value as ProjectType })}>{PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                      <div><label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Structural Classification</label><select className="w-full border p-2.5 rounded-lg bg-white text-xs font-bold" value={desc.structureType || '2 Meter Flat Roof Structure'} onChange={e => updateProductDesc(desc.id, { structureType: e.target.value as StructureType })}>{STRUCTURE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                      <div><label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Panel Type Classification</label><select className="w-full border p-2.5 rounded-lg bg-white text-xs font-bold" value={desc.panelType || 'TOPCON G12R'} onChange={e => updateProductDesc(desc.id, { panelType: e.target.value as PanelType })}>{PANEL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                      <div><label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Link Pricing Model (Auto-Fill)</label>
                        <select className="w-full border p-2.5 rounded-lg bg-white text-xs font-bold text-blue-600" value={desc.defaultPricingId || ''} onChange={e => updateProductDesc(desc.id, { defaultPricingId: e.target.value })}>
                          <option value="">-- No Auto-Link --</option>
                          {pricingList.filter(pr => pr.projectType === desc.projectType && pr.structureType === desc.structureType && pr.panelType === desc.panelType).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                      <div><label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Link BOM Template (Auto-Fill)</label>
                        <select className="w-full border p-2.5 rounded-lg bg-white text-xs font-bold text-red-600" value={desc.defaultBomTemplateId || ''} onChange={e => updateProductDesc(desc.id, { defaultBomTemplateId: e.target.value })}>
                          <option value="">-- No Auto-Link --</option>
                          {templatesList.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>
                      <div className="md:col-span-2 flex justify-end pt-2">
                        <button onClick={() => setExpandedProductId(null)} className="text-gray-500 text-[10px] font-black uppercase flex items-center gap-1 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-colors border border-gray-200">Collapse Panel</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {filteredProducts.length === 0 && <p className="text-center py-10 text-gray-400 text-xs font-bold uppercase tracking-widest border-2 border-dashed rounded-lg bg-gray-50/50">No product definitions matched the current categorization. Reset filters to view all.</p>}
            </div>
          </div>
        )}

        {activeSubTab === 'terms' && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h3 className="text-lg font-bold">Standard Terms & Conditions</h3>
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <button 
                  onClick={downloadSampleTermsExcel} 
                  className="flex-1 md:flex-none border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded text-xs font-black uppercase flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <DownloadCloud className="w-4 h-4" /> Sample Excel
                </button>
                <label className="flex-1 md:flex-none bg-blue-600 text-white px-4 py-2 rounded text-xs font-black uppercase flex items-center justify-center gap-2 cursor-pointer hover:bg-blue-700 transition-colors shadow-md shadow-blue-100">
                  <Upload className="w-4 h-4" /> Bulk Import
                  <input ref={termsFileInputRef} type="file" accept=".xlsx, .xls" className="hidden" onChange={handleBulkImportTerms} />
                </label>
                <button onClick={() => updateSub('terms', [...termsList, { 
                  id: Date.now().toString(), 
                  text: 'New Term', 
                  enabled: true, 
                  order: termsList.length + 1,
                  projectType: filterProjectType !== 'All' ? filterProjectType as ProjectType : 'Ongrid Subsidy',
                  structureType: filterStructureType !== 'All' ? filterStructureType as StructureType : '2 Meter Flat Roof Structure',
                  panelType: filterPanelType !== 'All' ? filterPanelType as PanelType : 'TOPCON G12R'
                }])} className="flex-1 md:flex-none bg-black text-white px-4 py-2 rounded text-sm font-bold shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all">
                  <Plus className="w-4 h-4" /> Add Term Entry
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {filteredTerms.sort((a,b) => a.order - b.order).map((term, idx) => (
                <div key={term.id} className="flex flex-col gap-3 p-5 border rounded-xl bg-white shadow-sm hover:border-red-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-black text-gray-300 text-xs uppercase tracking-widest">Term #{idx + 1}</span>
                    <div className="flex gap-1.5">
                        <span className="text-[8px] font-black uppercase bg-gray-50 text-gray-400 px-1.5 py-0.5 rounded border">{term.projectType}</span>
                        <span className="text-[8px] font-black uppercase bg-gray-50 text-gray-400 px-1.5 py-0.5 rounded border">{term.structureType}</span>
                        <span className="text-[8px] font-black uppercase bg-red-50 text-red-400 px-1.5 py-0.5 rounded border border-red-100">{term.panelType}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <textarea 
                      value={term.text || ''} 
                      onChange={e => updateSub('terms', termsList.map(t => t.id === term.id ? { ...t, text: e.target.value } : t))} 
                      className="flex-1 border-gray-100 bg-gray-50/30 rounded-lg focus:ring-red-500 focus:border-red-500 p-3 text-sm font-medium leading-relaxed outline-none transition-all" 
                      rows={2} 
                    />
                    <div className="flex flex-col items-center gap-4 self-center pr-2">
                      <input 
                        type="checkbox" 
                        checked={term.enabled} 
                        onChange={e => updateSub('terms', termsList.map(t => t.id === term.id ? { ...t, enabled: e.target.checked } : t))} 
                        className="w-5 h-5 accent-red-600 rounded cursor-pointer shadow-sm" 
                        title="Enable/Disable Term"
                      />
                      <button onClick={() => handleCopyTerm(term)} className="text-blue-500 hover:text-blue-700 transition-colors" title="Copy Term"><Copy className="w-4 h-4" /></button>
                      <button onClick={() => updateSub('terms', termsList.filter(t => t.id !== term.id))} className="text-red-400 hover:text-red-600 transition-colors" title="Delete Term"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                    <select className="text-[9px] font-bold border rounded p-1.5 bg-white" value={term.projectType} onChange={e => updateSub('terms', termsList.map(t => t.id === term.id ? { ...t, projectType: e.target.value as ProjectType } : t))}>{PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select>
                    <select className="text-[9px] font-bold border rounded p-1.5 bg-white" value={term.structureType} onChange={e => updateSub('terms', termsList.map(t => t.id === term.id ? { ...t, structureType: e.target.value as StructureType } : t))}>{STRUCTURE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select>
                    <select className="text-[9px] font-bold border rounded p-1.5 bg-white" value={term.panelType} onChange={e => updateSub('terms', termsList.map(t => t.id === term.id ? { ...t, panelType: e.target.value as PanelType } : t))}>{PANEL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select>
                  </div>
                </div>
              ))}
              {filteredTerms.length === 0 && <p className="text-center py-12 text-gray-400 text-xs font-bold uppercase tracking-widest border-2 border-dashed rounded-xl bg-gray-50/50">No terms matched your current category selection.</p>}
            </div>
          </div>
        )}

        {activeSubTab === 'bank' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold">Company Remittance Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="md:col-span-2"><label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Beneficiary Account Name</label><input value={state.bank?.companyName || ''} onChange={e => updateSub('bank', { ...state.bank, companyName: e.target.value })} className="w-full border p-3 rounded-lg font-bold bg-white" /></div>
              <div><label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Bank Name</label><input value={state.bank?.bankName || ''} onChange={e => updateSub('bank', { ...state.bank, bankName: e.target.value })} className="w-full border p-3 rounded-lg bg-white" /></div>
              <div><label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Account Number</label><input value={state.bank?.accountNumber || ''} onChange={e => updateSub('bank', { ...state.bank, accountNumber: e.target.value })} className="w-full border p-3 rounded-lg font-black bg-white tracking-widest" /></div>
              <div><label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Bank Branch</label><input value={state.bank?.branch || ''} onChange={e => updateSub('bank', { ...state.bank, branch: e.target.value })} className="w-full border p-3 rounded-lg bg-white" /></div>
              <div><label className="block text-[10px] uppercase font-black text-gray-400 mb-1">IFSC Code</label><input value={state.bank?.ifsc || ''} onChange={e => updateSub('bank', { ...state.bank, ifsc: e.target.value })} className="w-full border p-3 rounded-lg font-bold text-red-600 bg-white" /></div>
              <div><label className="block text-[10px] uppercase font-black text-gray-400 mb-1">PAN Number</label><input value={state.bank?.pan || ''} onChange={e => updateSub('bank', { ...state.bank, pan: e.target.value })} className="w-full border p-3 rounded-lg bg-white font-mono" /></div>
              <div><label className="block text-[10px] uppercase font-black text-gray-400 mb-1">UPI ID for Direct Payment</label><input value={state.bank?.upiId || ''} onChange={e => updateSub('bank', { ...state.bank, upiId: e.target.value })} className="w-full border p-3 rounded-lg bg-white font-bold" /></div>
              <div className="md:col-span-2"><label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Bank Address</label><textarea value={state.bank?.address || ''} onChange={e => updateSub('bank', { ...state.bank, address: e.target.value })} className="w-full border p-3 rounded-lg bg-white" rows={2}/></div>
            </div>
          </div>
        )}

        {activeSubTab === 'warranty' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h3 className="text-lg font-bold">Product & Service Warranty Declarations</h3>
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <button 
                  onClick={downloadSampleWarrantyExcel} 
                  className="flex-1 md:flex-none border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded text-xs font-black uppercase flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <DownloadCloud className="w-4 h-4" /> Sample Excel
                </button>
                <label className="flex-1 md:flex-none bg-blue-600 text-white px-4 py-2 rounded text-xs font-black uppercase flex items-center justify-center gap-2 cursor-pointer hover:bg-blue-700 transition-colors shadow-md shadow-blue-100">
                  <Upload className="w-4 h-4" /> Bulk Import
                  <input ref={warrantyFileInputRef} type="file" accept=".xlsx, .xls" className="hidden" onChange={handleBulkImportWarranties} />
                </label>
                <button 
                  onClick={handleAddWarranty} 
                  className="flex-1 md:flex-none bg-black text-white px-4 py-2 rounded text-xs font-black uppercase flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
                >
                  <ShieldCheck className="w-4 h-4" /> Add Declaration
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              {filteredWarranties.map(w => {
                const isHybrid = w.projectType === 'Hybrid Subsidy' || w.projectType === 'Hybrid Non Subsidy';
                return (
                <div key={w.id} className="border rounded-lg bg-gray-50 overflow-hidden shadow-sm">
                  <div className="p-4 bg-white flex justify-between items-center border-b">
                    <div className="flex gap-2">
                        <span className="text-[9px] font-black uppercase bg-gray-100 text-gray-500 px-2 py-0.5 rounded border">{w.projectType}</span>
                        <span className="text-[9px] font-black uppercase bg-gray-100 text-gray-500 px-2 py-0.5 rounded border">{w.structureType}</span>
                        <span className="text-[9px] font-black uppercase bg-red-50 text-red-500 px-2 py-0.5 rounded border border-red-100">{w.panelType}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleCopyWarranty(w)} className="text-xs font-black uppercase px-3 py-1.5 rounded border border-blue-100 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors shadow-sm flex items-center gap-1.5" title="Copy Declaration"><Copy className="w-3.5 h-3.5" /> Copy</button>
                      <button onClick={() => setEditingItemId(editingItemId === w.id ? null : w.id)} className={`text-xs font-black uppercase px-4 py-1.5 rounded border transition-colors shadow-sm ${editingItemId === w.id ? 'bg-black text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>{editingItemId === w.id ? 'Close' : 'Edit Declaration'}</button>
                      <button onClick={() => updateSub('warrantyPackages', warrantiesList.filter(item => item.id !== w.id))} className="text-red-400 hover:text-red-600 p-1"><Trash2 className="w-4 h-4" /> </button>
                    </div>
                  </div>
                  {editingItemId === w.id && (
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      <div className="md:col-span-2 border-b pb-4 mb-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div><label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Project Type</label><select className="w-full border p-2 rounded text-xs font-bold bg-white" value={w.projectType} onChange={e => updateWarrantyPackage(w.id, { projectType: e.target.value as ProjectType })}>{PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                        <div><label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Structure Type</label><select className="w-full border p-2 rounded text-xs font-bold bg-white" value={w.structureType} onChange={e => updateWarrantyPackage(w.id, { structureType: e.target.value as StructureType })}>{STRUCTURE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                        <div><label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Panel Type</label><select className="w-full border p-2 rounded text-xs font-bold bg-white" value={w.panelType} onChange={e => updateWarrantyPackage(w.id, { panelType: e.target.value as PanelType })}>{PANEL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                      </div>
                      <div><label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Solar Panel Warranty</label><input value={w.panelWarranty} onChange={e => updateWarrantyPackage(w.id, { panelWarranty: e.target.value })} className="w-full border p-3 rounded-lg bg-white font-medium" /></div>
                      <div><label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Inverter Warranty</label><input value={w.inverterWarranty} onChange={e => updateWarrantyPackage(w.id, { inverterWarranty: e.target.value })} className="w-full border p-3 rounded-lg bg-white font-medium" /></div>
                      {isHybrid && (
                        <div><label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Battery Warranty</label><input value={w.batteryWarranty || ''} onChange={e => updateWarrantyPackage(w.id, { batteryWarranty: e.target.value })} className="w-full border p-3 rounded-lg bg-white font-medium" /></div>
                      )}
                      <div><label className="block text-[10px] uppercase font-black text-gray-400 mb-1">System Warranty Statement</label><input value={w.systemWarranty} onChange={e => updateWarrantyPackage(w.id, { systemWarranty: e.target.value })} className="w-full border p-3 rounded-lg bg-white font-medium" /></div>
                      <div><label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Monitoring System Status</label><input value={w.monitoringSystem} onChange={e => updateWarrantyPackage(w.id, { monitoringSystem: e.target.value })} className="w-full border p-3 rounded-lg bg-white font-medium" /></div>
                    </div>
                  )}
                </div>
              )})}
              {filteredWarranties.length === 0 && <p className="text-center py-10 text-gray-400 text-xs font-bold uppercase tracking-widest border-2 border-dashed rounded-lg bg-gray-50/50">No warranty declarations match your current filters.</p>}
            </div>
          </div>
        )}

        {activeSubTab === 'bom' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h3 className="text-lg font-bold">Bill of Materials Templates</h3>
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <button 
                  onClick={downloadSampleBOMExcel} 
                  className="flex-1 md:flex-none border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded text-xs font-black uppercase flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <DownloadCloud className="w-4 h-4" /> Sample Excel
                </button>
                <label className="flex-1 md:flex-none bg-blue-600 text-white px-4 py-2 rounded text-xs font-black uppercase flex items-center justify-center gap-2 cursor-pointer hover:bg-blue-700 transition-colors shadow-md shadow-blue-100">
                  <Upload className="w-4 h-4" /> Bulk Import
                  <input ref={bomFileInputRef} type="file" accept=".xlsx, .xls" className="hidden" onChange={handleBulkImportBOM} />
                </label>
                <button 
                  onClick={handleCreateTemplate} 
                  className="flex-1 md:flex-none bg-black text-white px-4 py-2 rounded text-xs font-black uppercase flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" /> New BOM Template
                </button>
              </div>
            </div>
            <div className="space-y-4">
              {filteredBOMTemplates.map(template => (
                <div key={template.id} className="border rounded-lg bg-gray-50 overflow-hidden shadow-sm border-gray-100">
                  <div className="p-4 flex items-center gap-4 bg-white border-b">
                    <button onClick={() => setExpandedTemplateId(expandedTemplateId === template.id ? null : template.id)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">{expandedTemplateId === template.id ? <ChevronUp className="w-5 h-5 text-gray-400"/> : <ChevronDown className="w-5 h-5 text-gray-400"/>}</button>
                    <input className="font-bold text-[11px] uppercase tracking-wider flex-1 border-b border-transparent focus:border-red-600 outline-none text-gray-900" value={template.name || ''} onChange={e => handleUpdateTemplate(template.id, { name: e.target.value })} />
                    <div className="flex items-center gap-2">
                      <button onClick={() => { 
                        const newId = Date.now().toString(); 
                        // Deep clone items array and items themselves to avoid shared references
                        const newItems = (template.items || []).map(item => ({ ...item, id: Math.random().toString(36).substr(2, 9) }));
                        updateSub('bomTemplates', [...templatesList, { ...template, id: newId, name: `${template.name} (Copy)`, items: newItems }]); 
                      }} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg" title="Duplicate Template"><Copy className="w-4 h-4"/></button>
                      <button onClick={() => updateSub('bomTemplates', templatesList.filter(t => t.id !== template.id))} className="text-red-400 hover:text-red-600 p-1.5 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </div>
                  {expandedTemplateId === template.id && (
                    <div className="p-4 border-t overflow-x-auto bg-gray-50/50">
                      <table className="w-full text-xs text-gray-700">
                        <thead><tr className="text-left font-black text-[9px] uppercase tracking-widest text-gray-400 border-b"><th className="pb-3 px-1">Product Component</th><th className="pb-3 px-1">UOM</th><th className="pb-3 px-1">Qty</th><th className="pb-3 px-1">Specification</th><th className="pb-3 px-1">Make / Brand</th><th className="pb-3 px-1 w-8"></th></tr></thead>
                        <tbody className="divide-y divide-gray-100">
                          {(template.items || []).map((item, idx) => (
                            <tr key={item.id} className="hover:bg-white transition-colors">
                              <td className="py-1.5 px-1"><input className="border rounded px-2 py-1.5 w-full bg-white text-gray-800 font-medium" value={item.product || ''} onChange={e => { const items = [...template.items]; items[idx] = { ...items[idx], product: e.target.value }; handleUpdateTemplate(template.id, { items }); }} /></td>
                              <td className="py-1.5 px-1"><input className="border rounded px-2 py-1.5 w-20 bg-white" value={item.uom || ''} onChange={e => { const items = [...template.items]; items[idx] = { ...items[idx], uom: e.target.value }; handleUpdateTemplate(template.id, { items }); }} /></td>
                              <td className="py-1.5 px-1"><input className="border rounded px-2 py-1.5 w-16 bg-white font-bold" value={item.quantity || ''} onChange={e => { const items = [...template.items]; items[idx] = { ...items[idx], quantity: e.target.value }; handleUpdateTemplate(template.id, { items }); }} /></td>
                              <td className="py-1.5 px-1"><input className="border rounded px-2 py-1.5 w-full bg-white" value={item.specification || ''} onChange={e => { const items = [...template.items]; items[idx] = { ...items[idx], specification: e.target.value }; handleUpdateTemplate(template.id, { items }); }} /></td>
                              <td className="py-1.5 px-1"><input className="border rounded px-2 py-1.5 w-full bg-white font-bold uppercase text-[10px]" value={item.make || ''} onChange={e => { const items = [...template.items]; items[idx] = { ...items[idx], make: e.target.value }; handleUpdateTemplate(template.id, { items }); }} /></td>
                              <td className="py-1.5 px-1 text-right"><button onClick={() => { const items = template.items.filter((_, i) => i !== idx); handleUpdateTemplate(template.id, { items }); }} className="text-red-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5"/></button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <button onClick={() => handleUpdateTemplate(template.id, { items: [...(template.items || []), { id: Date.now().toString(), product: '', uom: '', quantity: '', specification: '', make: '' }] })} className="text-[10px] font-black uppercase text-red-600 mt-4 flex items-center gap-1 hover:bg-red-50 px-3 py-1.5 rounded-full transition-colors border border-red-100 shadow-sm"><Plus className="w-3 h-3"/> Add Item Row</button>
                    </div>
                  )}
                </div>
              ))}
              {filteredBOMTemplates.length === 0 && <p className="text-center py-10 text-gray-400 text-xs font-bold uppercase tracking-widest border-2 border-dashed rounded-lg">No templates found matching your search.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
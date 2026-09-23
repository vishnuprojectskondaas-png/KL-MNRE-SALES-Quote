import { AppState, Term, BOMItem, ProductPricing, Quotation, User, WarrantyPackage, Attachment } from '../types';
import { supabase, supabaseDirect } from './supabaseClient';

const SETTINGS_KEY = 'global';
const ATTACHMENTS_KEY = 'attachments';
const LOCAL_CACHE_KEY = 'kondaas_quote_pro_state_cache';

// In-memory cache for loaded attachment file base64 data
const attachmentFileCache = new Map<string, string>();

/**
 * Executes a Supabase operation with automatic failover between
 * the same-origin proxy client and the direct remote client.
 */
async function executeWithFallback(
  queryFn: (client: typeof supabase) => PromiseLike<{ data: any; error: any }>
): Promise<{ data: any; error: any }> {
  try {
    const res = await queryFn(supabase);
    if (!res.error) return res;
    return await queryFn(supabaseDirect);
  } catch {
    return await queryFn(supabaseDirect);
  }
}

export const fetchAttachmentFileData = async (id: string): Promise<string | null> => {
  if (attachmentFileCache.has(id)) {
    return attachmentFileCache.get(id) || null;
  }

  try {
    const { data } = await executeWithFallback(client =>
      client.from('settings').select('company').eq('singleton_key', ATTACHMENTS_KEY).single()
    );

    const atts: Attachment[] = data?.company?.attachments || [];
    atts.forEach(a => {
      if (a.id && a.fileData) {
        attachmentFileCache.set(a.id, a.fileData);
      }
    });

    return attachmentFileCache.get(id) || null;
  } catch (err) {
    console.warn("Could not fetch attachment binary:", err);
    return null;
  }
};

const DEFAULT_TERMS: Term[] = [
  { id: '1', text: 'Structure height will be 1 to 3 feet from floor level.', enabled: true, order: 1, projectType: 'Ongrid Subsidy', structureType: '2 Meter Flat Roof Structure', panelType: 'TOPCON G12R' },
  { id: '2', text: 'KSEB application & registration charges are included in the above cost.', enabled: true, order: 2, projectType: 'Ongrid Subsidy', structureType: '2 Meter Flat Roof Structure', panelType: 'TOPCON G12R' },
  { id: '3', text: 'The customer shall provide necessary space and shadow-free area for installation.', enabled: true, order: 3, projectType: 'Ongrid Subsidy', structureType: '2 Meter Flat Roof Structure', panelType: 'TOPCON G12R' },
  { id: '4', text: 'Civil works like concrete foundation if needed will be extra.', enabled: true, order: 4, projectType: 'Ongrid Subsidy', structureType: '2 Meter Flat Roof Structure', panelType: 'TOPCON G12R' },
  { id: '5', text: 'The subsidy will be credited to the customer account as per govt norms.', enabled: true, order: 5, projectType: 'Ongrid Subsidy', structureType: '2 Meter Flat Roof Structure', panelType: 'TOPCON G12R' },
  { id: '6', text: 'Any additional cabling beyond 30 meters will be charged extra.', enabled: true, order: 6, projectType: 'Ongrid Subsidy', structureType: '2 Meter Flat Roof Structure', panelType: 'TOPCON G12R' },
];

const DEFAULT_BOM_3KW: BOMItem[] = [
  { id: '1', product: 'Solar Panels', uom: 'Nos', quantity: '8', specification: '550Wp Mono PERC', make: 'Adani/Waaree' },
  { id: '2', product: 'On-Grid Inverter', uom: 'No', quantity: '1', specification: '3kW String Inverter', make: 'Growatt/Solis' },
  { id: '10', product: 'Lightning Arrester', uom: 'Set', quantity: '1', specification: 'Solid Copper 1M', make: 'Standard' },
];

const DEFAULT_PRICING: ProductPricing[] = [
  {
    id: 'p3kw',
    name: '3kW Standard Pricing',
    projectType: 'Ongrid Subsidy',
    structureType: '2 Meter Flat Roof Structure',
    panelType: 'TOPCON G12R',
    actualPlantCost: 185000,
    discount: 0,
    subsidyAmount: 78000,
    ksebCharges: 0,
    additionalMaterialCost: 0,
    customizedStructureCost: 0,
    netMeterCost: 0
  }
];

const DEFAULT_WARRANTIES: WarrantyPackage[] = [
  {
    id: 'w-default',
    projectType: 'Ongrid Subsidy',
    structureType: '2 Meter Flat Roof Structure',
    panelType: 'TOPCON G12R',
    panelWarranty: '25 Years Performance Warranty (Adani Solar)',
    inverterWarranty: '5 to 10 Years Product Warranty (On-Grid String)',
    batteryWarranty: '',
    systemWarranty: '5 Years Free Service (Kondaas Automation)',
    monitoringSystem: 'Standard Online Monitoring (Wi-Fi Required)'
  }
];

const DEFAULT_USERS: User[] = [
  { id: 'admin-01', name: 'Administrator', username: 'admin', password: 'admin123', role: 'admin' }
];

export const INITIAL_STATE: AppState = {
  company: {
    name: 'Kondaas Automation Pvt Ltd',
    headOffice: '123, Solar Plaza, Opp. KSEB, Kochi, Kerala',
    regionalOffice1: 'Branch Office, Trivandrum, Kerala',
    regionalOffice2: 'Service Center, Calicut, Kerala',
    phone: '+91 9876543210',
    email: 'info@kondaas.com',
    website: 'www.kondaas.com',
    logo: '', seal: '', gstin: '32AAAAA0000A1Z5'
  },
  bank: {
    companyName: 'Kondaas Automation Private Limited',
    bankName: 'HDFC BANK',
    accountNumber: '50200012345678',
    branch: 'Cochin Main',
    ifsc: 'HDFC0000123',
    address: 'M.G. Road, Cochin',
    pan: 'ABCDE1234F',
    upiId: 'kondaas@hdfc',
    gstNumber: '32AAAAA0000A1Z5'
  },
  productPricing: DEFAULT_PRICING,
  warrantyPackages: DEFAULT_WARRANTIES,
  terms: DEFAULT_TERMS,
  bomTemplates: [
    { 
      id: '3kw-std', 
      name: '3kW Standard On-Grid', 
      items: DEFAULT_BOM_3KW
    }
  ],
  productDescriptions: [
    { id: '1', name: '3kW ON-GRID SOLAR POWER GENERATING SYSTEM', projectType: 'Ongrid Subsidy', structureType: '2 Meter Flat Roof Structure', panelType: 'TOPCON G12R', defaultPricingId: 'p3kw', defaultBomTemplateId: '3kw-std', order: 1 }
  ],
  productColumnWidths: {
    name: 300,
    projectType: 150,
    structureType: 150,
    panelType: 150,
    pricing: 150,
    bom: 150
  },
  bomColumnWidths: {
    product: 200,
    uom: 80,
    quantity: 80,
    specification: 250,
    make: 150
  },
  users: DEFAULT_USERS,
  quotations: [],
  nextId: 1000
};

export const fetchFullState = async (): Promise<AppState> => {
  try {
    // 1 & 2. Fetch Settings and Quotations concurrently for faster initial load
    const [settingsRes, quotesRes] = await Promise.all([
      executeWithFallback(client =>
        client.from('settings').select('*').eq('singleton_key', SETTINGS_KEY).single()
      ),
      executeWithFallback(client =>
        client.from('quotations').select('*')
      )
    ]);

    const settingsRow = settingsRes.data;
    const settingsError = settingsRes.error;
    const quotesRows: any[] = quotesRes.data || [];
    const quotesError = quotesRes.error;

    if (settingsError && settingsError.code !== 'PGRST116') {
      console.warn("Could not fetch remote settings, will attempt cache:", settingsError.message || settingsError);
    }

    if (quotesError) {
      console.warn("Could not fetch remote quotations:", quotesError.message || quotesError);
    }

    // If both failed to get settings, try local storage cache
    if (!settingsRow && typeof localStorage !== 'undefined') {
      try {
        const cached = localStorage.getItem(LOCAL_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === 'object') {
            return parsed;
          }
        }
      } catch (cacheErr) {
        console.warn("Error reading local cache:", cacheErr);
      }
    }

    const parsedQuotes: Quotation[] = quotesRows.map(row => ({
      ...row.data,
      id: row.id // Ensure ID matches the row key
    }));

    let maxId = 1000;
    parsedQuotes.forEach(q => {
      const match = q.id.match(/(?:KAPL|KLMNRE)-(\d+)/); 
      if (match && match[1]) {
        const num = parseInt(match[1]);
        if (num > maxId) maxId = num;
      }
    });

    const fullState: AppState = {
      company: settingsRow?.company || INITIAL_STATE.company,
      bank: settingsRow?.bank || INITIAL_STATE.bank,
      productPricing: settingsRow?.pricing || INITIAL_STATE.productPricing,
      warrantyPackages: settingsRow?.warranty || INITIAL_STATE.warrantyPackages,
      terms: settingsRow?.terms || INITIAL_STATE.terms,
      bomTemplates: settingsRow?.bom_templates || INITIAL_STATE.bomTemplates,
      productDescriptions: settingsRow?.product_descriptions || INITIAL_STATE.productDescriptions,
      productColumnWidths: settingsRow?.product_column_widths || INITIAL_STATE.productColumnWidths,
      bomColumnWidths: settingsRow?.bom_column_widths || INITIAL_STATE.bomColumnWidths,
      users: settingsRow?.users || INITIAL_STATE.users,
      attachments: settingsRow?.company?.attachments || INITIAL_STATE.attachments || [],
      activeProjectTypes: settingsRow?.company?.activeProjectTypes,
      activeStructureTypes: settingsRow?.company?.activeStructureTypes,
      activePanelTypes: settingsRow?.company?.activePanelTypes,
      quotations: parsedQuotes,
      nextId: maxId + 1
    };

    // Cache the state locally
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(fullState));
      } catch {
        // LocalStorage quota might be exceeded, ignore
      }
    }

    return fullState;

  } catch (err) {
    console.warn("Error loading data from Supabase:", err);
    if (typeof localStorage !== 'undefined') {
      try {
        const cached = localStorage.getItem(LOCAL_CACHE_KEY);
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return INITIAL_STATE;
  }
};

export const saveSettingsToLocal = async (state: AppState): Promise<boolean> => {
  try {
    // 1. Separate heavy attachments so singleton_key = 'global' stays fast (~300 KB)
    const lightweightAttachments = (state.attachments || []).map(a => ({
      id: a.id,
      name: a.name
    }));

    // Cache in localStorage
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(state));
      } catch {}
    }

    const globalPayload = {
      singleton_key: SETTINGS_KEY,
      company: { 
        ...state.company, 
        attachments: lightweightAttachments,
        activeProjectTypes: state.activeProjectTypes,
        activeStructureTypes: state.activeStructureTypes,
        activePanelTypes: state.activePanelTypes
      },
      bank: state.bank,
      pricing: state.productPricing,
      warranty: state.warrantyPackages,
      terms: state.terms,
      bom_templates: state.bomTemplates,
      product_descriptions: state.productDescriptions,
      product_column_widths: state.productColumnWidths,
      bom_column_widths: state.bomColumnWidths,
      users: state.users
    };

    const { error } = await executeWithFallback(client =>
      client.from('settings').upsert(globalPayload)
    );

    if (error) {
      console.warn("Failed to save settings to Supabase:", error);
      return false;
    }

    // 2. If any attachments have new fileData, persist them to singleton_key = 'attachments'
    const attachmentsWithFiles = (state.attachments || []).filter(a => !!a.fileData);
    if (attachmentsWithFiles.length > 0) {
      // Update cache
      attachmentsWithFiles.forEach(a => {
        if (a.id && a.fileData) attachmentFileCache.set(a.id, a.fileData);
      });

      // Save asynchronously in background
      (async () => {
        try {
          const attPayload = {
            singleton_key: ATTACHMENTS_KEY,
            company: { attachments: state.attachments }
          };
          await executeWithFallback(client =>
            client.from('settings').upsert(attPayload)
          );
        } catch (attErr) {
          console.warn("Failed to persist attachment binaries:", attErr);
        }
      })();
    }

    return true;
  } catch (err) {
    console.warn("Error saving settings:", err);
    return false;
  }
};

export const saveQuotationToLocal = async (quotation: Quotation) => {
  try {
    const payload = {
      id: quotation.id,
      customer_name: quotation.customerName,
      customer_details: {
        mobile: quotation.mobile,
        address: quotation.address,
        email: quotation.email
      },
      data: quotation
    };

    const { error } = await executeWithFallback(client =>
      client.from('quotations').upsert(payload)
    );
    if (error) console.warn("Error saving quotation to Supabase:", error);
  } catch (err) {
    console.warn("Error saving quotation to Supabase:", err);
  }
};

export const deleteQuotationFromLocal = async (id: string) => {
  try {
    const { error } = await executeWithFallback(client =>
      client.from('quotations').delete().eq('id', id)
    );
    if (error) console.warn("Error deleting quotation from Supabase:", error);
  } catch (err) {
    console.warn("Error deleting quotation from Supabase:", err);
  }
};
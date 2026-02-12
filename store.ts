
import { AppState, Term, BOMItem, ProductPricing, Quotation, User, ProductDescription, WarrantyPackage } from './types';
import { supabase } from './supabaseClient';

const SETTINGS_KEY = 'global';

const DEFAULT_TERMS: Term[] = [
  { id: '1', text: 'Structure height will be 1 to 3 feet from floor level.', enabled: true, order: 1, projectType: 'Ongrid Subsidy', structureType: '2 Meter Flat roof structure', panelType: 'TOPCON G2R' },
  { id: '2', text: 'KSEB application & registration charges are included in the above cost.', enabled: true, order: 2, projectType: 'Ongrid Subsidy', structureType: '2 Meter Flat roof structure', panelType: 'TOPCON G2R' },
  { id: '3', text: 'The customer shall provide necessary space and shadow-free area for installation.', enabled: true, order: 3, projectType: 'Ongrid Subsidy', structureType: '2 Meter Flat roof structure', panelType: 'TOPCON G2R' },
  { id: '4', text: 'Civil works like concrete foundation if needed will be extra.', enabled: true, order: 4, projectType: 'Ongrid Subsidy', structureType: '2 Meter Flat roof structure', panelType: 'TOPCON G2R' },
  { id: '5', text: 'The subsidy will be credited to the customer account as per govt norms.', enabled: true, order: 5, projectType: 'Ongrid Subsidy', structureType: '2 Meter Flat roof structure', panelType: 'TOPCON G2R' },
  { id: '6', text: 'Any additional cabling beyond 30 meters will be charged extra.', enabled: true, order: 6, projectType: 'Ongrid Subsidy', structureType: '2 Meter Flat roof structure', panelType: 'TOPCON G2R' },
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
    structureType: '2 Meter Flat roof structure',
    panelType: 'TOPCON G2R',
    actualPlantCost: 185000,
    discount: 0,
    subsidyAmount: 78000,
    ksebCharges: 0,
    additionalMaterialCost: 0,
    customizedStructureCost: 0
  }
];

const DEFAULT_WARRANTIES: WarrantyPackage[] = [
  {
    id: 'w-default',
    projectType: 'Ongrid Subsidy',
    structureType: '2 Meter Flat roof structure',
    panelType: 'TOPCON G2R',
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
    { id: '3kw-std', name: '3kW Standard On-Grid', items: DEFAULT_BOM_3KW }
  ],
  productDescriptions: [
    { id: '1', name: '3kW ON-GRID SOLAR POWER GENERATING SYSTEM', projectType: 'Ongrid Subsidy', structureType: '2 Meter Flat roof structure', panelType: 'TOPCON G2R', defaultPricingId: 'p3kw', defaultBomTemplateId: '3kw-std' }
  ],
  users: DEFAULT_USERS,
  quotations: [],
  nextId: 1000
};

export const fetchFullState = async (): Promise<AppState> => {
  try {
    // 1. Fetch Settings
    const { data: settingsRow, error: settingsError } = await supabase
      .from('settings')
      .select('*')
      .eq('singleton_key', SETTINGS_KEY)
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error("Error fetching settings:", settingsError);
    }

    // 2. Fetch Quotations
    const { data: quotesRows, error: quotesError } = await supabase
      .from('quotations')
      .select('*');

    if (quotesError) {
      console.error("Error fetching quotations:", quotesError);
    }

    const parsedQuotes: Quotation[] = (quotesRows || []).map(row => ({
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

    return {
      company: settingsRow?.company || INITIAL_STATE.company,
      bank: settingsRow?.bank || INITIAL_STATE.bank,
      productPricing: settingsRow?.pricing || INITIAL_STATE.productPricing,
      warrantyPackages: settingsRow?.warranty || INITIAL_STATE.warrantyPackages,
      terms: settingsRow?.terms || INITIAL_STATE.terms,
      bomTemplates: settingsRow?.bom_templates || INITIAL_STATE.bomTemplates,
      productDescriptions: settingsRow?.product_descriptions || INITIAL_STATE.productDescriptions,
      users: settingsRow?.users || INITIAL_STATE.users,
      quotations: parsedQuotes,
      nextId: maxId + 1
    };

  } catch (err) {
    console.error("Unexpected error fetching data from Supabase:", err);
    return INITIAL_STATE;
  }
};

export const saveSettingsToLocal = async (state: AppState): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('settings')
      .upsert({
        singleton_key: SETTINGS_KEY,
        company: state.company,
        bank: state.bank,
        pricing: state.productPricing,
        warranty: state.warrantyPackages,
        terms: state.terms,
        bom_templates: state.bomTemplates,
        product_descriptions: state.productDescriptions,
        users: state.users
      });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error saving settings to Supabase:", err);
    return false;
  }
};

export const saveQuotationToLocal = async (quotation: Quotation, allQuotes: Quotation[]) => {
  try {
    const { error } = await supabase
      .from('quotations')
      .upsert({
        id: quotation.id,
        customer_name: quotation.customerName,
        customer_details: {
          mobile: quotation.mobile,
          address: quotation.address,
          email: quotation.email
        },
        data: quotation
      });

    if (error) throw error;
  } catch (err) {
    console.error("Error saving quotation to Supabase:", err);
  }
};

export const deleteQuotationFromLocal = async (id: string, allQuotes: Quotation[]) => {
  try {
    const { error } = await supabase
      .from('quotations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (err) {
    console.error("Error deleting quotation from Supabase:", err);
  }
};

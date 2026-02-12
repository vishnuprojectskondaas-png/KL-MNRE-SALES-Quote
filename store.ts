
import { AppState, Term, BOMItem, ProductPricing, Quotation, User, ProductDescription, WarrantyPackage } from './types';

const SETTINGS_KEY = 'solar_quote_pro_settings';
const QUOTATIONS_KEY = 'solar_quote_pro_quotations';

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
  { id: '3', product: 'DC SPD', uom: 'Nos', quantity: '2', specification: 'Type II 600V', make: 'Citel/Suntree' },
  { id: '4', product: 'DC Fuse', uom: 'Nos', quantity: '2', specification: '15A/1000V', make: 'Mersen' },
  { id: '5', product: 'DC Cable', uom: 'Mtrs', quantity: '30', specification: '4sqmm multi strand', make: 'Polycab/Siechem' },
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
  },
  {
    id: 'p5kw',
    name: '5kW Standard Pricing',
    projectType: 'Ongrid Subsidy',
    structureType: '2 Meter Flat roof structure',
    panelType: 'TOPCON G2R',
    actualPlantCost: 295000,
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
  {
    id: 'admin-01',
    name: 'Administrator',
    username: 'admin',
    password: 'admin123',
    role: 'admin'
  }
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
    logo: '', 
    seal: '',
    gstin: '32AAAAA0000A1Z5'
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
    { id: '1', name: '3kW ON-GRID SOLAR POWER GENERATING SYSTEM', projectType: 'Ongrid Subsidy', structureType: '2 Meter Flat roof structure', panelType: 'TOPCON G2R', defaultPricingId: 'p3kw', defaultBomTemplateId: '3kw-std' },
    { id: '2', name: '5kW ON-GRID SOLAR POWER GENERATING SYSTEM', projectType: 'Ongrid Subsidy', structureType: '2 Meter Flat roof structure', panelType: 'TOPCON G2R', defaultPricingId: 'p5kw', defaultBomTemplateId: '' }
  ],
  users: DEFAULT_USERS,
  quotations: [],
  nextId: 1000
};

export const fetchFullState = async (): Promise<AppState> => {
  try {
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    const savedQuotations = localStorage.getItem(QUOTATIONS_KEY);

    const settings = savedSettings ? JSON.parse(savedSettings) : {};
    const parsedQuotes: Quotation[] = savedQuotations ? JSON.parse(savedQuotations) : [];
    
    let maxId = 1000;
    parsedQuotes.forEach(q => {
      const match = q.id.match(/(?:KAPL|KLMNRE)-(\d+)/); 
      if (match && match[1]) {
        const num = parseInt(match[1]);
        if (num > maxId) maxId = num;
      }
    });

    return {
      company: settings.company || INITIAL_STATE.company,
      bank: settings.bank || INITIAL_STATE.bank,
      productPricing: settings.productPricing || INITIAL_STATE.productPricing,
      warrantyPackages: settings.warrantyPackages || INITIAL_STATE.warrantyPackages || DEFAULT_WARRANTIES,
      terms: settings.terms || INITIAL_STATE.terms,
      bomTemplates: settings.bomTemplates || INITIAL_STATE.bomTemplates,
      productDescriptions: settings.productDescriptions || INITIAL_STATE.productDescriptions,
      users: settings.users || INITIAL_STATE.users,
      quotations: parsedQuotes,
      nextId: maxId + 1
    };

  } catch (err) {
    console.error("Unexpected error fetching local state:", err);
    return INITIAL_STATE;
  }
};

export const saveSettingsToLocal = async (state: AppState): Promise<boolean> => {
  try {
    const payload = {
      company: state.company,
      bank: state.bank,
      productPricing: state.productPricing,
      warrantyPackages: state.warrantyPackages,
      terms: state.terms,
      bomTemplates: state.bomTemplates,
      productDescriptions: state.productDescriptions,
      users: state.users
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(payload));
    return true;
  } catch (err) {
    console.error("Error saving settings to local storage:", err);
    return false;
  }
};

export const saveQuotationToLocal = async (quotation: Quotation, allQuotes: Quotation[]) => {
  try {
    const existingIdx = allQuotes.findIndex(q => q.id === quotation.id);
    let updatedQuotes;
    if (existingIdx >= 0) {
      updatedQuotes = allQuotes.map(q => q.id === quotation.id ? quotation : q);
    } else {
      updatedQuotes = [...allQuotes, quotation];
    }
    localStorage.setItem(QUOTATIONS_KEY, JSON.stringify(updatedQuotes));
  } catch (err) {
    console.error("Error saving quotation to local storage:", err);
  }
};

export const deleteQuotationFromLocal = async (id: string, allQuotes: Quotation[]) => {
  try {
    const updatedQuotes = allQuotes.filter(q => q.id !== id);
    localStorage.setItem(QUOTATIONS_KEY, JSON.stringify(updatedQuotes));
  } catch (err) {
    console.error("Error deleting quotation from local storage:", err);
  }
};

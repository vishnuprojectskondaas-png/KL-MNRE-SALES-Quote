export type ProjectType = 
  | 'Ongrid Subsidy' 
  | 'Hybrid Subsidy' 
  | 'Micro Inverter Subsidy' 
  | 'Hybrid Without Battery Subsidy'
  | 'Ongrid Non Subsidy' 
  | 'Hybrid Non Subsidy' 
  | 'Micro Inverter Non Subsidy'
  | 'Hybrid Without Battery Non Subsidy';

export type StructureType = '1 Meter Flat Roof Structure' | '2 Meter Flat Roof Structure' | 'Without Structure';

export type PanelType = 'TOPCON G12R' | 'TOPCON HJT' | 'MONO PERC Bifacial';

export type QuoteStatus = 'Site Survey Pending' | 'Site Survey Completed';

export const PROJECT_TYPES: ProjectType[] = [
  'Ongrid Subsidy', 
  'Hybrid Subsidy', 
  'Micro Inverter Subsidy',
  'Hybrid Without Battery Subsidy',
  'Ongrid Non Subsidy', 
  'Hybrid Non Subsidy', 
  'Micro Inverter Non Subsidy',
  'Hybrid Without Battery Non Subsidy'
];

export const STRUCTURE_TYPES: StructureType[] = [
  '1 Meter Flat Roof Structure', '2 Meter Flat Roof Structure', 'Without Structure'
];

export const PANEL_TYPES: PanelType[] = [
  'TOPCON G12R', 'TOPCON HJT', 'MONO PERC Bifacial'
];

export const QUOTE_STATUSES: QuoteStatus[] = [
  'Site Survey Pending', 'Site Survey Completed'
];

export interface CompanyConfig {
  name: string;
  headOffice: string;
  regionalOffice1: string;
  regionalOffice2: string;
  phone: string;
  email: string;
  website: string;
  logo: string;
  seal: string;
  gstin: string;
}

export interface BankConfig {
  companyName: string;
  bankName: string;
  accountNumber: string;
  branch: string;
  ifsc: string;
  address: string;
  pan: string;
  upiId: string;
  gstNumber: string;
}

export interface PricingConfig {
  actualPlantCost: number;
  discount: number;
  subsidyAmount: number;
  ksebCharges: number;
  additionalMaterialCost: number;
  customizedStructureCost: number;
  netMeterCost: number;
}

export interface ProductPricing extends PricingConfig {
  id: string;
  name: string;
  projectType: ProjectType;
  structureType: StructureType;
  panelType: PanelType;
}

export interface WarrantyPackage {
  id: string;
  projectType: ProjectType;
  structureType: StructureType;
  panelType: PanelType;
  panelWarranty: string;
  inverterWarranty: string;
  batteryWarranty?: string;
  systemWarranty: string;
  monitoringSystem: string;
}

export interface Term {
  id: string;
  text: string;
  enabled: boolean;
  order: number;
  projectType: ProjectType;
  structureType: StructureType;
  panelType: PanelType;
}

export interface BOMItem {
  id: string;
  product: string;
  uom: string;
  quantity: string;
  specification: string;
  make: string;
}

export interface BOMTemplate {
  id: string;
  name: string;
  items: BOMItem[];
}

export interface ProductDescription {
  id: string;
  name: string;
  projectType: ProjectType;
  structureType: StructureType;
  panelType: PanelType;
  defaultPricingId?: string;
  defaultBomTemplateId?: string;
}

export type UserRole = 'admin' | 'user' | 'TL';

export interface User {
  id: string;
  name: string;
  username: string;
  password: string; 
  role: UserRole;
  salesPersonName?: string;
  salesPersonMobile?: string;
}

export interface Quotation {
  id: string;
  date: string;
  customerName: string;
  discomNumber: string;
  address: string;
  mobile: string;
  email: string;
  location: string;
  projectType: ProjectType | '';
  structureType: StructureType | '';
  panelType: PanelType | '';
  status: QuoteStatus;
  pricing: PricingConfig;
  bom: BOMItem[];
  systemDescription: string;
  createdBy: string;
  createdByName: string;
  salesPersonMobile?: string;
}

export interface AppState {
  company: CompanyConfig;
  bank: BankConfig;
  productPricing: ProductPricing[]; 
  warrantyPackages: WarrantyPackage[];
  terms: Term[];
  bomTemplates: BOMTemplate[];
  productDescriptions: ProductDescription[];
  users: User[];
  quotations: Quotation[];
  nextId: number;
}
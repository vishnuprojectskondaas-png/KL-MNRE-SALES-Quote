import React, { useState, useEffect } from 'react';
import { AppState, Quotation, BOMItem, BOMTemplate, ProductPricing, User, PROJECT_TYPES, STRUCTURE_TYPES, PANEL_TYPES, QUOTE_STATUSES, ProjectType, StructureType, PanelType, QuoteStatus } from '../types';
import { Save, X, Plus, Package, Filter, ChevronRight } from 'lucide-react';

interface Props {
  state: AppState;
  currentUser: User;
  editData: Quotation | null;
  onSave: (q: Quotation) => void;
  onSaveTemplate: (name: string, items: BOMItem[]) => void;
  onCancel: () => void;
}

const QuotationForm: React.FC<Props> = ({ state, currentUser, editData, onSave, onSaveTemplate, onCancel }) => {
  const generateNewId = () => {
    const now = new Date();
    const dd = now.getDate().toString().padStart(2, '0');
    const yy = now.getFullYear().toString().slice(-2);
    return `KLMNRE-${state.nextId}/${dd}-${yy}`;
  };

  const [formData, setFormData] = useState<Quotation>({
    id: editData?.id || generateNewId(),
    date: editData?.date || new Date().toISOString().split('T')[0],
    customerName: editData?.customerName || '',
    discomNumber: editData?.discomNumber || '',
    address: editData?.address || '',
    mobile: editData?.mobile || '',
    email: editData?.email || '',
    location: editData?.location || '',
    projectType: editData?.projectType || '',
    structureType: editData?.structureType || '',
    panelType: editData?.panelType || '',
    status: editData?.status || 'Site Survey Completed',
    pricing: editData?.pricing || { 
      actualPlantCost: 0,
      discount: 0,
      subsidyAmount: 0,
      ksebCharges: 0,
      additionalMaterialCost: 0,
      customizedStructureCost: 0,
      netMeterCost: 0
    },
    bom: editData?.bom || [],
    systemDescription: editData?.systemDescription || '',
    createdBy: editData?.createdBy || currentUser.id,
    createdByName: editData?.createdByName || currentUser.name,
    salesPersonMobile: editData?.salesPersonMobile || currentUser.salesPersonMobile || ''
  });

  const canEditBasePricing = currentUser.role === 'admin' || currentUser.role === 'TL';
  const canChangeStatus = currentUser.role === 'admin' || currentUser.role === 'TL';

  // Filter products based on selected categories
  const filteredProducts = state.productDescriptions.filter(p => 
    p.projectType === formData.projectType && 
    p.structureType === formData.structureType &&
    p.panelType === formData.panelType
  );

  const handleCategoryChange = (updates: Partial<Quotation>) => {
    setFormData(prev => ({
      ...prev,
      ...updates,
      systemDescription: '', // Reset description when category changes to avoid mismatch
    }));
  };

  const handleProductDescriptionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedName = e.target.value;
    const productConfig = state.productDescriptions.find(p => p.name === selectedName);
    
    let newPricing = formData.pricing;
    let newBom = formData.bom;

    if (productConfig?.defaultPricingId) {
      const linkedPricing = state.productPricing.find(p => p.id === productConfig.defaultPricingId);
      if (linkedPricing) {
        const { id, name, projectType, structureType, panelType, ...pricingValues } = linkedPricing;
        newPricing = {
           actualPlantCost: pricingValues.actualPlantCost || 0,
           discount: pricingValues.discount || 0,
           subsidyAmount: pricingValues.subsidyAmount || 0,
           ksebCharges: pricingValues.ksebCharges || 0,
           additionalMaterialCost: pricingValues.additionalMaterialCost || 0,
           customizedStructureCost: pricingValues.customizedStructureCost || 0,
           netMeterCost: pricingValues.netMeterCost || 0
        };
      }
    }

    if (productConfig?.defaultBomTemplateId) {
      const linkedBom = state.bomTemplates.find(t => t.id === productConfig.defaultBomTemplateId);
      if (linkedBom) {
        newBom = (linkedBom.items || []).map(item => ({ ...item, id: Math.random().toString(36).substr(2, 9) }));
      }
    }

    setFormData({
      ...formData,
      systemDescription: selectedName,
      pricing: newPricing,
      bom: newBom
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectType || !formData.structureType || !formData.panelType) {
        alert("Please select Project, Structure and Panel types");
        return;
    }
    if (!formData.systemDescription) {
        alert("Please select a Product Description");
        return;
    }
    onSave(formData);
  };

  const isNonSubsidy = formData.projectType ? formData.projectType.toLowerCase().includes('non subsidy') : false;
  
  const pActual = formData.pricing.actualPlantCost || 0;
  const pDiscount = formData.pricing.discount || 0;
  const pSubsidy = formData.pricing.subsidyAmount || 0;
  const pKseb = formData.pricing.ksebCharges || 0;
  const pCustStruct = formData.pricing.customizedStructureCost || 0;
  const pAddMat = formData.pricing.additionalMaterialCost || 0;
  const pNetMeter = formData.pricing.netMeterCost || 0;

  const afterDiscount = pActual - pDiscount;
  const subsidyVal = isNonSubsidy ? 0 : pSubsidy;
  const afterSubsidy = afterDiscount - subsidyVal;
  const totalNetCost = afterSubsidy + pKseb + pCustStruct + pAddMat + pNetMeter;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-900">{editData ? 'Edit' : 'Create New'} Quotation</h2>
        <div className="flex flex-col items-end">
          <div className="text-lg font-mono text-primary-red bg-red-50 px-4 py-1 rounded-full border border-red-100 font-bold">
            {formData.status === 'Site Survey Pending' ? 'DRAFT' : formData.id}
          </div>
          <span className="text-[10px] font-black uppercase text-gray-400 mt-1">Ref No. | Creator: {formData.createdByName}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* Category Filter Section */}
        <section className="bg-red-50/50 p-6 rounded-xl border border-red-100">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-primary-red" />
            <h3 className="text-[11px] font-black uppercase tracking-wider text-red-700">System Configuration Filters</h3>
          </div>
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${canChangeStatus ? '5' : '4'} gap-6 items-end`}>
            <div>
              <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Project Type Selection</label>
              <select 
                value={formData.projectType} 
                onChange={e => handleCategoryChange({ projectType: e.target.value as ProjectType })}
                className="w-full border-2 border-white shadow-sm p-2 rounded-lg bg-white font-bold text-gray-800 focus:border-red-500 outline-none"
              >
                <option value="">-- Select Project Type --</option>
                {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Structure Type Selection</label>
              <select 
                value={formData.structureType} 
                onChange={e => handleCategoryChange({ structureType: e.target.value as StructureType })}
                className="w-full border-2 border-white shadow-sm p-2 rounded-lg bg-white font-bold text-gray-800 focus:border-red-500 outline-none"
              >
                <option value="">-- Select Structure --</option>
                {STRUCTURE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Panel Type Selection</label>
              <select 
                value={formData.panelType} 
                onChange={e => handleCategoryChange({ panelType: e.target.value as PanelType })}
                className="w-full border-2 border-white shadow-sm p-2 rounded-lg bg-white font-bold text-gray-800 focus:border-red-500 outline-none"
              >
                <option value="">-- Select Panel Type --</option>
                {PANEL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            
            {/* Status Selector - Only shown for Admin and TL */}
            {canChangeStatus && (
              <div>
                <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Current Status</label>
                <select 
                  value={formData.status} 
                  onChange={e => handleCategoryChange({ status: e.target.value as QuoteStatus })}
                  className="w-full border-2 border-white shadow-sm p-2 rounded-lg bg-white font-black text-red-600 focus:border-red-500 outline-none"
                >
                  {QUOTE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}

            <div className="md:col-span-2 lg:col-span-1">
              <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Product Description (Filtered)</label>
              <select 
                required
                value={formData.systemDescription} 
                onChange={handleProductDescriptionChange} 
                className={`w-full border-2 shadow-sm p-2 rounded-lg font-bold outline-none transition-colors ${filteredProducts.length === 0 ? 'bg-gray-100 border-gray-200 cursor-not-allowed' : 'bg-white border-white focus:border-red-500'}`}
                disabled={filteredProducts.length === 0}
              >
                <option value="">{filteredProducts.length === 0 ? 'No items found for selection' : '-- Select Product Model --'}</option>
                {filteredProducts.map((desc, idx) => (
                  <option key={desc.id || idx} value={desc.name}>{desc.name}</option>
                ))}
              </select>
            </div>
          </div>
          {filteredProducts.length > 0 && !formData.systemDescription && (
             <p className="text-[9px] text-primary-red font-bold mt-2 flex items-center gap-1">
               <ChevronRight className="w-3 h-3" /> Please select a product model to auto-load pricing and BOM.
             </p>
          )}
        </section>

        <section>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Customer Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1 font-bold">Customer Name</label>
              <input required value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} className="w-full border p-2 rounded focus:ring-2 focus:ring-red-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1 font-bold">Consumer DISCOM No.</label>
              <input value={formData.discomNumber} onChange={e => setFormData({ ...formData, discomNumber: e.target.value })} className="w-full border p-2 rounded focus:ring-2 focus:ring-red-500 outline-none" />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm text-gray-600 mb-1 font-bold">Address</label>
              <textarea required rows={2} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full border p-2 rounded focus:ring-2 focus:ring-red-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1 font-bold">Mobile Number</label>
              <input required value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} className="w-full border p-2 rounded focus:ring-2 focus:ring-red-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1 font-bold">Email</label>
              <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full border p-2 rounded focus:ring-2 focus:ring-red-500 outline-none" />
            </div>
          </div>
        </section>

        <section className="bg-gray-50 p-6 rounded-lg border">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-6">
             Pricing Estimation Breakup
             {!canEditBasePricing && <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded normal-case">Locked by Admin</span>}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs uppercase font-black text-gray-400 mb-1">ACTUAL PLANT COST (₹)</label>
              <input type="number" readOnly={!canEditBasePricing} value={pActual} onChange={e => setFormData({ ...formData, pricing: { ...formData.pricing, actualPlantCost: Number(e.target.value) } })} className={`w-full border p-2 rounded shadow-inner font-bold ${!canEditBasePricing ? 'bg-gray-200 text-gray-600' : 'bg-white'}`} />
            </div>
            <div>
              <label className="block text-xs uppercase font-black text-gray-400 mb-1">DISCOUNT (₹)</label>
              <input type="number" readOnly={!canEditBasePricing} value={pDiscount} onChange={e => setFormData({ ...formData, pricing: { ...formData.pricing, discount: Number(e.target.value) } })} className={`w-full border p-2 rounded shadow-inner font-bold text-green-600 ${!canEditBasePricing ? 'bg-gray-200' : 'bg-white'}`} />
            </div>
            <div>
              <label className="block text-xs uppercase font-black text-gray-400 mb-1">Amount To Be Paid by The Customer to Kondaas After Limited Period Discount</label>
              <input type="text" readOnly value={`₹ ${afterDiscount.toLocaleString('en-IN')}`} className="w-full border p-2 rounded bg-gray-100 font-black" />
            </div>
            
            {!isNonSubsidy && (
              <div>
                <label className="block text-xs uppercase font-black text-gray-400 mb-1">Subsidy Amount (₹)</label>
                <input type="number" readOnly={!canEditBasePricing} value={pSubsidy} onChange={e => setFormData({ ...formData, pricing: { ...formData.pricing, subsidyAmount: Number(e.target.value) } })} className={`w-full border p-2 rounded shadow-inner font-bold text-red-600 ${!canEditBasePricing ? 'bg-gray-200' : 'bg-white'}`} />
              </div>
            )}

            <div>
              <label className="block text-xs uppercase font-black text-gray-400 mb-1">on-grid ROOFTOP SOLAR POWER PLANT COST AFTER SUBSIDY</label>
              <input type="text" readOnly value={`₹ ${afterSubsidy.toLocaleString('en-IN')}`} className="w-full border p-2 rounded bg-gray-100 font-black" />
            </div>
            <div>
              <label className="block text-xs uppercase font-black text-gray-400 mb-1">KSEB Charges (₹)</label>
              <input type="number" value={pKseb} onChange={e => setFormData({ ...formData, pricing: { ...formData.pricing, ksebCharges: Number(e.target.value) } })} className="w-full border p-2 rounded shadow-inner bg-white font-bold" />
            </div>
            {formData.structureType === 'Without Structure' && (
              <div>
                <label className="block text-xs uppercase font-black text-red-600 mb-1">Customized Structure Cost (₹)</label>
                <input 
                  type="number" 
                  value={pCustStruct} 
                  onChange={e => setFormData({ ...formData, pricing: { ...formData.pricing, customizedStructureCost: Number(e.target.value) } })} 
                  className="w-full border-2 border-red-100 p-2 rounded shadow-inner bg-white font-bold focus:border-red-500 outline-none" 
                  placeholder="Enter structure cost"
                />
              </div>
            )}
            {formData.structureType === '1 Meter Flat Roof Structure' && (
              <div>
                <label className="block text-xs uppercase font-black text-gray-400 mb-1">4 Feet Flat Roof Structure Cost</label>
                <div className="w-full border p-2.5 rounded bg-gray-100 font-black text-green-600">Included</div>
              </div>
            )}
            <div>
              <label className="block text-xs uppercase font-black text-red-600 mb-1">Additional Material Cost (₹)</label>
              <input 
                type="number" 
                value={pAddMat} 
                onChange={e => setFormData({ ...formData, pricing: { ...formData.pricing, additionalMaterialCost: Number(e.target.value) } })} 
                className="w-full border-2 border-red-100 p-2 rounded shadow-inner bg-white font-bold focus:border-red-500 outline-none" 
                placeholder="Enter additional cost"
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-black text-red-600 mb-1">Net Meter Cost (₹)</label>
              <input 
                type="number" 
                value={pNetMeter} 
                onChange={e => setFormData({ ...formData, pricing: { ...formData.pricing, netMeterCost: Number(e.target.value) } })} 
                className="w-full border-2 border-red-100 p-2 rounded shadow-inner bg-white font-bold focus:border-red-500 outline-none" 
                placeholder="Enter net meter cost"
              />
            </div>
            <div className="bg-black text-white p-6 rounded flex items-center justify-between col-span-1 md:col-span-2 lg:col-span-3">
              <div>
                <p className="text-[10px] uppercase font-black text-primary-red mb-1 tracking-widest">{isNonSubsidy ? 'TOTAL INVESTMENT PAYABLE' : 'NET INVESTMENT PAYABLE'}</p>
                <p className="text-xs text-gray-400 font-bold uppercase">Total Net Cost Including KSEB Charges</p>
              </div>
              <span className="text-3xl font-black">₹ {totalNetCost.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </section>

        <section>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Bill of Materials</h3>
          </div>
          <div className="overflow-x-auto border rounded-lg bg-gray-50/50">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">UOM</th>
                  <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Qty</th>
                  <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Spec/Type</th>
                  <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Make</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {formData.bom && formData.bom.length > 0 ? formData.bom.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="p-2"><input className="w-full text-xs border-0 bg-transparent focus:ring-0 cursor-default text-gray-700 font-bold" value={item.product} readOnly tabIndex={-1} /></td>
                    <td className="p-2"><input className="w-full text-xs border-0 bg-transparent focus:ring-0 cursor-default text-gray-700" value={item.uom} readOnly tabIndex={-1} /></td>
                    <td className="p-2"><input className="w-full text-xs border-0 bg-transparent focus:ring-0 cursor-default text-gray-700" value={item.quantity} readOnly tabIndex={-1} /></td>
                    <td className="p-2"><input className="w-full text-xs border-0 bg-transparent focus:ring-0 cursor-default text-gray-700" value={item.specification} readOnly tabIndex={-1} /></td>
                    <td className="p-2"><input className="w-full text-xs border-0 bg-transparent focus:ring-0 cursor-default text-gray-700 font-bold uppercase" value={item.make} readOnly tabIndex={-1} /></td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-400 text-xs uppercase font-bold tracking-widest">Select a product model to view BOM</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="flex gap-4 pt-6 border-t">
          <button type="submit" className="flex-1 bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-colors shadow-lg">
            <Save className="w-5 h-5 mr-2 inline" /> {editData ? 'Update' : 'Save'} Quotation
          </button>
          <button type="button" onClick={onCancel} className="px-6 py-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default QuotationForm;
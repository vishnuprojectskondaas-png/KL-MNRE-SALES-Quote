
import React from 'react';
import { AppState, Quotation, User } from '../types';
import { Edit3, Trash2, Search, Printer, FileSpreadsheet, Download, FileDown, Layers } from 'lucide-react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

interface Props {
  state: AppState;
  currentUser: User;
  onEdit: (q: Quotation) => void;
  onPrint: (q: Quotation) => void;
  onDownload: (q: Quotation) => void;
  onDelete: (id: string) => void;
}

const AdminPanel: React.FC<Props> = ({ state, currentUser, onEdit, onPrint, onDownload, onDelete }) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const isAdmin = currentUser.role === 'admin';
  const canModifyQuotes = currentUser.role === 'admin' || currentUser.role === 'TL';

  const filteredQuotes = state.quotations.filter(q => {
    const permissionMatch = isAdmin ? true : q.createdBy === currentUser.id;
    const searchMatch = 
      q.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.projectType && q.projectType.toLowerCase().includes(searchTerm.toLowerCase()));
    return permissionMatch && searchMatch;
  }).sort((a,b) => b.id.localeCompare(a.id));

  const exportToExcel = (q: Quotation) => {
    const afterDiscount = q.pricing.actualPlantCost - q.pricing.discount;
    const afterSubsidy = afterDiscount - q.pricing.subsidyAmount;
    const finalTotal = afterSubsidy + q.pricing.ksebCharges + q.pricing.customizedStructureCost + q.pricing.additionalMaterialCost;

    const pricingData = [
      ['Quotation No', q.id],
      ['Customer', q.customerName],
      ['Date', q.date],
      ['Project Type', q.projectType],
      ['Structure Type', q.structureType],
      [],
      ['Description', 'Rate (₹)'],
      ['Actual Plant Cost', q.pricing.actualPlantCost],
      ['Discount Applied', q.pricing.discount],
      ['Cost After Discount', afterDiscount],
      ['Subsidy Amount', q.pricing.subsidyAmount],
      ['Plant Cost After Subsidy', afterSubsidy],
      ['KSEB Charges', q.pricing.ksebCharges],
      ['Final Net Investment', finalTotal],
    ];
    
    const bomData = q.bom.map((item, idx) => [
      idx + 1, item.product, item.uom, item.quantity, item.specification, item.make
    ]);

    const wb = XLSX.utils.book_new();
    const ws_pricing = XLSX.utils.aoa_to_sheet(pricingData);
    const ws_bom = XLSX.utils.aoa_to_sheet([['SL No', 'Product', 'UOM', 'Qty', 'Spec', 'Make'], ...bomData]);
    
    XLSX.utils.book_append_sheet(wb, ws_pricing, "Pricing");
    XLSX.utils.book_append_sheet(wb, ws_bom, "Bill of Materials");
    XLSX.writeFile(wb, `${q.id}_Solar_Quotation.xlsx`);
  };

  const exportDashboardReport = () => {
    const reportData = state.quotations.map(q => {
        const afterDiscount = q.pricing.actualPlantCost - q.pricing.discount;
        const afterSubsidy = afterDiscount - q.pricing.subsidyAmount;
        const finalTotal = afterSubsidy + q.pricing.ksebCharges + q.pricing.customizedStructureCost + q.pricing.additionalMaterialCost;
        
        return {
            'Quote ID': q.id,
            'Date': q.date,
            'Customer': q.customerName,
            'Project Type': q.projectType,
            'Structure Type': q.structureType,
            'Actual Cost (₹)': q.pricing.actualPlantCost,
            'Discount (₹)': q.pricing.discount,
            'Subsidy (₹)': q.pricing.subsidyAmount,
            'Net Investment (₹)': finalTotal,
            'Sales Person': q.createdByName
        };
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(reportData);
    XLSX.utils.book_append_sheet(wb, ws, "Master Report");
    XLSX.writeFile(wb, `Solar_Quotes_Master_Report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quotation Dashboard</h2>
          <p className="text-gray-500">Welcome, {currentUser.name}</p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
          {isAdmin && (
            <button onClick={exportDashboardReport} className="w-full md:w-auto bg-green-700 text-white px-4 py-2 rounded-lg font-bold flex items-center justify-center hover:bg-green-800 shadow-sm text-sm">
              <FileDown className="w-4 h-4 mr-2" /> Export Master Report
            </button>
          )}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input type="text" placeholder="Search by ID, Name or Type..." className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 shadow-inner" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 text-gray-500 text-[10px] font-black uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 text-left">Quote ID</th>
                <th className="px-6 py-4 text-left">Date & Customer</th>
                <th className="px-6 py-4 text-left">Project Configuration</th>
                <th className="px-6 py-4 text-left">Net Amount</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredQuotes.map(q => {
                  const afterDiscount = q.pricing.actualPlantCost - q.pricing.discount;
                  const afterSubsidy = afterDiscount - q.pricing.subsidyAmount;
                  const finalTotal = afterSubsidy + q.pricing.ksebCharges + q.pricing.customizedStructureCost + q.pricing.additionalMaterialCost;
                  
                  return (
                <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-red-600">{q.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900 uppercase">{q.customerName}</div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase">{format(new Date(q.date), 'dd MMM yyyy')} | {q.mobile}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3 h-3 text-red-500" />
                        <span className="text-[10px] font-black uppercase tracking-tighter text-gray-700">{q.projectType}</span>
                      </div>
                      <span className="text-[9px] font-bold uppercase text-gray-400 ml-4.5">{q.structureType}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-gray-900">₹ {finalTotal.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1">
                    <button onClick={() => onDownload(q)} className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors" title="Download PDF"><Download className="w-5 h-5" /></button>
                    <button onClick={() => onPrint(q)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors" title="Print"><Printer className="w-5 h-5" /></button>
                    <button onClick={() => exportToExcel(q)} className="text-green-600 hover:bg-green-50 p-2 rounded-lg transition-colors" title="Excel Export"><FileSpreadsheet className="w-5 h-5" /></button>
                    {canModifyQuotes && (<button onClick={() => onEdit(q)} className="text-gray-600 hover:bg-gray-50 p-2 rounded-lg transition-colors"><Edit3 className="w-5 h-5" /></button>)}
                    {canModifyQuotes && (<button onClick={() => onDelete(q.id)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 className="w-5 h-5" /></button>)}
                  </td>
                </tr>
              )})}
              {filteredQuotes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-bold uppercase tracking-widest">No quotations found matching criteria</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;

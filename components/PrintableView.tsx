
import React from 'react';
import { AppState, Quotation, WarrantyPackage } from '../types';
import { format } from 'date-fns';

interface Props {
  quotation: Quotation;
  state: AppState;
}

const PrintableView: React.FC<Props> = ({ quotation, state }) => {
  // Filter terms by configuration and status
  const activeTerms = state.terms.filter(t => 
    t.enabled && 
    t.projectType === quotation.projectType && 
    t.structureType === quotation.structureType && 
    t.panelType === quotation.panelType
  ).sort((a, b) => a.order - b.order);

  // Find the warranty package that best matches the quotation configuration
  const matchedWarranty = state.warrantyPackages.find(w => 
    w.projectType === quotation.projectType && 
    w.structureType === quotation.structureType && 
    w.panelType === quotation.panelType
  ) || state.warrantyPackages[0]; // Fallback to first one if no exact match

  const SectionHeader = ({ title }: { title: string }) => (
    <div className="section-header w-full">
      <h3>{title}</h3>
      <div className="line"></div>
    </div>
  );

  const PageFooter = ({ pageNum, noMarginTop = false }: { pageNum: number, noMarginTop?: boolean }) => (
    <div className={`${noMarginTop ? '' : 'mt-auto'} pt-2 flex justify-between items-center text-[7pt] text-gray-400 font-bold uppercase tracking-[0.4em] w-full border-t border-gray-100`}>
      <span>{state.company.name} // Ref: {quotation.id}</span>
      <span className="text-gray-300">Page {pageNum} of 4</span>
    </div>
  );

  const PageLogo = () => (
    state.company.logo ? (
      <img src={state.company.logo} alt="Logo" className="absolute top-4 left-5 h-12 w-auto object-contain z-20" />
    ) : null
  );

  const CompanySealBlock = ({ imageBottomClass = "bottom-6" }: { imageBottomClass?: string }) => (
    <div className="text-center w-52">
      <div className="h-16 border-b border-gray-100 mb-1 relative">
         {state.company.seal ? (
           <img src={state.company.seal} alt="Seal" className={`absolute ${imageBottomClass} left-1/2 -translate-x-1/2 h-16 w-auto object-contain z-10`} />
         ) : (
           <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[5pt] text-red-100 uppercase font-black tracking-widest whitespace-nowrap">Official Seal</span>
         )}
      </div>
      <p className="text-[5.5pt] font-black uppercase text-red-600 tracking-[0.1em] pt-1 border-t border-red-600 truncate">For {state.company.name}</p>
      <p className="text-[5pt] text-gray-400 font-black uppercase mt-0.5 tracking-[0.2em]">Authorized Signatory</p>
    </div>
  );

  const afterDiscount = quotation.pricing.actualPlantCost - quotation.pricing.discount;
  const afterSubsidy = afterDiscount - quotation.pricing.subsidyAmount;
  const grandTotal = afterSubsidy + quotation.pricing.ksebCharges + quotation.pricing.customizedStructureCost + quotation.pricing.additionalMaterialCost;

  const isWithoutStructure = quotation.structureType === 'Without Structure';
  const hasCustomizedStructureCost = (quotation.pricing.customizedStructureCost || 0) > 0;

  const QualityAssuranceSection = () => {
    const isHybrid = quotation.projectType === 'Hybrid Subsidy' || quotation.projectType === 'Hybrid Non Subsidy';
    
    const qaItems = [
      { l: 'Modules', v: matchedWarranty?.panelWarranty || 'N/A' },
      { l: 'Inverter', v: matchedWarranty?.inverterWarranty || 'N/A' },
    ];

    if (isHybrid) {
      qaItems.push({ l: 'Battery', v: matchedWarranty?.batteryWarranty || 'N/A' });
    }

    qaItems.push(
      { l: 'Service', v: matchedWarranty?.systemWarranty || 'N/A' },
      { l: 'Monitor', v: matchedWarranty?.monitoringSystem || 'N/A' },
    );

    return (
      <div className="w-full">
        <SectionHeader title="Quality Assurance" />
        <div className={`grid ${isHybrid ? 'grid-cols-5' : 'grid-cols-4'} gap-3`}>
          {qaItems.map((w, i) => (
            <div key={i} className="bg-gray-50 border border-gray-100 p-3 rounded-xl flex flex-col items-center text-center shadow-sm hover:border-red-100 transition-colors">
              <p className="text-[6pt] font-black text-red-600 uppercase tracking-widest mb-1">{w.l}</p>
              <p className="text-[7pt] font-black text-gray-800 leading-tight">{w.v}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="pdf-container">
      {/* PAGE 1: EXECUTIVE SUMMARY & PRICING */}
      <div className="a4-page relative">
        <PageLogo />
        
        {/* Quotation No & Date at absolute position in the top margin area */}
        <div className="absolute top-4 right-16 text-right z-30">
          <span className="text-[4.5pt] font-black text-white bg-black px-1.5 py-0.5 rounded uppercase tracking-[0.1em] shadow-sm">Quotation No & Date</span>
          <p className="text-[9pt] font-black mt-0.5 text-red-600 tracking-tight leading-none">{quotation.id}</p>
          <p className="text-[5.5pt] text-gray-400 font-bold uppercase mt-0.5 tracking-wider">{format(new Date(quotation.date), 'dd MMMM yyyy')}</p>
        </div>

        <div className="flex justify-between items-start border-b-2 border-black pb-3 mb-3 w-full mt-4">
          <div className="flex flex-col gap-1 items-start flex-1 pt-2">
            <div className="flex-1">
              <h1 className="text-[14pt] font-[900] text-black leading-none uppercase tracking-tighter whitespace-nowrap">{state.company.name}</h1>
              <p className="text-[6pt] text-red-600 font-black tracking-[0.2em] uppercase mt-1 mb-3 whitespace-nowrap">ADANI SOLAR AUTHORIZED CHANNEL PARTNER</p>
              
              <div className="space-y-0.5">
                {/* Regional Branch 1 */}
                <p className="text-[7pt] text-gray-700 font-bold uppercase leading-tight">
                  <span className="text-black font-black text-[6pt] tracking-widest">REGIONAL BRANCHE 1: </span>
                  {state.company.regionalOffice1}
                </p>
                {/* Regional Branch 2 on a separate line below Branch 1 */}
                {state.company.regionalOffice2 && (
                  <p className="text-[7pt] text-gray-700 font-bold uppercase leading-tight">
                    <span className="text-black font-black text-[6pt] tracking-widest">REGIONAL BRANCHE 2: </span>
                    {state.company.regionalOffice2}
                  </p>
                )}
                <p className="text-[7pt] text-gray-700 font-bold uppercase leading-tight pt-1">
                  <span className="text-black font-black text-[6pt] tracking-widest">HEAD OFFICE: </span>
                  {state.company.headOffice}
                </p>
                {/* Contact line after Head Office */}
                <p className="text-[7pt] text-gray-700 font-bold uppercase leading-tight pt-0.5">
                  <span className="text-black font-black text-[6pt] tracking-widest whitespace-nowrap">company website: {state.company.website} | mail id: {state.company.email} | Sales Support Contact: {state.company.phone}</span>
                </p>
              </div>

              <div className="mt-4 border-t border-gray-100 pt-2">
                <p className="text-[8.5pt] font-black uppercase text-black whitespace-nowrap">
                  Sales Person: {quotation.createdByName} &nbsp;&nbsp;|&nbsp;&nbsp; Sales Person Mobile No : {quotation.salesPersonMobile || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4 w-full">
          <div className="flex items-baseline gap-3 mb-3">
             <h4 className="text-[7.5pt] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">CUSTOMER NAME :</h4>
             <p className="text-[14pt] font-[900] text-black uppercase leading-tight">{quotation.customerName}</p>
          </div>
          {/* Customer info block split into two rows: row 1 (Consumer No, Mobile) and row 2 (Address) */}
          <div className="bg-gray-50 border border-gray-100 p-3 rounded-xl flex flex-col text-[8pt] font-bold text-gray-600 gap-2 shadow-sm">
            <div className="flex flex-wrap items-center justify-start gap-x-8 gap-y-1">
              <div className="flex items-center gap-2">
                <span className="text-black font-black uppercase text-[6.5pt] tracking-widest opacity-40">Consumer No:</span>
                <span className="text-black uppercase">{quotation.discomNumber || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-black font-black uppercase text-[6.5pt] tracking-widest opacity-40">MOBILE:</span>
                <span className="text-black">{quotation.mobile}</span>
              </div>
            </div>
            <div className="flex items-start gap-2 border-t border-gray-200/50 pt-1.5">
              <span className="text-black font-black uppercase text-[6.5pt] tracking-widest opacity-40 pt-0.5">ADDRESS:</span>
              <span className="text-black uppercase leading-snug text-[8.5pt]">{quotation.address}</span>
            </div>
          </div>
        </div>

        <div className="bg-red-50 border-l-4 border-red-600 p-2.5 w-full rounded-r-md shadow-sm mb-3">
          <span className="text-[6.5pt] text-red-400 font-black uppercase tracking-widest block mb-1">PROPOSED SYSTEM</span>
          <p className="text-[10pt] font-black text-red-700 uppercase leading-snug">{quotation.systemDescription}</p>
          {isWithoutStructure && (
            <p className="text-[7.5pt] font-black text-gray-600 uppercase mt-1 tracking-tighter">
              {hasCustomizedStructureCost ? 'Customized Structure Cost Included without GST' : '* Structure cost is additionally chargeable'}
            </p>
          )}
        </div>

        <div className="mb-2 w-full border-b-2 border-red-600 pb-1">
          <h3 className="text-[9.5pt] font-black text-red-600 uppercase tracking-[0.25em]">PRICING AND ESTIMATION BREAKUP</h3>
        </div>

        <div className="mb-4 w-full">
          {/* Main Pricing Table Section */}
          <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm mb-4">
            <table className="table-modern">
              <thead>
                <tr>
                  <th className="w-20 text-center">#</th>
                  <th className="py-3">Description</th>
                  <th className="text-right w-44 pr-10 text-[10.5pt]">Rate (INR)</th>
                </tr>
              </thead>
              <tbody className="text-[8.5pt] font-bold">
                <tr>
                  <td className="text-center text-gray-300 font-black">01</td>
                  <td className="py-2 uppercase tracking-tight text-gray-800">ACTUAL PLANT COST of {quotation.systemDescription}</td>
                  <td className="text-right font-black pr-10 text-black text-[11pt]">₹ {quotation.pricing.actualPlantCost.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td className="text-center text-gray-300 font-black">02</td>
                  <td className="py-2 uppercase tracking-tight text-green-600">Limited Period Discount</td>
                  <td className="text-right font-black pr-10 text-green-600 text-[11pt]">(-) ₹ {quotation.pricing.discount.toLocaleString('en-IN')}</td>
                </tr>
                <tr className="bg-gray-50 border-t border-b">
                  <td className="text-center text-gray-400 font-black">-</td>
                  <td className="py-2 uppercase font-black text-gray-900 tracking-widest">Cost of {quotation.systemDescription} AFTER DISCOUNT</td>
                  <td className="text-right font-black pr-10 text-black text-[11pt]">₹ {afterDiscount.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td className="text-center text-red-200 font-black">03</td>
                  <td className="py-2 uppercase tracking-tight text-red-700 leading-snug">Subsidy Amount as Per PM Surya Ghar Approved Guidelines</td>
                  <td className="text-right font-black pr-10 text-red-600 text-[11pt]">(-) ₹ {quotation.pricing.subsidyAmount.toLocaleString('en-IN')}</td>
                </tr>
                <tr className="bg-red-50">
                  <td className="text-center text-red-600 font-black">-</td>
                  <td className="py-2 uppercase font-black text-red-600 tracking-widest">Customer Effective Cost After Subsidy</td>
                  <td className="text-right font-black pr-10 text-red-600 text-[14pt]">₹ {afterSubsidy.toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Additional Charges Table Section moved above summary bar */}
          <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50/30">
            <table className="table-modern">
              <thead>
                <tr className="bg-gray-100 text-gray-600">
                  <th className="w-20 text-center bg-gray-200 text-gray-700 !py-2 text-[6.5pt]">#</th>
                  <th className="!py-2 bg-gray-200 text-gray-700 font-black text-[6.5pt] tracking-widest uppercase">ADDITIONAL CHARGES / CUSTOMER SCOPE</th>
                  <th className="text-right w-44 pr-10 bg-gray-200 text-gray-700 font-black text-[10.5pt] tracking-widest uppercase">RATE (INR)</th>
                </tr>
              </thead>
              <tbody className="text-[8pt] font-bold">
                <tr>
                  <td className="text-center text-gray-300 !py-1">04</td>
                  <td className="!py-1 uppercase text-gray-600">KSEB Charges</td>
                  <td className="text-right font-black pr-10 text-gray-900 !py-1 text-[10pt]">₹ {quotation.pricing.ksebCharges.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td className="text-center text-gray-300 !py-1">05</td>
                  <td className="!py-1 uppercase text-gray-600">Customized Structure Cost(Without GST)</td>
                  <td className="text-right font-black pr-10 text-gray-900 !py-1 text-[10pt]">₹ {quotation.pricing.customizedStructureCost.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td className="text-center text-gray-300 !py-1">06</td>
                  <td className="!py-1 uppercase text-gray-600">Additional Material Cost (If Applicable)</td>
                  <td className="text-right font-black pr-10 text-gray-900 !py-1 text-[10pt]">₹ {quotation.pricing.additionalMaterialCost.toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>

            {/* Final Total Summary Bar at the bottom of the second container */}
            <div className="pricing-summary-row h-auto py-4">
              <div className="flex-1 pr-4 overflow-visible">
                <p className="text-[7pt] font-[900] uppercase tracking-tighter leading-tight whitespace-nowrap">CUSTOMER EFFECTIVE COST AFTER SUBSIDY - INCLUDING KSEB CHARGES AS PER THE CURRENT SLAB</p>
                <div className="text-[6pt] text-gray-300 font-bold uppercase tracking-[0.05em] mt-2 opacity-90 leading-relaxed">
                  INCLUSIVE OF GST, TRANSPORTATION & STANDARD INSTALLATION
                  {isWithoutStructure && (
                    <>
                      <br />
                      <span className="text-red-500 font-black">
                        {hasCustomizedStructureCost ? 'Customized Structure Cost Included without GST' : 'Customized Structure cost additionally chargeable as per site condition'}
                      </span>
                    </>
                  )}
                  <br />
                  CONSUMER NEED TO PAY TOTAL PLANT COST, MNRE SUBSIDY WILL DIRECTLY REACH THE CUSTOMER'S ACCOUNT WITHIN 1-3 MONTH
                </div>
              </div>
              <div className="text-right min-w-fit flex flex-col justify-center">
                <span className="text-[26pt] font-black text-white leading-none">₹ {grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto w-full flex justify-center items-end px-10 mb-2">
          <div className="pb-4">
            <p className="text-[7pt] font-black text-red-600 uppercase tracking-[0.2em] border border-red-100 px-3 py-1.5 rounded-lg bg-red-50/30">
              Check TERMS AND CONDITIONS PAGE 3
            </p>
          </div>
        </div>
        <PageFooter pageNum={1} noMarginTop />
      </div>

      {/* PAGE 2: BOM & Quality Assurance */}
      <div className="a4-page relative">
        <PageLogo />
        <div className="pt-6">
          <SectionHeader title="Technical Specifications (BOM)" />
          <div className="rounded-xl overflow-hidden border border-gray-100 w-full shadow-sm mb-6">
            <table className="w-full border-collapse table-fixed">
              <thead>
                <tr className="bg-black text-white">
                  <th className="w-[5%] text-left py-1.5 px-2 text-[9pt] font-bold uppercase tracking-wider">#</th>
                  <th className="w-[20%] text-left py-1.5 px-2 text-[9pt] font-bold uppercase tracking-wider">Products</th>
                  <th className="w-[10%] text-left py-1.5 px-2 text-[9pt] font-bold uppercase tracking-wider">Qty</th>
                  <th className="w-[10%] text-left py-1.5 px-2 text-[9pt] font-bold uppercase tracking-wider">UOM</th>
                  <th className="w-[27.5%] text-left py-1.5 px-2 text-[9pt] font-bold uppercase tracking-wider">Spec/Type</th>
                  <th className="w-[27.5%] text-left py-1.5 px-2 text-[9pt] font-bold uppercase tracking-wider">Make</th>
                </tr>
              </thead>
              <tbody className="text-[9pt]">
                {quotation.bom.map((item, idx) => (
                  <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="py-1.5 px-2 border-b">{idx + 1}</td>
                    <td className="py-1.5 px-2 border-b font-medium">{item.product}</td>
                    <td className="py-1.5 px-2 border-b">{item.quantity}</td>
                    <td className="py-1.5 px-2 border-b">{item.uom}</td>
                    <td className="py-1.5 px-2 border-b text-gray-600">{item.specification}</td>
                    <td className="py-1.5 px-2 border-b font-medium uppercase">{item.make}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <QualityAssuranceSection />
        </div>
        <PageFooter pageNum={2} />
      </div>

      {/* PAGE 3: Terms */}
      <div className="a4-page relative">
        <PageLogo />
        <div className="pt-6">
          <SectionHeader title="Terms and Conditions" />
          <div className="flex flex-col gap-2 px-4 w-full mt-4">
            {activeTerms.map((term, idx) => (
              <div key={term.id} className="flex gap-4 items-start">
                <span className="flex-shrink-0 text-[9pt] font-bold text-gray-900 mt-0.5">{idx + 1}.</span>
                <p className="text-[9pt] text-gray-700 font-normal leading-snug flex-1 text-justify">{term.text}</p>
              </div>
            ))}
          </div>
        </div>
        <PageFooter pageNum={3} />
      </div>

      {/* PAGE 4: Execution */}
      <div className="a4-page relative">
        <PageLogo />
        <div className="pt-6">
          <SectionHeader title="Execution & Compliance" />
          <div className="grid grid-cols-5 gap-6 mb-8 w-full">
            <div className="modern-card border-t-4 border-red-600 shadow-sm flex flex-col col-span-3">
              <h4 className="text-[7pt] font-black uppercase tracking-[0.25em] mb-4 text-red-600 text-center border-b border-red-50 pb-2">Company Bank Account Details</h4>
              <div className="space-y-2 text-[10pt] font-bold">
                <div className="flex justify-between border-b pb-1">
                  <span className="text-gray-400 uppercase text-[7.5pt] font-black tracking-widest">Account Holder</span>
                  <span className="text-black text-right truncate">{state.bank.companyName}</span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="text-gray-400 uppercase text-[7.5pt] font-black tracking-widest">Bank Partner</span>
                  <span className="text-black text-right">{state.bank.bankName}</span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="text-gray-400 uppercase text-[7.5pt] font-black tracking-widest">Account No.</span>
                  <span className="font-black tracking-widest">{state.bank.accountNumber}</span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="text-gray-400 uppercase text-[7.5pt] font-black tracking-widest">IFSC Code</span>
                  <span className="font-black text-red-600">{state.bank.ifsc}</span>
                </div>
                <div className="mt-3 text-center p-2 bg-white border border-red-50 rounded-xl shadow-inner">
                  <p className="text-[7.5pt] text-gray-400 uppercase font-black mb-1 tracking-widest">UPI ID</p>
                  <span className="text-[11pt] font-black text-black">{state.bank.upiId}</span>
                </div>
              </div>
            </div>
            <div className="modern-card bg-black text-white shadow-xl flex flex-col col-span-2">
              <h4 className="text-[8.5pt] font-black uppercase tracking-[0.25em] mb-7 text-red-500 text-center border-b border-gray-800 pb-3">Project Roadmap</h4>
              <div className="space-y-8">
                {[
                  { s: '01', t: 'Delivery', d: '7-10 Days After Advance & Approval' },
                  { s: '02', t: 'Payment', d: '10% Advance, 90% at delivery' },
                  { s: '03', t: 'Setup', d: '7-10 Days from final payment clearance' },
                ].map((t, idx) => (
                  <div key={idx} className="flex gap-5 items-start">
                    <span className="text-[22pt] font-black text-gray-800 leading-none">{t.s}</span>
                    <div className="flex-1">
                      <p className="text-[10.5pt] font-black uppercase tracking-tight mb-1.5 text-white">{t.t}</p>
                      <p className="text-[8pt] text-gray-500 font-bold leading-relaxed">{t.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-100 p-6 rounded-3xl mb-2 w-full shadow-inner">
            <h4 className="text-[10pt] font-black text-red-600 uppercase tracking-[0.3em] mb-6 text-center">Required Documents for Subsidy Claim</h4>
            <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-[9pt] font-bold text-gray-700 mb-6">
              <p className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-red-500"></span> Aadhar Card Copy</p>
              <p className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-red-500"></span> Electricity Bill Copy</p>
              <p className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-red-500"></span> Bank Passbook Front Page</p>
              <p className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-red-500"></span> Passport Size Photo</p>
            </div>
          </div>
          <div className="pt-1 flex justify-end px-10 w-full mt-0 mb-2">
            <CompanySealBlock imageBottomClass="bottom-4" />
          </div>
        </div>
        <PageFooter pageNum={4} noMarginTop />
      </div>
    </div>
  );
};

export default PrintableView;

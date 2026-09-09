import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer, FileText, Loader2, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../services/adminService';
import api from '../../../services/api';
import logo from '@assets/logo.webp';

const formatMoney = (val) =>
  `₹${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const AdminOrderInvoice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      setLoading(true);
      try {
        let data = null;
        const isAdminPath = window.location.pathname.startsWith('/admin');
        if (isAdminPath) {
          try {
            data = await adminService.getOrderInvoice(id);
          } catch (adminErr) {
            const res = await api.get(`orders/${id}/invoice`);
            data = res.data?.data?.invoice || res.data?.invoice || null;
          }
        } else {
          try {
            const res = await api.get(`orders/${id}/invoice`);
            data = res.data?.data?.invoice || res.data?.invoice || null;
          } catch (custErr) {
            data = await adminService.getOrderInvoice(id);
          }
        }
        setInvoice(data);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load tax invoice');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-gray-500">
        <Loader2 className="w-8 h-8 text-[#8D6E63] animate-spin" />
        <p className="text-xs font-bold uppercase tracking-widest text-[#3E2723]">Generating Swarna Sparsh Tax Invoice...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-3xl border border-red-100 text-center space-y-4 shadow-sm">
        <FileText className="w-12 h-12 text-red-400 mx-auto" />
        <h2 className="text-lg font-bold text-gray-900">Invoice Not Available</h2>
        <p className="text-xs text-gray-500">Unable to generate invoice data for this order.</p>
        <button
          onClick={() => navigate(`/admin/orders/${id}`)}
          className="px-5 py-2.5 rounded-xl bg-[#3E2723] text-white text-xs font-bold"
        >
          Back to Order
        </button>
      </div>
    );
  }

  const { store, customer, taxSummary, items } = invoice;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Print-specific style */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #tax-invoice, #tax-invoice * { visibility: visible !important; }
          #tax-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            box-shadow: none !important;
            border: 0 !important;
          }
          .invoice-no-print { display: none !important; }
          @page { size: A4; margin: 10mm; }
        }
      `}</style>

      {/* Action Bar (hidden in print) */}
      <div className="invoice-no-print flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <button
          onClick={() => navigate(`/admin/orders/${id}`)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Order
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> GST Compliant (Tax Invoice)
          </span>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#3E2723] hover:bg-[#2e1d1a] text-white text-xs font-bold shadow-sm transition-all"
          >
            <Printer className="w-4 h-4" /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* Invoice Document Canvas */}
      <div
        id="tax-invoice"
        className="bg-white rounded-3xl border border-[#EFEBE9] p-8 md:p-12 shadow-sm text-gray-900 font-sans text-xs space-y-8"
      >
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-gray-200">
          <div className="space-y-2">
            <img src={logo} alt="Swarna Sparsh" className="h-12 w-auto object-contain" />
            <h1 className="text-lg font-black text-[#3E2723] uppercase tracking-tight">{store?.name}</h1>
            <p className="text-[11px] text-[#8D6E63] font-serif italic">{store?.tagline}</p>
            <p className="text-[11px] text-gray-600 max-w-sm leading-relaxed">{store?.address}</p>
            <div className="text-[11px] text-gray-600 space-y-0.5 pt-1">
              <p>GSTIN: <strong className="font-mono text-gray-900">{store?.gstin}</strong> | State: {store?.state} (Code: {store?.stateCode})</p>
              <p>PAN: <strong className="font-mono text-gray-900">{store?.pan}</strong> | BIS Hallmark: <strong className="text-gray-900">{store?.bisHallmarkLicense}</strong></p>
              <p>Email: {store?.email} | Phone: {store?.phone}</p>
            </div>
          </div>

          <div className="sm:text-right space-y-1.5 bg-[#FDFBF7] p-4 rounded-2xl border border-[#EFEBE9] min-w-[220px]">
            <div className="inline-block px-2.5 py-1 bg-[#8D6E63] text-white font-black rounded-lg text-[10px] uppercase tracking-widest mb-1">
              TAX INVOICE
            </div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Invoice Number</p>
            <p className="text-sm font-black font-mono text-[#3E2723]">{invoice.invoiceNumber}</p>

            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold pt-1">Invoice Date</p>
            <p className="text-xs font-semibold text-gray-800">
              {new Date(invoice.invoiceDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>

            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold pt-1">Order Identifier</p>
            <p className="text-xs font-mono font-bold text-gray-800">#{invoice.orderId}</p>
          </div>
        </div>

        {/* Customer & Shipping Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-gray-200">
          <div className="space-y-1.5 bg-gray-50/70 p-4 rounded-2xl border border-gray-100">
            <h3 className="text-[10px] uppercase tracking-widest font-black text-gray-400">Billed & Shipped To</h3>
            <p className="text-sm font-bold text-gray-900">{customer?.name}</p>
            <p className="text-[11px] text-gray-600 leading-relaxed">{customer?.shippingAddress}</p>
            <p className="text-[11px] text-gray-600">
              State: <strong>{customer?.state}</strong> | Pincode: <strong>{customer?.pincode}</strong>
            </p>
            <p className="text-[11px] text-gray-600">Phone: {customer?.phone} | Email: {customer?.email}</p>
          </div>

          <div className="space-y-2 bg-gray-50/70 p-4 rounded-2xl border border-gray-100">
            <h3 className="text-[10px] uppercase tracking-widest font-black text-gray-400">Fulfillment Details</h3>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-gray-400 font-medium">Place of Supply:</span>
                <p className="font-bold text-gray-900">{customer?.state || store?.state}</p>
              </div>
              <div>
                <span className="text-gray-400 font-medium">Reverse Charge:</span>
                <p className="font-bold text-gray-900">No</p>
              </div>
              <div>
                <span className="text-gray-400 font-medium">Payment Mode:</span>
                <p className="font-bold text-gray-900 uppercase">{invoice.paymentMethod}</p>
              </div>
              <div>
                <span className="text-gray-400 font-medium">Payment Status:</span>
                <p className="font-bold text-emerald-700 uppercase">{invoice.paymentStatus}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-300 text-[10px] font-black uppercase tracking-wider text-gray-500 bg-gray-50">
                <th className="py-2.5 px-2">#</th>
                <th className="py-2.5 px-3">Item Description</th>
                <th className="py-2.5 px-2">HSN</th>
                <th className="py-2.5 px-2">Purity</th>
                <th className="py-2.5 px-2 text-center">Qty</th>
                <th className="py-2.5 px-3 text-right">Taxable Val</th>
                {taxSummary?.isIntraState ? (
                  <>
                    <th className="py-2.5 px-2 text-right">CGST ({taxSummary.cgstRate}%)</th>
                    <th className="py-2.5 px-2 text-right">SGST ({taxSummary.sgstRate}%)</th>
                  </>
                ) : (
                  <th className="py-2.5 px-2 text-right">IGST ({taxSummary?.igstRate}%)</th>
                )}
                <th className="py-2.5 px-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-[11px]">
              {items?.map((item) => (
                <tr key={item.srNo} className="hover:bg-gray-50/50">
                  <td className="py-3 px-2 text-gray-400 font-mono">{item.srNo}</td>
                  <td className="py-3 px-3">
                    <p className="font-bold text-gray-900">{item.name}</p>
                    <p className="text-[10px] font-mono text-gray-400">SKU: {item.sku}</p>
                  </td>
                  <td className="py-3 px-2 font-mono text-gray-600">{item.hsnCode}</td>
                  <td className="py-3 px-2 text-gray-600">{item.purity}</td>
                  <td className="py-3 px-2 text-center font-bold">{item.quantity}</td>
                  <td className="py-3 px-3 text-right font-mono">{formatMoney(item.taxableValue)}</td>
                  {taxSummary?.isIntraState ? (
                    <>
                      <td className="py-3 px-2 text-right font-mono text-gray-600">{formatMoney(item.cgstAmount)}</td>
                      <td className="py-3 px-2 text-right font-mono text-gray-600">{formatMoney(item.sgstAmount)}</td>
                    </>
                  ) : (
                    <td className="py-3 px-2 text-right font-mono text-gray-600">{formatMoney(item.igstAmount)}</td>
                  )}
                  <td className="py-3 px-3 text-right font-mono font-bold text-gray-900">{formatMoney(item.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculation & Summary Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
          <div className="space-y-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Amount in Words</p>
              <p className="text-xs font-bold text-gray-800 bg-[#FDFBF7] p-3 rounded-xl border border-[#EFEBE9]">
                {invoice.grandTotalInWords}
              </p>
            </div>

            <div className="text-[10px] text-gray-500 space-y-1 pt-2 leading-relaxed">
              <p className="font-bold text-gray-700 uppercase tracking-widest">Declaration & Terms:</p>
              <p>1. Certified that all precious jewelry items comply with BIS hallmarking standards.</p>
              <p>2. We declare that this invoice shows the actual price of the goods described and all particulars are true.</p>
              <p>3. Standard return and exchange policy applies as per Swarna Sparsh terms.</p>
            </div>
          </div>

          <div className="space-y-2 text-xs bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-gray-500">Taxable Value:</span>
              <span className="font-mono font-semibold">{formatMoney(invoice.subtotal)}</span>
            </div>

            {taxSummary?.isIntraState ? (
              <>
                <div className="flex justify-between py-1 text-gray-600">
                  <span>Central GST (CGST {taxSummary.cgstRate}%):</span>
                  <span className="font-mono">{formatMoney(taxSummary.cgstTotal)}</span>
                </div>
                <div className="flex justify-between py-1 text-gray-600 border-b border-gray-200">
                  <span>State GST (SGST {taxSummary.sgstRate}%):</span>
                  <span className="font-mono">{formatMoney(taxSummary.sgstTotal)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between py-1 text-gray-600 border-b border-gray-200">
                <span>Integrated GST (IGST {taxSummary?.igstRate}%):</span>
                <span className="font-mono">{formatMoney(taxSummary?.igstTotal)}</span>
              </div>
            )}

            {invoice.shippingFee > 0 && (
              <div className="flex justify-between py-1 text-gray-600">
                <span>Shipping Charges:</span>
                <span className="font-mono">{formatMoney(invoice.shippingFee)}</span>
              </div>
            )}

            {invoice.discount > 0 && (
              <div className="flex justify-between py-1 text-emerald-600">
                <span>Discount / Coupon Applied:</span>
                <span className="font-mono">- {formatMoney(invoice.discount)}</span>
              </div>
            )}

            <div className="flex justify-between py-2 border-t-2 border-gray-300 text-sm font-black text-[#3E2723]">
              <span>Grand Total:</span>
              <span className="font-mono text-base">{formatMoney(invoice.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Footer / Signatory */}
        <div className="pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-[10px] text-gray-400">
            This is a computer-generated tax invoice and requires no physical signature under Indian IT Act.
          </div>
          <div className="text-center sm:text-right space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">For Swarna Sparsh</p>
            <div className="h-10"></div>
            <p className="text-xs font-bold text-gray-800 border-t border-gray-300 pt-1">Authorized Signatory</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderInvoice;

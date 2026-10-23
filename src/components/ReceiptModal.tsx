import React, { useRef } from 'react';
import { Sale } from '../types';
import { useApp } from '../context/AppContext';
import {
  X,
  Share2,
  Printer,
  MessageCircle,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Receipt as ReceiptIcon,
} from 'lucide-react';
import { formatImei } from '../lib/luhn';

interface ReceiptModalProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, isOpen, onClose }) => {
  const { settings, businesses, currency } = useApp();
  const receiptCardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !sale) return null;

  const currentBiz = businesses.find((b) => b.id === sale.businessId);
  const shopName = currentBiz?.name || settings.shopName || 'Ranks Phones & Electronics';
  const shopPhone = currentBiz?.phone || settings.shopPhone || '+256 772 892 147';
  const shopAddress = currentBiz?.address || settings.shopAddress || 'Kampala Road, Kampala, Uganda';
  const trn = currentBiz?.trn || settings.shopTrn;

  // Format WhatsApp message
  const generateWhatsAppMessage = () => {
    let msg = `*🧾 TAX INVOICE / RECEIPT - ${shopName.toUpperCase()}*\n`;
    msg += `📍 ${shopAddress}\n`;
    msg += `📞 WhatsApp/Call: ${shopPhone}\n`;
    if (trn) msg += `🏛️ TIN: ${trn}\n`;
    msg += `--------------------------------\n`;
    msg += `📄 Invoice: *${sale.invoiceNumber}*\n`;
    msg += `📅 Date: ${sale.date}\n`;
    if (sale.customerName) msg += `👤 Customer: ${sale.customerName} (${sale.customerPhone || ''})\n`;
    msg += `--------------------------------\n`;
    msg += `*ITEMS:*\n`;

    sale.items.forEach((item, idx) => {
      msg += `${idx + 1}. *${item.productName}* x${item.quantity} = ${currency} ${item.total.toLocaleString()}\n`;
      if (item.imei) {
        msg += `   🔍 IMEI: ${item.imei}\n`;
      }
      if (item.imei2) {
        msg += `   🔍 IMEI 2: ${item.imei2}\n`;
      }
    });

    msg += `--------------------------------\n`;
    msg += `Subtotal: ${currency} ${sale.subtotal.toLocaleString()}\n`;
    if (sale.discount > 0) {
      msg += `Discount: -${currency} ${sale.discount.toLocaleString()}\n`;
    }
    msg += `*TOTAL AMOUNT: ${currency} ${sale.total.toLocaleString()}*\n`;
    msg += `Paid: ${currency} ${sale.amountPaid.toLocaleString()} (${sale.paymentMethod})\n`;
    if (sale.total > sale.amountPaid) {
      msg += `⚠️ Remaining Due: ${currency} ${(sale.total - sale.amountPaid).toLocaleString()}\n`;
    }

    if (sale.warrantyEndDate) {
      msg += `\n🛡️ *WARRANTY VALID UNTIL:* ${sale.warrantyEndDate}\n`;
    }
    msg += `\n${settings.defaultWarrantyTerms}\n`;
    msg += `_Thank you for choosing Ranks!_`;

    return encodeURIComponent(msg);
  };

  const handleWhatsAppShare = () => {
    const encoded = generateWhatsAppMessage();
    let phoneParam = '';
    if (sale.customerPhone) {
      phoneParam = sale.customerPhone.replace(/\D/g, '');
    }
    const url = phoneParam
      ? `https://wa.me/${phoneParam}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  const handleCopyText = () => {
    const text = decodeURIComponent(generateWhatsAppMessage());
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-[#0e121a] border border-white/15 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#131822]">
          <div className="flex items-center gap-2">
            <ReceiptIcon className="w-5 h-5 text-[#e6c673]" />
            <h3 className="text-sm font-bold text-white font-heading">
              Receipt: {sale.invoiceNumber}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Receipt Preview */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#090c12]">
          <div
            ref={receiptCardRef}
            className="bg-white text-slate-900 p-6 rounded-2xl shadow-xl font-mono text-xs border border-slate-300 relative print:p-0 print:border-none print:shadow-none"
          >
            {/* Header Stamp */}
            <div className="text-center border-b border-dashed border-slate-400 pb-3 mb-3">
              <h2 className="text-base font-black tracking-tight font-heading uppercase text-slate-950">
                {shopName}
              </h2>
              <p className="text-[11px] text-slate-600">{shopAddress}</p>
              <p className="text-[11px] text-slate-600 font-bold">Tel: {shopPhone}</p>
              {trn && (
                <p className="text-[10px] text-slate-700 font-bold mt-0.5">
                  TIN: {trn}
                </p>
              )}
              <div className="mt-2 text-[10px] font-bold uppercase tracking-wider bg-slate-100 py-0.5 rounded">
                SIMPLIFIED RETAIL INVOICE
              </div>
            </div>

            {/* Meta info */}
            <div className="grid grid-cols-2 gap-1 text-[11px] pb-2 border-b border-dashed border-slate-300 mb-2">
              <div>
                <span className="text-slate-500">Invoice: </span>
                <span className="font-bold text-slate-900">{sale.invoiceNumber}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500">Date: </span>
                <span className="font-bold text-slate-900">{sale.date}</span>
              </div>
              {sale.customerName && (
                <div className="col-span-2">
                  <span className="text-slate-500">Customer: </span>
                  <span className="font-bold text-slate-900">
                    {sale.customerName} {sale.customerPhone ? `(${sale.customerPhone})` : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="space-y-2 py-2 border-b border-dashed border-slate-400 mb-3">
              <div className="flex justify-between font-bold text-[11px] text-slate-600 pb-1 border-b border-slate-200">
                <span>ITEM / DESCRIPTION</span>
                <span>{currency}</span>
              </div>
              {sale.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span className="truncate pr-2">
                      {item.productName} {item.quantity > 1 ? `x${item.quantity}` : ''}
                    </span>
                    <span>{item.total.toLocaleString()}</span>
                  </div>
                  {item.imei && (
                    <div className="text-[10px] text-slate-700 bg-slate-100 px-1 py-0.5 rounded flex items-center justify-between">
                      <span>IMEI: {formatImei(item.imei)}</span>
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    </div>
                  )}
                  {item.imei2 && (
                    <div className="text-[10px] text-slate-600 px-1">
                      IMEI 2: {formatImei(item.imei2)}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-1 text-right text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>{currency} {sale.subtotal.toLocaleString()}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-rose-600 font-semibold">
                  <span>Discount:</span>
                  <span>-{currency} {sale.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-sm text-slate-950 pt-1 border-t border-slate-400">
                <span>NET TOTAL:</span>
                <span>{currency} {sale.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-700 pt-0.5">
                <span>Amount Paid ({sale.paymentMethod}):</span>
                <span className="font-bold">{currency} {sale.amountPaid.toLocaleString()}</span>
              </div>
              {sale.total > sale.amountPaid && (
                <div className="flex justify-between text-amber-800 font-bold bg-amber-50 p-1 rounded">
                  <span>Due Balance:</span>
                  <span>{currency} {(sale.total - sale.amountPaid).toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Warranty & Terms */}
            {sale.warrantyEndDate && (
              <div className="mt-4 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-center">
                <p className="text-[10px] font-bold text-amber-950 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                  WARRANTY VALID UNTIL: {sale.warrantyEndDate}
                </p>
                <p className="text-[9px] text-amber-800 mt-0.5">
                  Present this receipt for official manufacturer warranty & claims.
                </p>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-dashed border-slate-400 text-center text-[9px] text-slate-500 space-y-1">
              <p>{settings.defaultWarrantyTerms}</p>
              <p className="font-bold text-slate-700 uppercase">THANK YOU FOR SHOPPING WITH RANKS!</p>
            </div>
          </div>
        </div>

        {/* Action Buttons: WhatsApp Share, Print, Copy */}
        <div className="p-3.5 bg-[#131822] border-t border-white/10 space-y-2">
          <button
            onClick={handleWhatsAppShare}
            className="w-full py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99]"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            Share Receipt via WhatsApp
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handlePrint}
              className="py-2 px-3 rounded-xl bg-[#1c2230] hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-white/10"
            >
              <Printer className="w-3.5 h-3.5 text-[#e6c673]" /> Print
            </button>
            <button
              onClick={handleCopyText}
              className="py-2 px-3 rounded-xl bg-[#1c2230] hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-white/10"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#e6c673]" /> Copy Text
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  CheckCircle2, 
  QrCode, 
  Star, 
  Send, 
  MessageSquare,
  ShieldCheck,
  CreditCard,
  Banknote,
  Smartphone,
  Sparkles
} from 'lucide-react';
import { SalesReceipt, ReceiptFeedback } from '../types';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: SalesReceipt | null;
  onSubmitFeedback?: (receiptNumber: string, feedback: ReceiptFeedback) => void;
  allowFeedback?: boolean;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  receipt,
  onSubmitFeedback,
  allowFeedback = true
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Freshness', 'Fast Service']);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  if (!isOpen || !receipt) return null;

  const FEEDBACK_TAGS = [
    'Super Fresh Produce',
    'Sweet & Juicy Fruits',
    'Fast Service',
    'Great Prices',
    'Polite Staff',
    'Eco-friendly Packaging'
  ];

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() && rating === 0) return;

    const feedbackData: ReceiptFeedback = {
      rating,
      comment: comment.trim() || 'Great fresh organic produce from Fofo Green!',
      customerName: receipt.customerName,
      submittedAt: new Date().toISOString(),
      tags: selectedTags
    };

    if (onSubmitFeedback) {
      onSubmitFeedback(receipt.receiptNumber, feedbackData);
    }
    setIsSubmitted(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadText = () => {
    const lines = [
      '==========================================',
      '           FOFO GREEN RWANDA              ',
      '    Farm to Table • Fresh Every Day       ',
      '      Kigali Nyarugenge Market Hub        ',
      '           TIN: 108420199-RRA             ',
      '==========================================',
      `Receipt No : ${receipt.receiptNumber}`,
      `Date/Time  : ${receipt.issuedAt}`,
      `Cashier    : ${receipt.cashierName}`,
      `Customer   : ${receipt.customerName}`,
      receipt.customerPhone ? `Phone      : ${receipt.customerPhone}` : '',
      '------------------------------------------',
      'ITEMS PURCHASED:',
      ...receipt.items.map(
        item => `${item.name.padEnd(24)} x${item.quantity}  ${(item.total).toLocaleString()} FRW`
      ),
      '------------------------------------------',
      `Subtotal   : ${receipt.subtotal.toLocaleString()} FRW`,
      receipt.discount > 0 ? `Discount   : -${receipt.discount.toLocaleString()} FRW` : '',
      receipt.deliveryFee > 0 ? `Delivery   : +${receipt.deliveryFee.toLocaleString()} FRW` : '',
      `TOTAL PAID : ${receipt.total.toLocaleString()} FRW`,
      '------------------------------------------',
      `Payment    : ${receipt.paymentMethod.toUpperCase()}`,
      `Ref / Auth : ${receipt.paymentReference}`,
      receipt.amountTendered ? `Cash Tender: ${receipt.amountTendered.toLocaleString()} FRW` : '',
      receipt.changeGiven ? `Change     : ${receipt.changeGiven.toLocaleString()} FRW` : '',
      '==========================================',
      '     Murakoze Cyane! Thank You!           ',
      '   100% Pesticide-Free Rwandan Produce    ',
      '=========================================='
    ].filter(Boolean).join('\n');

    const blob = new Blob([lines], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${receipt.receiptNumber}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Action Bar */}
        <div className="bg-stone-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Official Sales Receipt</p>
              <p className="text-xs font-mono font-bold text-stone-200">{receipt.receiptNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white transition-colors cursor-pointer"
              title="Print receipt"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownloadText}
              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white transition-colors cursor-pointer"
              title="Download text receipt"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto space-y-5">
          
          {/* Printable Ticket Card */}
          <div className="bg-stone-50/80 rounded-2xl p-5 border border-dashed border-stone-300 font-sans shadow-2xs">
            
            {/* Header branding */}
            <div className="text-center pb-4 border-b border-dashed border-stone-200">
              <div className="inline-flex items-center gap-1.5 justify-center mb-1">
                <span className="font-extrabold text-xl text-stone-900 tracking-tight font-serif">Fofo</span>
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-200">
                  Green
                </span>
              </div>
              <p className="text-xs font-semibold text-stone-700">Fofo Green Rwanda Ltd.</p>
              <p className="text-[11px] text-stone-500">Farm-to-Table Organic Fresh Grocery Hub</p>
              <p className="text-[10px] text-stone-400 font-mono mt-0.5">Kigali Nyarugenge • TIN: 108420199</p>
            </div>

            {/* Metadata info */}
            <div className="grid grid-cols-2 gap-2 text-xs py-3 border-b border-dashed border-stone-200 text-stone-600">
              <div>
                <p className="text-[10px] uppercase text-stone-400 font-bold">Issued At</p>
                <p className="font-semibold text-stone-800">{receipt.issuedAt}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-stone-400 font-bold">Served By (Cashier)</p>
                <p className="font-semibold text-stone-800">{receipt.cashierName}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-stone-400 font-bold">Customer</p>
                <p className="font-semibold text-stone-800">{receipt.customerName}</p>
                {receipt.customerPhone && (
                  <p className="text-[10px] text-stone-500 font-mono">{receipt.customerPhone}</p>
                )}
              </div>
              <div>
                <p className="text-[10px] uppercase text-stone-400 font-bold">Order ID</p>
                <p className="font-semibold font-mono text-stone-800">{receipt.orderId}</p>
              </div>
            </div>

            {/* Line items table */}
            <div className="py-3 border-b border-dashed border-stone-200">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-stone-400 font-bold text-[10px] uppercase border-b border-stone-200 pb-1">
                    <th className="text-left pb-1">Item Description</th>
                    <th className="text-center pb-1">Qty</th>
                    <th className="text-right pb-1">Price</th>
                    <th className="text-right pb-1">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {receipt.items.map((item, idx) => (
                    <tr key={idx} className="text-stone-700 py-1.5">
                      <td className="py-1 text-left font-medium">
                        <div>{item.name}</div>
                        <div className="text-[10px] text-stone-400">{item.spec}</div>
                      </td>
                      <td className="py-1 text-center font-mono font-bold text-stone-800">
                        {item.quantity}
                      </td>
                      <td className="py-1 text-right text-stone-500 font-mono">
                        {item.unitPrice.toLocaleString()}
                      </td>
                      <td className="py-1 text-right font-bold text-stone-900 font-mono">
                        {item.total.toLocaleString()} FRW
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals & Calculations */}
            <div className="py-3 space-y-1.5 text-xs text-stone-600 border-b border-dashed border-stone-200">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-mono">{receipt.subtotal.toLocaleString()} FRW</span>
              </div>
              {receipt.discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Special Discount:</span>
                  <span className="font-mono">-{receipt.discount.toLocaleString()} FRW</span>
                </div>
              )}
              {receipt.deliveryFee > 0 && (
                <div className="flex justify-between">
                  <span>Delivery / Logistics:</span>
                  <span className="font-mono">+{receipt.deliveryFee.toLocaleString()} FRW</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold text-stone-900 pt-1.5 border-t border-stone-200">
                <span>TOTAL AMOUNT:</span>
                <span className="font-mono text-emerald-800">{receipt.total.toLocaleString()} FRW</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="pt-3 flex items-center justify-between text-xs bg-white/70 p-2.5 rounded-xl border border-stone-200">
              <div className="flex items-center gap-2">
                {receipt.paymentMethod === 'cash' ? (
                  <Banknote className="w-4 h-4 text-emerald-700" />
                ) : receipt.paymentMethod === 'mtn' || receipt.paymentMethod === 'airtel' ? (
                  <Smartphone className="w-4 h-4 text-amber-600" />
                ) : (
                  <CreditCard className="w-4 h-4 text-blue-600" />
                )}
                <div>
                  <p className="font-bold text-stone-800 uppercase tracking-wider text-[11px]">
                    Paid via {receipt.paymentMethod}
                  </p>
                  <p className="text-[10px] text-stone-500 font-mono">Ref: {receipt.paymentReference}</p>
                </div>
              </div>

              {receipt.changeGiven !== undefined && receipt.changeGiven > 0 && (
                <div className="text-right">
                  <p className="text-[10px] text-stone-400">Change Returned</p>
                  <p className="font-mono font-bold text-emerald-700">{receipt.changeGiven.toLocaleString()} FRW</p>
                </div>
              )}
            </div>

            {/* QR Code Verification Footer */}
            <div className="mt-4 pt-3 border-t border-stone-200 flex items-center justify-between">
              <div className="text-left">
                <p className="text-[10px] font-bold text-stone-800 uppercase tracking-wider">RRA / Farm Verified</p>
                <p className="text-[9px] text-stone-400">Authentic Organic Produce • 100% Rwandan Farmers</p>
                <p className="text-[9px] text-emerald-700 font-semibold mt-0.5">Murakoze cyane kubana natwe!</p>
              </div>
              <div className="p-1.5 bg-white border border-stone-200 rounded-lg shadow-2xs">
                <QrCode className="w-9 h-9 text-stone-800" />
              </div>
            </div>

          </div>

          {/* Customer Feedback on Receipt */}
          {allowFeedback && (
            <div className="bg-emerald-50/60 rounded-2xl p-4 sm:p-5 border border-emerald-200/80">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-700 text-white flex items-center justify-center text-xs">
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-sm font-extrabold text-stone-900">
                  {isSubmitted ? 'Thank You For Your Feedback!' : 'Rate & Review Your Purchase'}
                </h4>
              </div>

              {isSubmitted || receipt.feedback ? (
                <div className="p-3 bg-white rounded-xl border border-emerald-200 text-xs space-y-1">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star 
                        key={s} 
                        className={`w-4 h-4 fill-current ${s <= (receipt.feedback?.rating || rating) ? 'text-amber-400' : 'text-stone-200'}`} 
                      />
                    ))}
                    <span className="font-bold text-stone-700 ml-1">
                      {receipt.feedback?.rating || rating} / 5
                    </span>
                  </div>
                  <p className="text-stone-700 font-medium italic mt-1">
                    "{receipt.feedback?.comment || comment}"
                  </p>
                  <p className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 mt-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified Customer Feedback Recorded
                  </p>
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="space-y-3">
                  <p className="text-xs text-stone-600">
                    How was the freshness of your fruits and the service today?
                  </p>

                  {/* Stars Rating Selector */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 cursor-pointer transition-transform hover:scale-115"
                      >
                        <Star
                          className={`w-6 h-6 transition-colors ${
                            (hoverRating || rating) >= star
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-stone-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-stone-700 ml-2">
                      {rating === 5 ? 'Excellent 🌟' : rating === 4 ? 'Very Good 👍' : rating === 3 ? 'Good' : 'Needs Improvement'}
                    </span>
                  </div>

                  {/* Quick Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {FEEDBACK_TAGS.map((tag) => (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`text-[11px] px-2.5 py-1 rounded-full font-semibold border transition-all cursor-pointer ${
                          selectedTags.includes(tag)
                            ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                            : 'bg-white text-stone-600 border-stone-200 hover:border-emerald-600'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>

                  {/* Comment Box */}
                  <div>
                    <textarea
                      rows={2}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Write a comment about fruit freshness, delivery, or service..."
                      className="w-full text-xs p-2.5 bg-white border border-stone-300 rounded-xl focus:outline-emerald-600 focus:ring-1 focus:ring-emerald-600 placeholder:text-stone-400"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Verified Review & Feedback</span>
                  </button>
                </form>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

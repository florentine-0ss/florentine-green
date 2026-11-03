import crypto from 'crypto';

export interface EbmTaxItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  taxCode?: 'A' | 'B'; // A = 0% Exempt (Fresh agricultural produce), B = 18% Standard VAT
}

export interface EbmReceiptRequest {
  orderId: string;
  customerName: string;
  customerPhone?: string;
  customerTin?: string; // Optional Rwanda TIN (9 digits)
  items: EbmTaxItem[];
  subtotal: number;
  discount?: number;
  deliveryFee?: number;
  paymentMethod: string;
  paymentReference?: string;
  cashierName?: string;
}

export interface EbmFiscalReceipt {
  fiscalReceiptNumber: string;
  sdcId: string; // Sales Data Controller ID
  mrc: string; // Machine Registration Code
  issuedAt: string;
  buyerTin: string;
  buyerName: string;
  buyerPhone?: string;
  taxSummary: {
    taxableAmountA: number; // 0% Exempt
    taxAmountA: number;
    taxableAmountB: number; // 18% Standard VAT
    taxAmountB: number;
    totalTax: number;
    grandTotal: number;
  };
  internalData: string;
  receiptSignature: string;
  rraQrCodeUrl: string;
  rraSyncStatus: 'TRANSMITTED' | 'QUEUED';
  sdcReceiptCounter: number;
}

class EbmService {
  private sdcId = 'SDC00100492';
  private mrc = 'FGG-KGL-01';
  private counter = 19480;
  private receipts: EbmFiscalReceipt[] = [];

  constructor() {
    // Seed initial historical fiscal receipt for demonstration
    this.counter++;
    const initialReceipt: EbmFiscalReceipt = {
      fiscalReceiptNumber: `EBM-2026/0${this.counter}`,
      sdcId: this.sdcId,
      mrc: this.mrc,
      issuedAt: new Date(Date.now() - 7200000).toISOString(),
      buyerTin: '999999999',
      buyerName: 'Keza Diane',
      buyerPhone: '+250 788 412 890',
      taxSummary: {
        taxableAmountA: 13000,
        taxAmountA: 0,
        taxableAmountB: 1500,
        taxAmountB: 270,
        totalTax: 270,
        grandTotal: 14770
      },
      internalData: 'F8C1-92DA-4E7B-0081',
      receiptSignature: 'MEQCIA...rra-ebm-sig-9841',
      rraQrCodeUrl: `https://ebm.rra.gov.rw/verify?sdc=${this.sdcId}&rcpt=${this.counter}&date=20261026`,
      rraSyncStatus: 'TRANSMITTED',
      sdcReceiptCounter: this.counter
    };
    this.receipts.push(initialReceipt);
  }

  // Generate official RRA EBM v2 Fiscal Invoicing Record
  public generateFiscalReceipt(payload: EbmReceiptRequest): EbmFiscalReceipt {
    this.counter++;
    const now = new Date();

    let taxableA = 0; // 0% Exempt (Fresh produce)
    let taxableB = 0; // 18% Standard VAT (Prepared kits, delivery fees, processing)

    payload.items.forEach((item) => {
      // By default in Rwanda, raw fresh fruits and vegetables are VAT Exempt (Tax Code A)
      const isTaxable = item.taxCode === 'B' || item.name.toLowerCase().includes('kit') || item.name.toLowerCase().includes('dried');
      if (isTaxable) {
        taxableB += item.total;
      } else {
        taxableA += item.total;
      }
    });

    // Delivery fee is taxed at Standard 18% VAT if present
    if (payload.deliveryFee && payload.deliveryFee > 0) {
      taxableB += payload.deliveryFee;
    }

    // Apply proportional discount
    const discount = payload.discount || 0;
    if (discount > 0) {
      const totalBeforeDiscount = taxableA + taxableB;
      if (totalBeforeDiscount > 0) {
        const ratioA = taxableA / totalBeforeDiscount;
        const ratioB = taxableB / totalBeforeDiscount;
        taxableA = Math.max(0, taxableA - discount * ratioA);
        taxableB = Math.max(0, taxableB - discount * ratioB);
      }
    }

    const vatB = Math.round((taxableB * 18) / 118); // Included standard VAT
    const netB = taxableB - vatB;

    const grandTotal = Math.round(taxableA + taxableB);
    const dateFormatted = now.toISOString().replace(/[-:T]/g, '').slice(0, 14);

    // Cryptographic Internal Data representation (RRA standard SHA-256 slice)
    const hashSeed = `${this.sdcId}|${this.counter}|${grandTotal}|${dateFormatted}|${payload.customerTin || '999999999'}`;
    const hash = crypto.createHash('sha256').update(hashSeed).digest('hex').toUpperCase();
    const internalData = `${hash.slice(0, 4)}-${hash.slice(4, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}`;

    const rraReceiptNumber = `EBM-2026/0${this.counter}`;
    const rraQrCodeUrl = `https://ebm.rra.gov.rw/verify?sdc=${this.sdcId}&rcpt=${this.counter}&tot=${grandTotal}&dt=${dateFormatted.slice(0, 8)}`;

    const fiscalReceipt: EbmFiscalReceipt = {
      fiscalReceiptNumber: rraReceiptNumber,
      sdcId: this.sdcId,
      mrc: this.mrc,
      issuedAt: now.toISOString(),
      buyerTin: payload.customerTin?.trim() || '999999999', // 999999999 = End Consumer
      buyerName: payload.customerName || 'End Consumer (Retail)',
      buyerPhone: payload.customerPhone,
      taxSummary: {
        taxableAmountA: Math.round(taxableA),
        taxAmountA: 0,
        taxableAmountB: Math.round(taxableB),
        taxAmountB: vatB,
        totalTax: vatB,
        grandTotal
      },
      internalData,
      receiptSignature: `RRA-SIG-${hash.slice(16, 32)}`,
      rraQrCodeUrl,
      rraSyncStatus: 'TRANSMITTED',
      sdcReceiptCounter: this.counter
    };

    this.receipts.unshift(fiscalReceipt);
    return fiscalReceipt;
  }

  public getReceipts(limit = 50): EbmFiscalReceipt[] {
    return this.receipts.slice(0, limit);
  }

  public getFiscalStats() {
    let totalTaxCollected = 0;
    let totalExemptSales = 0;
    let totalStandardVatSales = 0;

    this.receipts.forEach((r) => {
      totalTaxCollected += r.taxSummary.totalTax;
      totalExemptSales += r.taxSummary.taxableAmountA;
      totalStandardVatSales += r.taxSummary.taxableAmountB;
    });

    return {
      sdcId: this.sdcId,
      mrc: this.mrc,
      rraConnection: 'ONLINE',
      lastTransmission: new Date().toISOString(),
      totalReceiptsIssued: this.receipts.length,
      currentReceiptCounter: this.counter,
      totalTaxCollectedRWF: totalTaxCollected,
      totalExemptSalesRWF: totalExemptSales,
      totalStandardVatSalesRWF: totalStandardVatSales,
      taxPayerTin: '108420199',
      taxPayerName: 'FOFO GREEN RWANDA LTD'
    };
  }
}

export const ebmService = new EbmService();

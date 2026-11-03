import crypto from 'crypto';

export interface MoMoRequestToPayPayload {
  amount: number;
  currency: string; // 'RWF'
  externalId: string; // Order or invoice ID
  payerPhone: string; // e.g. '0788123456' or '250788123456'
  payerMessage?: string;
  payeeNote?: string;
  customerName?: string;
}

export interface MoMoTransaction {
  referenceId: string;
  externalId: string;
  amount: number;
  currency: string;
  payerPhone: string;
  customerName: string;
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'REJECTED';
  financialTransactionId?: string;
  initiatedAt: string;
  completedAt?: string;
  payerMessage: string;
  payeeNote: string;
  failureReason?: string;
}

// In-memory transaction registry with pre-seeded demo records
class MoMoService {
  private transactions: Map<string, MoMoTransaction> = new Map();
  private merchantWalletBalanceRWF: number = 2450800; // 2.45M FRW live merchant balance

  constructor() {
    // Seed initial completed transactions
    const initialTx: MoMoTransaction = {
      referenceId: 'momo-ref-9842-kgl',
      externalId: 'FOFO-1024',
      amount: 14500,
      currency: 'RWF',
      payerPhone: '+250 788 412 890',
      customerName: 'Keza Diane',
      status: 'SUCCESSFUL',
      financialTransactionId: 'MTN-RW-2026-984102',
      initiatedAt: new Date(Date.now() - 3600000).toISOString(),
      completedAt: new Date(Date.now() - 3550000).toISOString(),
      payerMessage: 'Payment for Musanze Avocados & Papaya',
      payeeNote: 'Fofo Green Grocery Hub Kigali'
    };
    this.transactions.set(initialTx.referenceId, initialTx);
  }

  // Normalize Rwandan phone format (accepts 078..., +25078..., 25078...)
  public normalizeRwandaPhone(input: string): string {
    const cleaned = input.replace(/\s+/g, '').replace(/-/g, '');
    if (cleaned.startsWith('+250')) return cleaned;
    if (cleaned.startsWith('250')) return `+${cleaned}`;
    if (cleaned.startsWith('07')) return `+250${cleaned.slice(1)}`;
    if (cleaned.startsWith('7')) return `+250${cleaned}`;
    return cleaned;
  }

  // MTN MoMo Collections: POST /collection/v1_0/requesttopay
  public initiateRequestToPay(payload: MoMoRequestToPayPayload): MoMoTransaction {
    const referenceId = crypto.randomUUID();
    const normalizedPhone = this.normalizeRwandaPhone(payload.payerPhone);

    const transaction: MoMoTransaction = {
      referenceId,
      externalId: payload.externalId,
      amount: Number(payload.amount),
      currency: payload.currency || 'RWF',
      payerPhone: normalizedPhone,
      customerName: payload.customerName || 'Customer',
      status: 'PENDING',
      initiatedAt: new Date().toISOString(),
      payerMessage: payload.payerMessage || `Payment of ${payload.amount} RWF to Fofo Green`,
      payeeNote: payload.payeeNote || 'Fofo Green Fresh Grocery'
    };

    this.transactions.set(referenceId, transaction);

    // Auto-resolve pending transaction in demo mode after 4 seconds if not explicitly stimulated
    setTimeout(() => {
      const current = this.transactions.get(referenceId);
      if (current && current.status === 'PENDING') {
        this.approveTransaction(referenceId);
      }
    }, 4500);

    return transaction;
  }

  // MTN MoMo Collections: GET /collection/v1_0/requesttopay/{referenceId}
  public getTransactionStatus(referenceId: string): MoMoTransaction | null {
    return this.transactions.get(referenceId) || null;
  }

  // Simulate Customer entering PIN on their mobile phone
  public approveTransaction(referenceId: string): MoMoTransaction | null {
    const tx = this.transactions.get(referenceId);
    if (!tx) return null;

    tx.status = 'SUCCESSFUL';
    tx.financialTransactionId = `MTN-RW-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    tx.completedAt = new Date().toISOString();
    this.merchantWalletBalanceRWF += tx.amount;

    return tx;
  }

  // Simulate Customer rejecting or canceling prompt
  public rejectTransaction(referenceId: string, reason = 'Customer entered incorrect PIN or timed out'): MoMoTransaction | null {
    const tx = this.transactions.get(referenceId);
    if (!tx) return null;

    tx.status = 'REJECTED';
    tx.failureReason = reason;
    tx.completedAt = new Date().toISOString();
    return tx;
  }

  public getRecentTransactions(limit = 20): MoMoTransaction[] {
    return Array.from(this.transactions.values())
      .sort((a, b) => new Date(b.initiatedAt).getTime() - new Date(a.initiatedAt).getTime())
      .slice(0, limit);
  }

  public getWalletBalance() {
    return {
      availableBalance: this.merchantWalletBalanceRWF,
      currency: 'RWF',
      provider: 'MTN Mobile Money Rwanda (MoMo Pay)',
      merchantCode: '908411',
      accountHolderName: 'FOFO GREEN RWANDA LTD',
      status: 'ACTIVE'
    };
  }
}

export const momoService = new MoMoService();

import { Share } from 'react-native';
import { useApp } from '../contexts/AppContext';

export interface ExportOptions {
  format: 'csv' | 'json' | 'pdf';
  dateRange?: {
    start: Date;
    end: Date;
  };
  includeMetadata?: boolean;
  transactionTypes?: ('send' | 'receive')[];
}

export interface ExportData {
  transactions: TransactionExport[];
  summary: ExportSummary;
  metadata: ExportMetadata;
}

interface TransactionExport {
  id: string;
  date: string;
  type: string;
  amount: number;
  token: string;
  status: string;
  counterparty: string;
  memo?: string;
  chainId?: number;
}

interface ExportSummary {
  totalSent: number;
  totalReceived: number;
  transactionCount: number;
  dateRange: { start: string; end: string };
}

interface ExportMetadata {
  exportedAt: string;
  walletAddress?: string;
  format: string;
}

const generateCSV = (data: ExportData): string => {
  const headers = ['Date', 'Type', 'Amount', 'Token', 'Status', 'Counterparty', 'Memo', 'Chain ID'];
  const rows = data.transactions.map(tx => [
    tx.date,
    tx.type,
    tx.amount.toString(),
    tx.token,
    tx.status,
    tx.counterparty,
    tx.memo || '',
    tx.chainId?.toString() || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
};

const generateJSON = (data: ExportData): string => {
  return JSON.stringify(data, null, 2);
};

const generatePDFContent = (data: ExportData): string => {
  let html = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #007AFF; color: white; }
          .summary { background: #f9f9f9; padding: 15px; border-radius: 8px; margin-top: 20px; }
          .positive { color: green; }
          .negative { color: red; }
        </style>
      </head>
      <body>
        <h1>PeysOS Transaction Export</h1>
        <p>Exported: ${data.metadata.exportedAt}</p>
        
        <div class="summary">
          <h2>Summary</h2>
          <p><strong>Total Sent:</strong> $${data.summary.totalSent.toFixed(2)}</p>
          <p><strong>Total Received:</strong> $${data.summary.totalReceived.toFixed(2)}</p>
          <p><strong>Transactions:</strong> ${data.summary.transactionCount}</p>
          <p><strong>Period:</strong> ${data.summary.dateRange.start} - ${data.summary.dateRange.end}</p>
        </div>
        
        <table>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Token</th>
            <th>Status</th>
            <th>Counterparty</th>
          </tr>
  `;

  data.transactions.forEach(tx => {
    const amountClass = tx.type === 'receive' ? 'positive' : 'negative';
    const sign = tx.type === 'receive' ? '+' : '-';
    html += `
      <tr>
        <td>${tx.date}</td>
        <td>${tx.type}</td>
        <td class="${amountClass}">${sign}$${tx.amount.toFixed(2)}</td>
        <td>${tx.token}</td>
        <td>${tx.status}</td>
        <td>${tx.counterparty}</td>
      </tr>
    `;
  });

  html += `
        </table>
      </body>
    </html>
  `;

  return html;
};

export const TransactionExport = {
  async exportTransactions(options: ExportOptions): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      const { transactions } = useApp();

      let filteredTransactions = [...transactions];

      if (options.dateRange) {
        filteredTransactions = filteredTransactions.filter(tx => {
          const txDate = new Date(tx.created_at);
          return txDate >= options.dateRange!.start && txDate <= options.dateRange!.end;
        });
      }

      if (options.transactionTypes && options.transactionTypes.length > 0) {
        filteredTransactions = filteredTransactions.filter(tx =>
          options.transactionTypes!.includes(tx.type)
        );
      }

      const sortedTxs = filteredTransactions.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      const exportTransactions: TransactionExport[] = sortedTxs.map(tx => ({
        id: tx.id,
        date: new Date(tx.created_at).toISOString(),
        type: tx.type,
        amount: tx.amount,
        token: tx.token,
        status: tx.status,
        counterparty: tx.counterparty,
        memo: (tx as any).memo,
        chainId: tx.chain_id,
      }));

      const totalSent = sortedTxs.filter(tx => tx.type === 'send').reduce((sum, tx) => sum + tx.amount, 0);
      const totalReceived = sortedTxs.filter(tx => tx.type === 'receive').reduce((sum, tx) => sum + tx.amount, 0);

      const dateRange = sortedTxs.length > 0
        ? {
            start: new Date(sortedTxs[sortedTxs.length - 1].created_at).toLocaleDateString(),
            end: new Date(sortedTxs[0].created_at).toLocaleDateString(),
          }
        : { start: 'N/A', end: 'N/A' };

      const exportData: ExportData = {
        transactions: exportTransactions,
        summary: {
          totalSent,
          totalReceived,
          transactionCount: sortedTxs.length,
          dateRange,
        },
        metadata: {
          exportedAt: new Date().toISOString(),
          format: options.format,
        },
      };

      let exportContent: string;

      switch (options.format) {
        case 'csv':
          exportContent = generateCSV(exportData);
          break;
        case 'json':
          exportContent = generateJSON(exportData);
          break;
        case 'pdf':
          exportContent = generatePDFContent(exportData);
          break;
        default:
          return { success: false, error: 'Invalid format' };
      }

      return { success: true, data: exportContent };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Export failed' };
    }
  },

  async shareExport(content: string, format: 'csv' | 'json' | 'pdf'): Promise<void> {
    const extension = format;
    const mimeType = format === 'json' ? 'application/json' : format === 'csv' ? 'text/csv' : 'text/html';
    
    await Share.share({
      message: content,
      title: `PeysOS Export.${extension}`,
    });
  },

  getExportFormats(): { value: ExportOptions['format']; label: string; extension: string }[] {
    return [
      { value: 'csv', label: 'CSV (Spreadsheet)', extension: 'csv' },
      { value: 'json', label: 'JSON (Data)', extension: 'json' },
      { value: 'pdf', label: 'PDF (Report)', extension: 'html' },
    ];
  },

  getDateRangeOptions(): { label: string; value: string }[] {
    return [
      { label: 'Last 7 days', value: '7d' },
      { label: 'Last 30 days', value: '30d' },
      { label: 'Last 90 days', value: '90d' },
      { label: 'This year', value: 'year' },
      { label: 'All time', value: 'all' },
    ];
  },

  calculateDateRange(value: string): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();

    switch (value) {
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
      case 'year':
        start.setFullYear(end.getFullYear(), 0, 1);
        break;
      case 'all':
        start.setFullYear(2020, 0, 1);
        break;
    }

    return { start, end };
  },
};

export const exportTransactions = async (options: ExportOptions) => {
  return TransactionExport.exportTransactions(options);
};

export const shareExport = async (content: string, format: 'csv' | 'json' | 'pdf') => {
  return TransactionExport.shareExport(content, format);
};
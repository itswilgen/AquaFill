import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import Spinner from '../components/Spinner';
import { StatusBadge } from './Dashboard';
import { useToast } from '../hooks/useToast';
import { Toast } from '../components/Toast';
import { useWindowSize } from '../hooks/useWindowSize';
import { getBills, getBillSummary, markBillPaid, deleteBill } from '../services/api';

const API_ORIGIN = 'http://localhost:3001';
const PAGE_SIZE = 10;

export default function Billing() {
  const { isMobile, isTablet, isNarrow } = useWindowSize();
  const [bills,   setBills]   = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const { toast, showToast }  = useToast();
  const [animateIn, setAnimateIn] = useState(false);
  const showExtraColumns = !isMobile;
  const contentPadding = isMobile ? 16 : isTablet ? 20 : 28;

  async function load() {
    setLoading(true);
    const [b, s] = await Promise.all([getBills(), getBillSummary()]);
    setBills(b.data.data);
    setSummary(s.data.data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const timer = setTimeout(() => setAnimateIn(true), 60);
    return () => clearTimeout(timer);
  }, []);

  const totalPages = Math.max(1, Math.ceil(bills.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pagedBills = bills.slice(startIndex, startIndex + PAGE_SIZE);

  useEffect(() => {
    setPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  async function handlePay(id) {
    if (confirm('Mark this bill as paid?')) {
      try {
        await markBillPaid(id);
        showToast('Bill marked as paid!');
        load();
      } catch {
        showToast('Failed to update bill.', 'error');
      }
    }
  }

  async function handleDelete(id) {
    if (confirm('Delete this bill?')) {
      try {
        await deleteBill(id);
        showToast('Bill deleted.', 'info');
        load();
      } catch {
        showToast('Failed to delete bill.', 'error');
      }
    }
  }

  return (
    <Layout>
      <style>{`
        @keyframes adminFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes adminFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .admin-metric {
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .admin-metric:hover {
          transform: translateY(-2px);
          border-color: #dbe5ef;
          box-shadow: 0 10px 22px rgba(15, 23, 42, 0.08);
        }
        .admin-action-btn {
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }
        .admin-action-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.14);
        }
        .admin-table-wrap {
          transition: box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .admin-table-wrap:hover {
          border-color: #d8e2ec;
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
        }
        .admin-row {
          transition: background 0.16s ease;
        }
        .admin-row:hover {
          background: #f8fafc;
        }
        @media (prefers-reduced-motion: reduce) {
          .admin-metric,
          .admin-action-btn,
          .admin-table-wrap,
          .admin-row {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      <PageHeader title="Billing" subtitle="Track payments and outstanding balances" />

      <div style={{ ...styles.content, padding: contentPadding }}>
        <div
          style={{
            ...styles.grid3,
            gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, minmax(0, 1fr))' : 'repeat(3, minmax(0, 1fr))',
          }}
        >
          <div
            className="admin-metric"
            style={{ ...styles.metric, ...styles.metricTotal, ...(animateIn ? { animation: 'adminFadeUp 0.42s ease 0s both' } : {}) }}
          >
            <p style={{ ...styles.metricLabel, color: '#38526a' }}>Total billed</p>
            <p style={{ ...styles.metricValue, color: 'var(--theme-link)' }}>₱{Number(summary.total_revenue || 0).toFixed(2)}</p>
          </div>
          <div
            className="admin-metric"
            style={{ ...styles.metric, ...styles.metricCollected, ...(animateIn ? { animation: 'adminFadeUp 0.42s ease 0.06s both' } : {}) }}
          >
            <p style={{ ...styles.metricLabel, color: '#2e6040' }}>Collected</p>
            <p style={{ ...styles.metricValue, color: '#3B6D11' }}>₱{Number(summary.paid_revenue || 0).toFixed(2)}</p>
          </div>
          <div
            className="admin-metric"
            style={{ ...styles.metric, ...styles.metricOutstanding, ...(animateIn ? { animation: 'adminFadeUp 0.42s ease 0.12s both' } : {}) }}
          >
            <p style={{ ...styles.metricLabel, color: '#7a3b3b' }}>Outstanding</p>
            <p style={{ ...styles.metricValue, color: '#A32D2D' }}>₱{Number(summary.unpaid_revenue || 0).toFixed(2)}</p>
          </div>
        </div>

        {loading ? <Spinner /> : (
          <div
            className="admin-table-wrap"
            style={{ ...styles.tableWrap, ...(animateIn ? { animation: 'adminFadeUp 0.45s ease 0.1s both' } : {}) }}
          >
            <table style={{ ...styles.table, minWidth: showExtraColumns ? 860 : (isNarrow ? 420 : 560) }}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>Bill ID</th>
                  <th style={styles.th}>Customer</th>
                  {showExtraColumns && <th style={styles.th}>Qty</th>}
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Status</th>
                  {showExtraColumns && <th style={styles.th}>Proof</th>}
                  {showExtraColumns && <th style={styles.th}>Paid at</th>}
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.length === 0 ? (
                  <tr>
                    <td colSpan={showExtraColumns ? 8 : 5} style={{ textAlign: 'center', padding: 32, color: '#aaa', fontSize: 13 }}>
                      No bills found
                    </td>
                  </tr>
                ) : pagedBills.map((b, index) => (
                  <tr
                    key={b.id}
                    className="admin-row"
                    style={animateIn ? { animation: `adminFadeIn 0.32s ease ${0.14 + (index * 0.03)}s both` } : undefined}
                  >
                    <td style={styles.td}>{b.id}</td>
                    <td style={styles.td}>{b.customer_name}</td>
                    {showExtraColumns && <td style={styles.td}>{b.quantity}</td>}
                    <td style={styles.td}>₱{Number(b.amount).toFixed(2)}</td>
                    <td style={styles.td}><StatusBadge status={b.status} /></td>
                    {showExtraColumns && (
                      <td style={styles.td}>
                        {b.proof_url ? (
                          <a
                            href={`${API_ORIGIN}${b.proof_url}`}
                            target="_blank"
                            rel="noreferrer"
                            style={styles.proofLink}
                          >
                            View proof
                          </a>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>
                        )}
                      </td>
                    )}
                    {showExtraColumns && <td style={styles.td}>{b.paid_at ? b.paid_at.slice(0, 10) : '—'}</td>}
                    <td style={{ ...styles.td, ...styles.actionsCell, ...(isNarrow ? styles.actionsMobile : {}) }}>
                      {b.status === 'unpaid' && (
                        <button className="admin-action-btn" style={{ ...styles.payBtn, ...(isNarrow ? styles.actionBtnMobile : {}) }} onClick={() => handlePay(b.id)}>
                          Mark paid
                        </button>
                      )}
                      <button className="admin-action-btn" style={{ ...styles.deleteBtn, ...(isNarrow ? styles.actionBtnMobile : {}) }} onClick={() => handleDelete(b.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && bills.length > 0 && (
          <div style={styles.paginationWrap}>
            <div style={styles.paginationInfo}>
              Showing {startIndex + 1}-{Math.min(startIndex + PAGE_SIZE, bills.length)} of {bills.length}
            </div>
            <div style={styles.paginationControls}>
              <button
                type="button"
                style={{ ...styles.pageBtn, ...(currentPage === 1 ? styles.pageBtnDisabled : {}) }}
                disabled={currentPage === 1}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              >
                Previous
              </button>
              <span style={styles.pageText}>Page {currentPage} of {totalPages}</span>
              <button
                type="button"
                style={{ ...styles.pageBtn, ...(currentPage === totalPages ? styles.pageBtnDisabled : {}) }}
                disabled={currentPage === totalPages}
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <Toast toast={toast} />
    </Layout>
  );
}

const styles = {
  content:    { padding: 28 },
  grid3:      { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 },
  metric:     { background: '#fff', border: '1px solid #e5e5e5', borderRadius: 10, padding: '16px 18px' },
  metricTotal: { background: 'var(--theme-accent-soft)', borderColor: 'var(--theme-accent-border)' },
  metricCollected: { background: '#EAF8EA', borderColor: '#BFE6C0' },
  metricOutstanding: { background: '#FFF1F1', borderColor: '#F7CACA' },
  metricLabel:{ fontSize: 12, color: '#888', margin: '0 0 6px' },
  metricValue:{ fontSize: 24, fontWeight: 600, margin: 0, color: '#1a1a1a' },
  tableWrap:  { background: '#fff', border: '1px solid #e5e5e5', borderRadius: 8, overflow: 'auto' },
  table:      { width: '100%', borderCollapse: 'collapse' },
  thead:      { background: '#fafafa' },
  th:         { padding: '10px 12px', textAlign: 'left', fontSize: 11, color: '#888', fontWeight: 500, borderBottom: '1px solid #eee' },
  td:         { padding: '10px 12px', fontSize: 12, borderBottom: '1px solid #f5f5f5' },
  actionsCell:{ whiteSpace: 'nowrap' },
  actionsMobile:{ display: 'flex', flexDirection: 'column', gap: 6 },
  actionBtnMobile: { width: '100%', marginRight: 0 },
  proofLink:  { color: 'var(--theme-link)', textDecoration: 'none', fontSize: 12, fontWeight: 600 },
  payBtn:     { padding: '4px 10px', fontSize: 11, marginRight: 6, background: '#EAF3DE', color: '#27500A', border: '1px solid #C0DD97', borderRadius: 5, cursor: 'pointer' },
  deleteBtn:  { padding: '4px 10px', fontSize: 11, background: '#FEE', color: '#c0392b', border: '1px solid #F7C1C1', borderRadius: 5, cursor: 'pointer' },
  paginationWrap: { marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  paginationInfo: { fontSize: 12, color: '#64748b' },
  paginationControls: { display: 'flex', alignItems: 'center', gap: 8 },
  pageBtn: { padding: '6px 10px', fontSize: 12, borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', color: '#334155', cursor: 'pointer' },
  pageBtnDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  pageText: { fontSize: 12, color: '#334155', fontWeight: 600 },
};

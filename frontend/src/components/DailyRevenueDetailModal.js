import React, { useRef, useEffect, useCallback } from 'react';
import { XMarkIcon, PrinterIcon } from '@heroicons/react/24/outline';
import { buildDailyRevenueReportHtml } from '../utils/dailyRevenueReportHtml';

export default function DailyRevenueDetailModal({ isOpen, onClose, data }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !data) return;
    const t = window.setTimeout(() => {
      const doc = iframeRef.current?.contentDocument;
      if (!doc) return;
      doc.open();
      doc.write(buildDailyRevenueReportHtml(data));
      doc.close();
    }, 0);
    return () => window.clearTimeout(t);
  }, [isOpen, data]);

  const handlePrint = useCallback(() => {
    iframeRef.current?.contentWindow?.focus();
    iframeRef.current?.contentWindow?.print();
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !data) return null;

  const { date, summary, orders = [], dayClose } = data;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="daily-rev-title"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-gray-200">
          <div>
            <h2 id="daily-rev-title" className="text-lg font-semibold text-gray-900">
              Daily revenue — {date}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {summary?.orderCount ?? 0} paid orders · Total Rs.{Number(summary?.totalRevenue || 0).toFixed(2)}
              {dayClose ? (
                <span className="ml-2 text-green-700 font-medium">· Formally closed</span>
              ) : (
                <span className="ml-2 text-amber-700">· Not formally closed</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
            >
              <PrinterIcon className="h-5 w-5 shrink-0" aria-hidden />
              Print report
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              <XMarkIcon className="h-5 w-5 shrink-0" aria-hidden />
              Close
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-gray-500">Subtotal</div>
              <div className="font-semibold">Rs.{Number(summary?.subtotalSum || 0).toFixed(2)}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-gray-500">Tax</div>
              <div className="font-semibold">Rs.{Number(summary?.taxSum || 0).toFixed(2)}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-gray-500">Total</div>
              <div className="font-semibold text-primary-700">Rs.{Number(summary?.totalRevenue || 0).toFixed(2)}</div>
            </div>
            {dayClose?.closedBy && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-500">Closed by</div>
                <div className="font-semibold">{dayClose.closedBy.name}</div>
              </div>
            )}
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Order</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Time</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600">Total</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Type</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Payment</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Table</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Customer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                      No paid orders this day
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-mono text-xs">{o.orderNumber}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{new Date(o.createdAt).toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2 text-right font-medium">Rs.{o.total}</td>
                      <td className="px-3 py-2 capitalize">{o.orderType}</td>
                      <td className="px-3 py-2 capitalize">{o.paymentMethod}</td>
                      <td className="px-3 py-2">{o.tableNumber || '—'}</td>
                      <td className="px-3 py-2 max-w-[140px] truncate">{o.customerName || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-2">Print preview (same as printed report)</p>
            <iframe
              title="Daily revenue report print preview"
              ref={iframeRef}
              className="w-full min-h-[320px] border border-gray-300 rounded-md bg-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

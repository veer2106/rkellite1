import React, { useRef, useEffect, useCallback } from 'react';
import { XMarkIcon, PrinterIcon } from '@heroicons/react/24/outline';
import { buildGstBillHtml } from '../utils/billFormat';

/**
 * On-screen GST bill preview with Print (uses iframe document.print — no pop-up).
 */
export default function BillPreviewModal({ isOpen, onClose, order, billOptions }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !order) return;
    const t = window.setTimeout(() => {
      const iframe = iframeRef.current;
      if (!iframe) return;
      const doc = iframe.contentDocument;
      if (!doc) return;
      doc.open();
      doc.write(buildGstBillHtml(order, billOptions || {}));
      doc.close();
    }, 0);
    return () => window.clearTimeout(t);
  }, [isOpen, order, billOptions]);

  const handlePrint = useCallback(() => {
    const w = iframeRef.current?.contentWindow;
    if (!w) return;
    w.focus();
    w.print();
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !order) return null;

  const rw = billOptions?.receiptWidthMm ?? process.env.REACT_APP_RECEIPT_WIDTH_MM;
  const receiptMm = rw === 58 || rw === '58' ? 58 : 80;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bill-preview-title"
      onClick={onClose}
    >
      <div
        className="bg-gray-100 rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-white border-b border-gray-200">
          <div>
            <h2 id="bill-preview-title" className="text-lg font-semibold text-gray-900">
              Receipt preview
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Thermal {receiptMm}mm — match printer paper in print dialog
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
            >
              <PrinterIcon className="h-5 w-5 shrink-0" aria-hidden />
              Print
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 bg-white text-gray-800 text-sm font-medium rounded-lg hover:bg-gray-50"
            >
              <XMarkIcon className="h-5 w-5 shrink-0" aria-hidden />
              Close
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-3 sm:p-4 min-h-[280px] flex justify-center bg-stone-300/60">
          <iframe
            title="Thermal receipt print preview"
            ref={iframeRef}
            className="min-h-[560px] bg-white border border-stone-400 shadow-md rounded-sm shrink-0"
            style={{ width: `min(100%, ${receiptMm + 8}mm)` }}
          />
        </div>
      </div>
    </div>
  );
}

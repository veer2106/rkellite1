/** @param {unknown} s */
function escapeHtml(s) {
  if (s == null || s === '') return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function money(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(2) : '0.00';
}

const LOW = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen'
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigitsWords(n) {
  if (n < 20) return LOW[n];
  const t = Math.floor(n / 10);
  const u = n % 10;
  return TENS[t] + (u ? ' ' + LOW[u] : '');
}

/** @param {number} n - non-negative integer */
function intToIndianWords(n) {
  if (n === 0) return 'Zero';
  if (n < 100) return twoDigitsWords(n);
  if (n < 1000) {
    const h = Math.floor(n / 100);
    const r = n % 100;
    return LOW[h] + ' Hundred' + (r ? ' ' + intToIndianWords(r) : '');
  }
  if (n < 100000) {
    const th = Math.floor(n / 1000);
    const r = n % 1000;
    return twoDigitsWords(th) + ' Thousand' + (r ? ' ' + intToIndianWords(r) : '');
  }
  if (n < 10000000) {
    const l = Math.floor(n / 100000);
    const r = n % 100000;
    return twoDigitsWords(l) + ' Lakh' + (r ? ' ' + intToIndianWords(r) : '');
  }
  const c = Math.floor(n / 10000000);
  const r = n % 10000000;
  return twoDigitsWords(c) + ' Crore' + (r ? ' ' + intToIndianWords(r) : '');
}

function totalAmountInWords(amount) {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  let w = intToIndianWords(rupees) + ' Rupees';
  if (paise > 0) w += ' and ' + intToIndianWords(paise) + ' Paise';
  return w + ' Only';
}

/**
 * Normalizes API order into totals for display.
 * @param {object} order
 */
export function normalizeBillOrder(order) {
  const items = Array.isArray(order.items) ? order.items : [];
  let subtotal = Number(order.subtotal);
  if (!Number.isFinite(subtotal) && items.length) {
    subtotal = items.reduce(
      (s, it) => s + Number(it.price || 0) * Number(it.quantity || 0),
      0
    );
  }
  if (!Number.isFinite(subtotal)) subtotal = 0;

  const tax = Number(order.tax);
  const deliveryFee = Number(order.deliveryFee);
  const discount = Number(order.discount);
  const total = Number(order.total);
  const computedTotal =
    Number.isFinite(total) && total >= 0
      ? total
      : subtotal +
        (Number.isFinite(tax) ? tax : 0) +
        (Number.isFinite(deliveryFee) ? deliveryFee : 0) -
        (Number.isFinite(discount) ? discount : 0);

  const disc = Number.isFinite(discount) ? discount : 0;
  const taxableValue = Math.max(0, subtotal - disc);
  const taxNum = Number.isFinite(tax) ? tax : 0;
  const cgstAmt = taxNum / 2;
  const sgstAmt = taxNum / 2;
  let cgstRate = 0;
  let sgstRate = 0;
  if (taxableValue > 0 && taxNum > 0) {
    cgstRate = (cgstAmt / taxableValue) * 100;
    sgstRate = (sgstAmt / taxableValue) * 100;
  }

  return {
    items,
    subtotal,
    taxableValue,
    discount: disc,
    deliveryFee: Number.isFinite(deliveryFee) ? deliveryFee : 0,
    tax: taxNum,
    cgstAmt,
    sgstAmt,
    cgstRate,
    sgstRate,
    total: computedTotal
  };
}

/**
 * Full HTML document for thermal receipt printers (58mm / 80mm rolls) and on-screen preview.
 * @param {object} order
 * @param {object} [options]
 * @param {string} [options.businessName]
 * @param {string[]} [options.addressLines]
 * @param {string} [options.gstin]
 * @param {string} [options.fssai]
 * @param {string} [options.hsnCode]
 * @param {58|80|number} [options.receiptWidthMm] — roll width; default 80 (use 58 for narrow printers)
 */
export function buildGstBillHtml(order, options = {}) {
  if (!order) return '<!DOCTYPE html><html><body></body></html>';

  const rawW = options.receiptWidthMm ?? process.env.REACT_APP_RECEIPT_WIDTH_MM;
  const widthMm = rawW === '58' || rawW === 58 ? 58 : rawW === '80' || rawW === 80 ? 80 : Number(rawW) || 80;
  const narrow = widthMm <= 58;

  const businessName = options.businessName || process.env.REACT_APP_RESTAURANT_NAME || 'RK Ellite';
  const addressLines = options.addressLines?.length
    ? options.addressLines
    : (process.env.REACT_APP_RESTAURANT_ADDRESS || '')
        .split('|')
        .map((l) => l.trim())
        .filter(Boolean);
  if (addressLines.length === 0) {
    addressLines.push('Restaurant & Lodge — Karnataka');
  }
  const gstin = options.gstin || process.env.REACT_APP_GSTIN || 'GSTIN: (set REACT_APP_GSTIN)';
  const fssai = options.fssai || process.env.REACT_APP_FSSAI || '';
  const hsnCode = options.hsnCode || '996331';

  const b = normalizeBillOrder(order);
  const dateStr = order.createdAt
    ? new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
    : new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });

  const sectionLabel =
    order.section === 'lodge-dine'
      ? 'Lodge-Dine'
      : order.section === 'cafe-restaurant'
        ? 'Cafe'
        : order.section || '—';

  const orderTypeLabel = order.orderType ? String(order.orderType).replace(/-/g, ' ') : '—';

  const itemBlocks = b.items.map((it, idx) => {
    const qty = Number(it.quantity) || 0;
    const price = Number(it.price) || 0;
    const line = qty * price;
    return `<div class="it">
  <div class="it-n">${idx + 1}. ${escapeHtml(it.name || 'Item')}</div>
  <div class="it-r"><span>${qty} x ${money(price)}</span><span>${money(line)}</span></div>
</div>`;
  });

  const cgstPct = b.taxableValue > 0 && b.tax > 0 ? b.cgstRate.toFixed(2) : '0.00';
  const sgstPct = b.taxableValue > 0 && b.tax > 0 ? b.sgstRate.toFixed(2) : '0.00';

  const addrBlock = addressLines.map((l) => `<div class="c small">${escapeHtml(l)}</div>`).join('');

  function row(label, value, bold) {
    return `<div class="row${bold ? ' bold' : ''}"><span class="lbl">${escapeHtml(label)}</span><span class="val">${value}</span></div>`;
  }

  const sumRows = [];
  if (b.discount > 0) {
    sumRows.push(row('Subtotal', `Rs.${money(b.subtotal)}`, false));
    sumRows.push(row('Discount', `-${money(b.discount)}`, false));
    sumRows.push(row('Taxable', `Rs.${money(b.taxableValue)}`, false));
  } else {
    sumRows.push(row('Taxable', `Rs.${money(b.taxableValue)}`, false));
  }
  sumRows.push(row(`CGST ${cgstPct}%`, `Rs.${money(b.cgstAmt)}`, false));
  sumRows.push(row(`SGST ${sgstPct}%`, `Rs.${money(b.sgstAmt)}`, false));
  if (b.deliveryFee > 0) {
    sumRows.push(row('Delivery', `Rs.${money(b.deliveryFee)}`, false));
  }
  sumRows.push(row('TOTAL', `Rs.${money(b.total)}`, true));

  const fs = narrow ? 9 : 10;
  const fsHead = narrow ? 10 : 11;
  const fsName = narrow ? 12 : 13;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Bill ${escapeHtml(order.orderNumber || '')}</title>
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #fff; color: #000; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { font-family: 'Courier New', Courier, 'Liberation Mono', monospace; font-size: ${fs}px; line-height: 1.25; }
    .receipt {
      width: ${widthMm}mm;
      max-width: 100%;
      margin: 0 auto;
      padding: 2mm 3mm 4mm;
    }
    .c { text-align: center; }
    .small { font-size: ${narrow ? 8 : 9}px; }
    .rule { border: none; border-top: 1px dashed #000; margin: 3px 0; }
    .rule-s { margin: 2px 0; }
    .title { font-weight: 700; font-size: ${fsHead}px; letter-spacing: 0.04em; }
    .name { font-weight: 700; font-size: ${fsName}px; margin: 2px 0 1px; }
    .meta { margin: 2px 0; }
    .row { display: flex; justify-content: space-between; gap: 4px; align-items: baseline; }
    .row .lbl { flex: 1; min-width: 0; word-break: break-word; padding-right: 2px; }
    .row .val { flex-shrink: 0; text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
    .row.bold .lbl, .row.bold .val { font-weight: 700; font-size: ${fs + 2}px; }
    .it { margin: 4px 0; padding-bottom: 3px; border-bottom: 1px dotted #aaa; }
    .it:last-of-type { border-bottom: none; }
    .it-n { word-break: break-word; hyphens: auto; }
    .it-r { display: flex; justify-content: space-between; margin-top: 1px; font-variant-numeric: tabular-nums; }
    .sec-h { font-weight: 700; margin: 4px 0 2px; font-size: ${fs}px; }
    .words { font-size: ${narrow ? 7 : 8}px; line-height: 1.3; margin: 4px 0; text-align: left; word-break: break-word; }
    .foot { text-align: center; font-size: ${narrow ? 7 : 8}px; margin-top: 6px; line-height: 1.35; }
    @media print {
      @page { size: ${widthMm}mm auto; margin: 0; }
      body { padding: 0; }
      .receipt { width: 100%; max-width: none; margin: 0; padding: 1mm 2mm 3mm; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="c title">TAX INVOICE</div>
    <div class="c name">${escapeHtml(businessName)}</div>
    <div>${addrBlock}</div>
    <div class="c small meta">${escapeHtml(gstin)}</div>
    ${fssai ? `<div class="c small meta">FSSAI ${escapeHtml(fssai)}</div>` : ''}
    <hr class="rule rule-s"/>

    ${row('Bill', escapeHtml(String(order.orderNumber || '—')), false)}
    ${row('Date', escapeHtml(dateStr), false)}
    ${row('Type', escapeHtml(orderTypeLabel), false)}
    ${row('Section', escapeHtml(sectionLabel), false)}
    ${row('Table', order.tableNumber != null && order.tableNumber !== '' ? escapeHtml(String(order.tableNumber)) : '-', false)}
    ${row('Status', escapeHtml(String(order.status || '—')), false)}

    ${
      order.customerName || order.customerPhone
        ? `<hr class="rule rule-s"/>
    ${order.customerName ? row('Cust', escapeHtml(String(order.customerName)), false) : ''}
    ${order.customerPhone ? row('Ph', escapeHtml(String(order.customerPhone)), false) : ''}`
        : ''
    }

    <hr class="rule"/>
    <div class="sec-h">ITEMS (HSN ${escapeHtml(hsnCode)})</div>
    ${itemBlocks.length ? itemBlocks.join('') : '<div class="c small">No items</div>'}
    <hr class="rule"/>

    ${sumRows.join('')}
    <hr class="rule"/>

    <div class="words"><b>In words:</b> ${escapeHtml(totalAmountInWords(b.total))}</div>
    ${row('Pay', escapeHtml(String(order.paymentMethod || '-')), false)}
    ${row('Pay st', escapeHtml(String(order.paymentStatus || '-')), false)}

    <div class="foot">
      Computer generated. No signature.<br/>
      E.&amp;O.E. Thank you
    </div>
  </div>
</body>
</html>`;
}

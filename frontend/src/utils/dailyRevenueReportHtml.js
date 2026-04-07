function esc(s) {
  if (s == null || s === '') return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Printable HTML for daily revenue detail (thermal-friendly width).
 * @param {object} payload - API GET /reports/daily-revenue/:date `data`
 */
export function buildDailyRevenueReportHtml(payload) {
  if (!payload) return '<!DOCTYPE html><html><body></body></html>';

  const { date, summary, orders = [], dayClose } = payload;
  const rows = orders
    .map(
      (o) => `<tr>
    <td>${esc(o.orderNumber)}</td>
    <td>${esc(new Date(o.createdAt).toLocaleString('en-IN'))}</td>
    <td class="r">${esc(o.total)}</td>
    <td>${esc(o.orderType)}</td>
    <td>${esc(o.paymentMethod)}</td>
    <td>${esc(o.tableNumber || '-')}</td>
  </tr>`
    )
    .join('');

  const byType = summary?.byOrderType
    ? Object.entries(summary.byOrderType)
        .map(([k, v]) => `<div class="row"><span>${esc(k)}</span><span class="r">Rs.${Number(v).toFixed(2)}</span></div>`)
        .join('')
    : '';
  const byPay = summary?.byPayment
    ? Object.entries(summary.byPayment)
        .map(([k, v]) => `<div class="row"><span>${esc(k)}</span><span class="r">Rs.${Number(v).toFixed(2)}</span></div>`)
        .join('')
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Daily revenue ${esc(date)}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 8px; font-family: 'Courier New', Courier, monospace; font-size: 10px; }
    .sheet { max-width: 800px; margin: 0 auto; }
    h1 { font-size: 14px; margin: 0 0 8px; }
    .meta { margin-bottom: 8px; line-height: 1.4; }
    .row { display: flex; justify-content: space-between; gap: 8px; }
    table { width: 100%; border-collapse: collapse; margin: 8px 0; }
    th, td { border: 1px solid #333; padding: 3px 4px; text-align: left; }
    th { background: #eee; }
    .r { text-align: right; }
    .sec { font-weight: 700; margin-top: 10px; margin-bottom: 4px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="sheet">
    <h1>Daily revenue report</h1>
    <div class="meta">
      <div><b>Date:</b> ${esc(date)}</div>
      <div><b>Orders (paid):</b> ${summary?.orderCount ?? 0}</div>
      <div><b>Subtotal:</b> Rs.${Number(summary?.subtotalSum || 0).toFixed(2)}</div>
      <div><b>Tax:</b> Rs.${Number(summary?.taxSum || 0).toFixed(2)}</div>
      <div><b>Total revenue:</b> Rs.${Number(summary?.totalRevenue || 0).toFixed(2)}</div>
      ${
        dayClose
          ? `<div><b>Formally closed:</b> ${esc(new Date(dayClose.closedAt).toLocaleString('en-IN'))}${dayClose.closedBy?.name ? ` by ${esc(dayClose.closedBy.name)}` : ''}</div>`
          : '<div><b>Formally closed:</b> No</div>'
      }
    </div>
    <div class="sec">By order type</div>
    ${byType || '<div>—</div>'}
    <div class="sec">By payment</div>
    ${byPay || '<div>—</div>'}
    <div class="sec">Transactions</div>
    <table>
      <thead>
        <tr><th>Order #</th><th>Time</th><th class="r">Total</th><th>Type</th><th>Pay</th><th>Table</th></tr>
      </thead>
      <tbody>${rows || '<tr><td colspan="6">No paid orders</td></tr>'}</tbody>
    </table>
    <p style="margin-top:12px;font-size:9px;">Computer generated — RK Ellite</p>
  </div>
</body>
</html>`;
}

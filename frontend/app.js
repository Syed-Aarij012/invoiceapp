const API = 'http://localhost:3001/api/invoices';

let invoices = [];
let currentFilter = [];
let currentInvoiceId = null;
let editMode = false;

// ── Bootstrap ──────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('f-date').value = today();
  document.addEventListener('click', e => {
    if (!e.target.closest('.filter-dropdown'))
      document.getElementById('filter-menu').classList.add('hidden');
  });
  await loadInvoices();

});

async function loadInvoices() {
  try {
    const res = await fetch(API);
    invoices = await res.json();
    renderInvoices();
  } catch (e) {
    document.getElementById('invoice-list').innerHTML =
      '<p class="empty-state" style="color:#ec5757">Could not connect to server. Make sure the backend is running.</p>';
  }
}

// ── Render ─────────────────────────────────────────────────
function renderInvoices() {
  const list = document.getElementById('invoice-list');
  const filtered = getFiltered();
  const countEl = document.getElementById('invoice-count');
  countEl.textContent = currentFilter.length === 0
    ? `There are ${invoices.length} total invoice${invoices.length !== 1 ? 's' : ''}`
    : `${filtered.length} invoice${filtered.length !== 1 ? 's' : ''}`;

  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty-state">
      <img src="assets/illustration-empty.svg" alt="">
      <h3>There is nothing here</h3>
      <p>Create an invoice by clicking the New Invoice button and get started</p>
    </div>`;
    return;
  }
  list.innerHTML = filtered.map(inv => `
    <div class="invoice-card" onclick="showDetail('${inv.id}')">
      <span class="inv-id"><span>#</span>${inv.id}</span>
      <span class="inv-due">Due ${formatDate(inv.paymentDue)}</span>
      <span class="inv-client">${inv.clientName}</span>
      <span class="inv-amount">£ ${Number(inv.total).toLocaleString('en-GB',{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
      <span class="status ${inv.status}">${inv.status}</span>
      <span class="inv-arrow"><img src="assets/icon-arrow-right.svg" alt=""></span>
    </div>`).join('');
}

function getFiltered() {
  return currentFilter.length === 0 ? invoices : invoices.filter(i => currentFilter.includes(i.status));
}

// ── Filter ─────────────────────────────────────────────────
function toggleFilterMenu() { document.getElementById('filter-menu').classList.toggle('hidden'); }
function handleFilter() {
  currentFilter = [...document.querySelectorAll('#filter-menu input:checked')].map(c => c.value);
  renderInvoices();
}

// ── Detail View ────────────────────────────────────────────
function showDetail(id) {
  currentInvoiceId = id;
  const inv = invoices.find(i => i.id === id);
  if (!inv) return;
  document.getElementById('view-list').classList.add('hidden');
  document.getElementById('view-detail').classList.remove('hidden');

  const badge = document.getElementById('detail-status-badge');
  badge.className = `status ${inv.status}`;
  badge.textContent = inv.status;
  document.getElementById('btn-mark-paid').style.display = inv.status === 'paid' ? 'none' : '';

  const sa = inv.senderAddress || {}, ca = inv.clientAddress || {};
  const items = (inv.items || []).map(item => `
    <div class="detail-item">
      <span class="item-name">${item.name}</span>
      <span class="item-qty">${item.quantity}</span>
      <span class="item-price">£ ${Number(item.price).toFixed(2)}</span>
      <span class="item-total">£ ${Number(item.total).toFixed(2)}</span>
    </div>`).join('');

  document.getElementById('detail-card').innerHTML = `
    <div class="detail-top">
      <div>
        <p class="detail-id"><span>#</span>${inv.id}</p>
        <p class="detail-desc">${inv.description || ''}</p>
      </div>
      <div class="detail-sender">${sa.street||''}<br>${sa.city||''}<br>${sa.postCode||''}<br>${sa.country||''}</div>
    </div>
    <div class="detail-meta">
      <div>
        <div class="detail-meta-group"><label>Invoice Date</label><p class="val">${formatDate(inv.createdAt)}</p></div>
        <div class="detail-meta-group" style="margin-top:24px"><label>Payment Due</label><p class="val">${formatDate(inv.paymentDue)}</p></div>
      </div>
      <div class="detail-meta-group">
        <label>Bill To</label>
        <p class="val">${inv.clientName}</p>
        <p class="val-sm">${ca.street||''}<br>${ca.city||''}<br>${ca.postCode||''}<br>${ca.country||''}</p>
      </div>
      <div class="detail-meta-group"><label>Sent to</label><p class="val">${inv.clientEmail||''}</p></div>
    </div>
    <div class="detail-items">
      <div class="detail-items-header">
        <span>Item Name</span><span style="text-align:right">QTY.</span>
        <span style="text-align:right">Price</span><span style="text-align:right">Total</span>
      </div>
      ${items}
    </div>
    <div class="detail-total">
      <span>Amount Due</span>
      <strong>£ ${Number(inv.total).toLocaleString('en-GB',{minimumFractionDigits:2,maximumFractionDigits:2})}</strong>
    </div>`;
}

function showList() {
  document.getElementById('view-detail').classList.add('hidden');
  document.getElementById('view-list').classList.remove('hidden');
  currentInvoiceId = null;
}

// ── Mark Paid ──────────────────────────────────────────────
async function markCurrentPaid() {
  const res = await fetch(`${API}/${currentInvoiceId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'paid' })
  });
  const updated = await res.json();
  const idx = invoices.findIndex(i => i.id === currentInvoiceId);
  if (idx !== -1) invoices[idx] = updated;
  showDetail(currentInvoiceId);
  renderInvoices();
}

// ── Delete ─────────────────────────────────────────────────
function deleteCurrentInvoice() { openDeleteModal(currentInvoiceId); }

function openDeleteModal(id) {
  currentInvoiceId = id;
  document.getElementById('delete-modal-text').textContent =
    `Are you sure you want to delete invoice #${id}? This action cannot be undone.`;
  document.getElementById('delete-modal').classList.remove('hidden');
}
function closeDeleteModal() { document.getElementById('delete-modal').classList.add('hidden'); }

async function confirmDelete() {
  await fetch(`${API}/${currentInvoiceId}`, { method: 'DELETE' });
  invoices = invoices.filter(i => i.id !== currentInvoiceId);
  closeDeleteModal();
  showList();
  renderInvoices();
}

// ── Form: New ──────────────────────────────────────────────
function openForm() {
  editMode = false;
  document.getElementById('form-title').textContent = 'New Invoice';
  clearForm();
  document.getElementById('f-date').value = today();
  document.getElementById('form-footer').innerHTML = `
    <button class="btn-discard" onclick="closeForm()">Discard</button>
    <button class="btn-draft" onclick="saveInvoice('draft')">Save as Draft</button>
    <button class="btn-save" onclick="saveInvoice('pending')">Save &amp; Send</button>`;
  document.getElementById('form-overlay').classList.remove('hidden');
}

// ── Form: Edit ─────────────────────────────────────────────
function openEditForm() {
  const inv = invoices.find(i => i.id === currentInvoiceId);
  if (!inv) return;
  editMode = true;
  document.getElementById('form-title').textContent = `Edit #${inv.id}`;
  const sa = inv.senderAddress || {}, ca = inv.clientAddress || {};
  document.getElementById('f-from-street').value  = sa.street   || '';
  document.getElementById('f-from-city').value    = sa.city     || '';
  document.getElementById('f-from-post').value    = sa.postCode || '';
  document.getElementById('f-from-country').value = sa.country  || '';
  document.getElementById('f-client-name').value  = inv.clientName  || '';
  document.getElementById('f-client-email').value = inv.clientEmail || '';
  document.getElementById('f-to-street').value    = ca.street   || '';
  document.getElementById('f-to-city').value      = ca.city     || '';
  document.getElementById('f-to-post').value      = ca.postCode || '';
  document.getElementById('f-to-country').value   = ca.country  || '';
  document.getElementById('f-date').value         = inv.createdAt || today();
  document.getElementById('f-terms').value        = inv.paymentTerms || 30;
  document.getElementById('f-desc').value         = inv.description || '';
  document.getElementById('item-list').innerHTML  = '';
  (inv.items || []).forEach(item => addItem(item));
  document.getElementById('form-footer').innerHTML = `
    <button class="btn-discard" onclick="closeForm()">Cancel</button>
    <button class="btn-save" style="margin-left:auto" onclick="saveInvoice('keep')">Save Changes</button>`;
  document.getElementById('form-overlay').classList.remove('hidden');
}

function closeForm() { document.getElementById('form-overlay').classList.add('hidden'); }

function clearForm() {
  ['f-from-street','f-from-city','f-from-post','f-from-country',
   'f-client-name','f-client-email','f-to-street','f-to-city',
   'f-to-post','f-to-country','f-desc'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('f-terms').value = '30';
  document.getElementById('item-list').innerHTML = '';
  document.getElementById('form-error').classList.add('hidden');
}

// ── Save Invoice ───────────────────────────────────────────
async function saveInvoice(statusArg) {
  const name  = document.getElementById('f-client-name').value.trim();
  const desc  = document.getElementById('f-desc').value.trim();
  const date  = document.getElementById('f-date').value;
  const terms = parseInt(document.getElementById('f-terms').value);
  const errEl = document.getElementById('form-error');

  if (statusArg !== 'draft' && (!name || !desc || !date)) {
    errEl.classList.remove('hidden'); return;
  }
  errEl.classList.add('hidden');

  const items = collectItems();
  const total = items.reduce((s, i) => s + i.total, 0);

  const data = {
    clientName:    name,
    clientEmail:   document.getElementById('f-client-email').value.trim(),
    description:   desc,
    createdAt:     date,
    paymentTerms:  terms,
    paymentDue:    calcDue(date, terms),
    senderAddress: {
      street:   document.getElementById('f-from-street').value.trim(),
      city:     document.getElementById('f-from-city').value.trim(),
      postCode: document.getElementById('f-from-post').value.trim(),
      country:  document.getElementById('f-from-country').value.trim(),
    },
    clientAddress: {
      street:   document.getElementById('f-to-street').value.trim(),
      city:     document.getElementById('f-to-city').value.trim(),
      postCode: document.getElementById('f-to-post').value.trim(),
      country:  document.getElementById('f-to-country').value.trim(),
    },
    items, total,
  };

  if (editMode) {
    const inv = invoices.find(i => i.id === currentInvoiceId);
    const newStatus = statusArg === 'keep'
      ? (inv.status === 'draft' ? 'pending' : inv.status)
      : statusArg;
    const payload = { ...data, id: currentInvoiceId, status: newStatus };
    const res = await fetch(`${API}/${currentInvoiceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const updated = await res.json();
    const idx = invoices.findIndex(i => i.id === currentInvoiceId);
    if (idx !== -1) invoices[idx] = updated;
    closeForm();
    showDetail(currentInvoiceId);
    renderInvoices();
  } else {
    const id = generateId();
    const status = statusArg === 'keep' ? 'pending' : statusArg;
    const payload = { id, status, ...data };
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const created = await res.json();
    invoices.push(created);
    closeForm();
    renderInvoices();
  }
}

// ── Item Rows ──────────────────────────────────────────────
function addItem(prefill = null) {
  const container = document.getElementById('item-list');
  const row = document.createElement('div');
  row.className = 'item-row';
  row.innerHTML = `
    <input type="text"   class="item-name-input"  placeholder="Item Name" value="${prefill ? prefill.name : ''}">
    <input type="number" class="item-qty-input"   placeholder="1" min="1" value="${prefill ? prefill.quantity : ''}">
    <input type="number" class="item-price-input" placeholder="0.00" step="0.01" value="${prefill ? prefill.price : ''}">
    <span class="item-total-display">${prefill ? '£ ' + Number(prefill.total).toFixed(2) : '0.00'}</span>
    <button class="btn-remove-item" onclick="this.closest('.item-row').remove()">
      <img src="assets/icon-delete.svg" alt="remove">
    </button>`;
  const qty   = row.querySelector('.item-qty-input');
  const price = row.querySelector('.item-price-input');
  const span  = row.querySelector('.item-total-display');
  const upd   = () => { span.textContent = '£ ' + ((parseFloat(qty.value)||0)*(parseFloat(price.value)||0)).toFixed(2); };
  qty.addEventListener('input', upd);
  price.addEventListener('input', upd);
  container.appendChild(row);
}

function collectItems() {
  return [...document.querySelectorAll('.item-row')].map(row => {
    const name  = row.querySelector('.item-name-input').value.trim();
    const qty   = parseFloat(row.querySelector('.item-qty-input').value)   || 0;
    const price = parseFloat(row.querySelector('.item-price-input').value) || 0;
    return { name, quantity: qty, price, total: qty * price };
  });
}

// ── Helpers ────────────────────────────────────────────────
function calcDue(dateStr, days) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}
function formatDate(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
}
function generateId() {
  const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const l = () => L[Math.floor(Math.random()*26)];
  const n = () => Math.floor(Math.random()*10);
  return `${l()}${l()}${n()}${n()}${n()}${n()}`;
}
function today() { return new Date().toISOString().split('T')[0]; }
function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  document.getElementById('theme-icon').src = isDark ? 'assets/icon-sun.svg' : 'assets/icon-moon.svg';
}

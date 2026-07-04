// Populate year dropdown
const yearSelect = document.getElementById('case_year');
const currentYear = new Date().getFullYear();
for (let y = currentYear; y >= 1990; y--) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    yearSelect.appendChild(opt);
}

// Global state
let sessionCookie = null;
let allOrders = [];
let finalPdfDataUrl = null;
let currentCaseInfo = '';

// DOM Elements
const searchForm = document.getElementById('searchForm');
const searchBtn = document.getElementById('searchBtn');
const resetBtn = document.getElementById('resetBtn');
const searchError = document.getElementById('searchError');
const casesCard = document.getElementById('casesCard');
const casesList = document.getElementById('casesList');
const ordersCard = document.getElementById('ordersCard');
const ordersBody = document.getElementById('ordersBody');
const orderCount = document.getElementById('orderCount');
const selectAll = document.getElementById('selectAll');
const downloadBtn = document.getElementById('downloadBtn');
const selectedCount = document.getElementById('selectedCount');

// Progress Modal
const progressModal = document.getElementById('progressModal');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const progTotal = document.getElementById('progTotal');
const progDone = document.getElementById('progDone');
const progFailed = document.getElementById('progFailed');

// Complete Modal
const completeModal = document.getElementById('completeModal');
const savePdfBtn = document.getElementById('savePdfBtn');
const failedOrdersContainer = document.getElementById('failedOrdersContainer');
const failedOrdersList = document.getElementById('failedOrdersList');

// Form Submit
searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const payload = {
        bench_id: document.getElementById('bench_id').value,
        case_type: document.getElementById('case_type').value,
        case_no: document.getElementById('case_no').value,
        case_year: document.getElementById('case_year').value
    };

    setLoading(true);
    searchError.classList.add('hidden');
    casesCard.classList.add('hidden');
    ordersCard.classList.add('hidden');

    try {
        const res = await fetch('/api/search-case', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const data = await res.json();
        
        if (data.success) {
            sessionCookie = data.session_cookie;
            displayCases(data.cases);
            resetBtn.classList.remove('hidden');
        } else {
            showError(data.error);
        }
    } catch (err) {
        showError('Network error: ' + err.message);
    } finally {
        setLoading(false);
    }
});

function displayCases(cases) {
    casesList.innerHTML = '';
    cases.forEach(c => {
        const card = document.createElement('div');
        card.className = 'case-item';
        card.innerHTML = `
            <div class="case-item-title">${c.case_title1} vs ${c.case_title2}</div>
            <div class="case-item-meta">
                <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/></svg> ${c.case_no}</span>
                <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M6 21V7l6-4 6 4v14M9 9h1m-1 4h1m4-4h1m-1 4h1M10 21v-4h4v4"/></svg> ${c.bench}</span>
                <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z"/><path d="M14 2v6h6M9 15l2 2 4-4"/></svg> ${c.filing_no}</span>
                <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg> ${c.status}</span>
            </div>
        `;
        card.onclick = () => {
            document.querySelectorAll('.case-item').forEach(el => el.classList.remove('selected'));
            card.classList.add('selected');
            currentCaseInfo = `${c.case_no}_${c.case_title1}`.replace(/[^a-zA-Z0-9]/g, '_');
            fetchOrders(c.filing_no);
        };
        casesList.appendChild(card);
    });
    casesCard.classList.remove('hidden');
    
    // Auto select if only one case
    if (cases.length === 1) {
        casesList.firstChild.click();
    }
}

async function fetchOrders(filing_no) {
    ordersCard.classList.add('hidden');
    
    // Could add loading state here
    try {
        const res = await fetch('/api/get-orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filing_no, session_cookie: sessionCookie })
        });
        
        const data = await res.json();
        if (data.success) {
            allOrders = data.orders;
            displayOrders(allOrders);
        } else {
            showError(data.error);
        }
    } catch (err) {
        showError('Network error fetching orders: ' + err.message);
    }
}

function displayOrders(orders) {
    ordersBody.innerHTML = '';
    orderCount.textContent = `${orders.length} orders found`;
    
    orders.forEach((o, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <label class="checkbox-container">
                    <input type="checkbox" class="order-cb" data-idx="${i}" checked>
                    <span class="checkmark"></span>
                </label>
            </td>
            <td>${o.seq_no}</td>
            <td>${o.order_date || '-'}</td>
            <td>${o.listing_date || '-'}</td>
            <td>${o.description || 'Order'}</td>
        `;
        ordersBody.appendChild(tr);
    });
    
    ordersCard.classList.remove('hidden');
    updateSelectedCount();
    
    document.querySelectorAll('.order-cb').forEach(cb => {
        cb.addEventListener('change', updateSelectedCount);
    });
}

selectAll.addEventListener('change', (e) => {
    document.querySelectorAll('.order-cb').forEach(cb => {
        cb.checked = e.target.checked;
    });
    updateSelectedCount();
});

function updateSelectedCount() {
    const count = document.querySelectorAll('.order-cb:checked').length;
    selectedCount.textContent = count;
    downloadBtn.disabled = count === 0;
}

resetBtn.addEventListener('click', () => {
    searchForm.reset();
    casesCard.classList.add('hidden');
    ordersCard.classList.add('hidden');
    searchError.classList.add('hidden');
    resetBtn.classList.add('hidden');
});

// Download Logic
downloadBtn.addEventListener('click', async () => {
    const selectedIndices = Array.from(document.querySelectorAll('.order-cb:checked')).map(cb => parseInt(cb.dataset.idx));
    const ordersToDownload = selectedIndices.map(i => allOrders[i]);
    
    if (ordersToDownload.length === 0) return;
    
    progressModal.classList.remove('hidden');
    progTotal.textContent = ordersToDownload.length;
    progDone.textContent = '0';
    progFailed.textContent = '0';
    progressBar.style.width = '10%'; // indeterminate start
    progressText.textContent = 'Starting download and merge process...';
    
    try {
        const res = await fetch('/api/download-and-merge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                orders: ordersToDownload, 
                session_cookie: sessionCookie,
                caseInfo: currentCaseInfo
            })
        });
        
        const data = await res.json();
        progressModal.classList.add('hidden');
        
        if (data.success) {
            finalPdfDataUrl = data.mergedFile;
            completeModal.classList.remove('hidden');
            
            if (data.errors && data.errors.length > 0) {
                failedOrdersContainer.classList.remove('hidden');
                failedOrdersList.innerHTML = data.errors.map(e => `<li>Order ${e.index} (${e.date}): ${e.error}</li>`).join('');
            } else {
                failedOrdersContainer.classList.add('hidden');
            }
        } else {
            alert('Failed: ' + data.error);
        }
    } catch (err) {
        progressModal.classList.add('hidden');
        alert('Error: ' + err.message);
    }
});

savePdfBtn.addEventListener('click', () => {
    if (!finalPdfDataUrl) return;
    const a = document.createElement('a');
    a.href = finalPdfDataUrl;
    a.download = `NCLT_Orders_${currentCaseInfo}_${new Date().getTime()}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
});

// Utils
const SEARCH_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>';
const SPINNER_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spin"><path d="M21 12a9 9 0 1 1-6.2-8.6"/></svg>';

function setLoading(isLoading) {
    if (isLoading) {
        searchBtn.disabled = true;
        searchBtn.innerHTML = `${SPINNER_ICON} Searching...`;
    } else {
        searchBtn.disabled = false;
        searchBtn.innerHTML = `${SEARCH_ICON} Find Orders`;
    }
}

function showError(msg) {
    searchError.textContent = msg;
    searchError.classList.remove('hidden');
}

// ==================== STOCKPULSE APPLICATION ====================
// Data Layer
const watchlistMock = [
    { symbol: 'AAPL', name: 'Apple Inc.', price: 175.34, mcap: 2850, pe: 29.5, yield: 0.55, industry: 'Tech' },
    { symbol: 'MSFT', name: 'Microsoft', price: 420.72, mcap: 3120, pe: 35.2, yield: 0.85, industry: 'Tech' },
    { symbol: 'NVDA', name: 'NVIDIA', price: 950.23, mcap: 2350, pe: 72.4, yield: 0.05, industry: 'Tech' },
    { symbol: 'JPM', name: 'JPMorgan', price: 198.45, mcap: 572, pe: 12.1, yield: 2.4, industry: 'Finance' },
    { symbol: 'XOM', name: 'Exxon', price: 118.32, mcap: 465, pe: 13.2, yield: 3.5, industry: 'Energy' },
    { symbol: 'SAP', name: 'SAP SE', price: 182.20, mcap: 215, pe: 23.1, yield: 1.6, industry: 'Tech' },
];

const screenerWorldwide = [
    { symbol: 'BP', name: 'BP plc', mcap: 98, pe: 8.7, yield: 4.2, industry: 'Energy' },
    { symbol: 'HSBC', name: 'HSBC', mcap: 152, pe: 10.2, yield: 3.9, industry: 'Finance' },
    { symbol: 'NVO', name: 'Novo Nordisk', mcap: 540, pe: 38.5, yield: 1.1, industry: 'Healthcare' },
    { symbol: 'TSM', name: 'TSMC', mcap: 620, pe: 24.3, yield: 1.7, industry: 'Tech' },
    { symbol: 'SHEL', name: 'Shell', mcap: 210, pe: 11.5, yield: 3.8, industry: 'Energy' },
    { symbol: 'UL', name: 'Unilever', mcap: 130, pe: 18.4, yield: 3.2, industry: 'Consumer' },
    { symbol: 'SONY', name: 'Sony Group', mcap: 108, pe: 17.2, yield: 0.6, industry: 'Tech' },
];

const allStocks = [...watchlistMock, ...screenerWorldwide];

// Alert System
let alerts = [
    { symbol: 'AAPL', target: 180, direction: 'above', triggered: false },
    { symbol: 'MSFT', target: 410, direction: 'below', triggered: true },
    { symbol: 'NVDA', target: 1000, direction: 'above', triggered: false },
];

// ==================== CORE FUNCTIONS ====================

// Check alerts and trigger notifications
function checkAlertsAndNotify() {
    let flagMessages = [];
    alerts.forEach(alert => {
        const stock = watchlistMock.find(s => s.symbol === alert.symbol);
        if (!stock) return;
        
        const price = stock.price;
        let triggered = false;
        
        if (alert.direction === 'above' && price > alert.target) triggered = true;
        if (alert.direction === 'below' && price < alert.target) triggered = true;
        
        if (triggered && !alert.triggered) {
            alert.triggered = true;
            flagMessages.push(`${alert.symbol} ${alert.direction} ${alert.target}`);
            
            // Browser notification
            if (Notification.permission === 'granted') {
                new Notification(`StockPulse Alert: ${alert.symbol}`, { 
                    body: `Price $${price.toFixed(2)} triggered ${alert.direction} target of $${alert.target}` 
                });
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission();
            }
        } else if (!triggered) {
            alert.triggered = false;
        }
    });
    
    renderWatchlist();
    updateAlertFlags();
}

// Update alert flags display
function updateAlertFlags() {
    const flagsContainer = document.getElementById('alert-flags');
    if (flagsContainer) {
        const triggeredAlerts = alerts.filter(a => a.triggered);
        if (triggeredAlerts.length > 0) {
            flagsContainer.innerHTML = triggeredAlerts.map(a => `🔔 ${a.symbol} triggered`).join(' · ');
        } else {
            flagsContainer.innerHTML = 'no active flags';
        }
    }
}

// Render watchlist with alert inputs
function renderWatchlist() {
    const container = document.getElementById('watchlist-container');
    if (!container) return;
    
    let html = '';
    watchlistMock.forEach(s => {
        const alertObj = alerts.find(a => a.symbol === s.symbol) || { target: '', direction: 'above', triggered: false };
        const flag = alertObj.triggered ? '<span class="flag-active"><i class="fas fa-flag"></i> TRIGGERED</span>' : '';
        
        html += `<div class="stock-row">
            <span class="stock-symbol">${s.symbol}</span>
            <span class="stock-price">$${s.price.toFixed(2)}</span>
            <div class="alert-config">
                <input type="number" id="target-${s.symbol}" placeholder="target" value="${alertObj.target || ''}" style="width:80px;">
                <select id="dir-${s.symbol}">
                    <option value="above" ${alertObj.direction === 'above' ? 'selected' : ''}>⬆ above</option>
                    <option value="below" ${alertObj.direction === 'below' ? 'selected' : ''}>⬇ below</option>
                </select>
                <button class="btn-small" onclick="setAlert('${s.symbol}')">Set</button>
                ${flag}
            </div>
        </div>`;
    });
    
    container.innerHTML = html;
}

// Set alert for a symbol (global function)
window.setAlert = function(symbol) {
    const target = parseFloat(document.getElementById(`target-${symbol}`).value);
    const dir = document.getElementById(`dir-${symbol}`).value;
    
    if (isNaN(target)) return;
    
    const existing = alerts.find(a => a.symbol === symbol);
    if (existing) {
        existing.target = target;
        existing.direction = dir;
        existing.triggered = false;
    } else {
        alerts.push({ symbol, target, direction: dir, triggered: false });
    }
    
    renderWatchlist();
};

// Render screener table with filters
function renderScreener() {
    const tbody = document.getElementById('screenerBody');
    if (!tbody) return;
    
    // Get filter values
    const mcapRange = document.getElementById('mcapFilter')?.value.split('-') || [0, 5000];
    const minMcap = parseFloat(mcapRange[0]) || 0;
    const maxMcap = parseFloat(mcapRange[1]) || 5000;
    
    const peRange = document.getElementById('peFilter')?.value.split('-') || [0, 100];
    const minPe = parseFloat(peRange[0]) || 0;
    const maxPe = parseFloat(peRange[1]) || 100;
    
    const minYield = parseFloat(document.getElementById('divFilter')?.value) || 0;
    const indFilter = document.getElementById('industryFilter')?.value || '';
    
    // Apply filters
    let filtered = allStocks.filter(s => {
        return (s.mcap >= minMcap && s.mcap <= maxMcap) && 
               (s.pe >= minPe && s.pe <= maxPe) && 
               (s.yield >= minYield) && 
               (indFilter === '' || s.industry === indFilter);
    });
    
    // Generate table rows
    let rows = '';
    filtered.forEach(s => {
        rows += `<tr>
            <td>${s.symbol}</td>
            <td>${s.name || s.symbol}</td>
            <td>$${s.mcap}B</td>
            <td>${s.pe}</td>
            <td>${s.yield}%</td>
            <td>${s.industry || '—'}</td>
            <td><a href="#" class="detail-link" onclick="showStockDetail('${s.symbol}')">view</a></td>
        </tr>`;
    });
    
    tbody.innerHTML = rows;
}

// Show stock detail page
window.showStockDetail = function(sym) {
    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
    
    // Show stock detail page
    document.getElementById('stockdetail').classList.add('active-page');
    
    // Update header
    const detailHeader = document.querySelector('#stockdetail h2');
    if (detailHeader) {
        detailHeader.innerHTML = `<i class="fas fa-microchip"></i> stock detail: ${sym} (live AI sentiment)`;
    }
    
    // Update sentiment box with random data
    const sentiBox = document.getElementById('aiSentimentBox');
    if (sentiBox) {
        const r = Math.random() * 100;
        const sentimentClass = r > 60 ? 'bullish' : (r < 40 ? 'bearish' : 'neutral');
        const sentimentText = r > 60 ? 'Bullish' : (r < 40 ? 'Bearish' : 'Neutral');
        
        sentiBox.innerHTML = `🧠 Analysing 2,100+ global news headlines: ${r > 50 ? 'bullish product catalysts' : 'bearish macro concerns'}. Score: ${r.toFixed(0)}% bullish. 
            <span class="sentiment-badge ${sentimentClass}">${sentimentText} ${r > 60 ? '↑' : (r < 40 ? '↓' : '→')}</span>`;
    }
};

// Render dividends calendar
function renderDividends() {
    const divContainer = document.getElementById('dividendList');
    if (!divContainer) return;
    
    const mockDividends = [
        { symbol: 'AAPL', exDate: '2025-05-10', payout: 0.24, amount: 24 },
        { symbol: 'MSFT', exDate: '2025-05-18', payout: 0.68, amount: 68 },
        { symbol: 'JPM', exDate: '2025-04-28', payout: 1.05, amount: 105 },
        { symbol: 'XOM', exDate: '2025-05-22', payout: 0.95, amount: 95 },
        { symbol: 'SHEL', exDate: '2025-06-02', payout: 0.72, amount: 72 },
    ];
    
    let html = '';
    mockDividends.forEach(d => {
        html += `<div class="dividend-item">
            <span><b>${d.symbol}</b> ex: ${d.exDate}</span>
            <span>$${d.payout}/share · projected: $${d.amount}</span>
        </div>`;
    });
    
    divContainer.innerHTML = html;
}

// Initialize charts
function initCharts() {
    // Portfolio vs S&P 500 chart
    const ctx1 = document.getElementById('portfolioChart')?.getContext('2d');
    if (ctx1) {
        new Chart(ctx1, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [
                    { 
                        label: 'Portfolio', 
                        data: [100, 108, 115, 112, 125, 138], 
                        borderColor: '#2563eb', 
                        tension: 0.2,
                        fill: false
                    },
                    { 
                        label: 'S&P 500', 
                        data: [100, 104, 107, 110, 118, 122], 
                        borderColor: '#64748b', 
                        tension: 0.2,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    // Sector allocation chart
    const ctx2 = document.getElementById('sectorChart')?.getContext('2d');
    if (ctx2) {
        new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: ['Tech 58%', 'Finance 22%', 'Energy 15%', 'Other 5%'],
                datasets: [{ 
                    data: [58, 22, 15, 5], 
                    backgroundColor: ['#3b82f6', '#f59e0b', '#10b981', '#94a3b8'] 
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

// Random walk price simulation
function randomWalkPrice() {
    watchlistMock.forEach(s => {
        let change = (Math.random() - 0.48) * 2; // slight drift
        s.price = Math.max(1, s.price + change);
    });
    
    checkAlertsAndNotify();
    renderWatchlist();
}

// Navigation setup
function setupNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Update active button
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show selected page
            const pageId = btn.getAttribute('data-page');
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
            document.getElementById(pageId).classList.add('active-page');
            
            // Refresh page-specific content
            if (pageId === 'screener') renderScreener();
            if (pageId === 'dividends') renderDividends();
        });
    });
}

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', function() {
    // Request notification permission
    if (Notification.permission === 'default') {
        Notification.requestPermission();
    }
    
    // Initialize all components
    renderWatchlist();
    renderScreener();
    renderDividends();
    initCharts();
    updateAlertFlags();
    setupNavigation();
    
    // Set up event listeners
    document.getElementById('applyScreener')?.addEventListener('click', renderScreener);
    
    // Start 60-second interval for price updates
    setInterval(randomWalkPrice, 60000);
    
    // Initial price check
    randomWalkPrice();
    
    // Make renderScreener available globally
    window.renderScreener = renderScreener;
});

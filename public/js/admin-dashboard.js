// ===================================
// Admin Dashboard Logic
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    // Only load what we need for dashboard
    // We need Orders (for stats), Settings (for formatting), Meals (maybe for names if missing in orders)
    initializeData({ orders: true, settings: true, meals: true }).then(() => {
        initDashboard();
    });
});

let revenueChartInstance = null;

async function initDashboard() {
    loadDashboardStats();
    loadMonthlyChart();
    loadTopSellingMealsList();
    
    // Auto-refresh every 5 seconds
    if (!window.ordersPollInterval) {
        window.ordersPollInterval = setInterval(async () => {
            if (typeof refreshOrders === 'function') {
                const oldOrders = JSON.stringify(getOrders());
                // refreshOrders is in data.js
                await refreshOrders();
                const newOrders = getOrders();
                
                if (JSON.stringify(newOrders) !== oldOrders) {
                    loadDashboardStats();
                    loadMonthlyChart();
                    loadTopSellingMealsList();
                }
            }
        }, 5000);
    }
}

function loadDashboardStats() {
    const orders = getOrders();
    // getOrderStats is in orders.js
    const stats = getOrderStats(); 
    
    const preparingCount = orders.filter(o => o.status === 'preparing').length;
    const readyCount = orders.filter(o => o.status === 'ready').length;
    
    const container = document.getElementById('statsGridEnhanced');
    if (container) {
        container.innerHTML = `
            <!-- 1. Total Orders -->
            <div class="stat-card-soft">
                <div class="stat-icon-soft total-icon">📦</div>
                <div class="stat-content">
                    <div class="stat-value">${stats.total}</div>
                    <div class="stat-label">إجمالي الطلبات</div>
                </div>
            </div>

            <!-- 2. Preparing -->
            <div class="stat-card-soft">
                <div class="stat-icon-soft preparing-icon">👨‍🍳</div>
                <div class="stat-content">
                    <div class="stat-value">${preparingCount}</div>
                    <div class="stat-label">قيد التحضير</div>
                </div>
            </div>

            <!-- 3. Ready -->
            <div class="stat-card-soft">
                <div class="stat-icon-soft ready-icon">🔔</div>
                <div class="stat-content">
                    <div class="stat-value">${readyCount}</div>
                    <div class="stat-label">جاهز للاستلام</div>
                </div>
            </div>

            <!-- 4. Today Revenue -->
            <div class="stat-card-soft">
                <div class="stat-icon-soft revenue-icon">💰</div>
                <div class="stat-content">
                    <div class="stat-value">${formatPrice(stats.todayRevenue)}</div>
                    <div class="stat-label">دخل اليوم</div>
                </div>
            </div>

            <!-- 5. Month Revenue -->
            <div class="stat-card-soft">
                <div class="stat-icon-soft month-icon">📅</div>
                <div class="stat-content">
                    <div class="stat-value">${formatPrice(stats.monthRevenue)}</div>
                    <div class="stat-label">دخل الشهر</div>
                </div>
            </div>
        `;
    }
    
    // Update sidebar badges if elements exist (e.g., if we are using the common sidebar)
    updateSidebarBadges(orders);
}

function updateSidebarBadges(orders) {
    const activeOrdersCount = orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length;
    const badge = document.getElementById('newOrdersBadge');
    if (badge) {
        if (activeOrdersCount > 0) {
            badge.textContent = activeOrdersCount;
            badge.style.display = 'inline-block';
            badge.classList.add('pulse-animation');
        } else {
            badge.style.display = 'none';
            badge.classList.remove('pulse-animation');
        }
    }
    
    // Ratings Badge
    const ratedOrders = orders.filter(o => o.rating > 0);
    if (ratedOrders.length > 0) {
        const seenIds = (() => {
            try { return JSON.parse(localStorage.getItem('seenRatingIds') || '[]'); } catch(e) { return []; }
        })();
        const newRatings = ratedOrders.filter(o => !seenIds.includes(o.id.toString()));
        
        const rBadge = document.getElementById('newRatingsBadge');
        if (rBadge) {
            if (newRatings.length > 0) {
                rBadge.textContent = newRatings.length;
                rBadge.style.display = 'inline-block';
                rBadge.classList.add('pulse-animation');
            } else {
                rBadge.style.display = 'none';
                rBadge.classList.remove('pulse-animation');
            }
        }
    }
}

function loadMonthlyChart() {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;
    
    const orders = getOrders().filter(o => o.status === 'delivered');
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const labels = [];
    const data = [];
    
    const dailyRevenue = new Array(daysInMonth + 1).fill(0);
    
    orders.forEach(order => {
        const d = new Date(order.createdAt);
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
            dailyRevenue[d.getDate()] += order.total;
        }
    });

    const currentDay = today.getDate();
    for (let i = 1; i <= currentDay; i++) {
        labels.push(i);
        data.push(dailyRevenue[i]);
    }

    if (revenueChartInstance) {
        revenueChartInstance.data.labels = labels;
        revenueChartInstance.data.datasets[0].data = data;
        revenueChartInstance.update();
    } else {
        revenueChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'الدخل (دج)',
                    data: data,
                    borderColor: '#F97316',
                    backgroundColor: 'rgba(249, 115, 22, 0.1)',
                    borderWidth: 2,
                    pointRadius: 3,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#F97316',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return context.parsed.y + ' دج';
                            }
                        }
                    }
                },
                scales: {
                    x: { grid: { display: false }, ticks: { font: { family: 'Tajawal' } } },
                    y: { beginAtZero: true, grid: { color: '#f3f4f6' }, ticks: { font: { family: 'Tajawal' } } }
                }
            }
        });
    }
}

function loadTopSellingMealsList() {
    const container = document.getElementById('topSellingMealsList');
    if (!container) return;
    
    // getPopularMeals in orders.js
    const topMeals = getPopularMeals('today');
    
    if (topMeals.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 30px; color: #9ca3af; background: white; border-radius: 12px; border: 1px dashed #e5e7eb;">
                <div style="font-size: 2rem; margin-bottom: 10px;">📊</div>
                <p>لا توجد بيانات كافية بعد</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = topMeals.map((meal, index) => {
        let rankDisplay = `<span style="font-weight: 800; color: #9ca3af;">#${index + 1}</span>`;
        if(index === 0) rankDisplay = '<span style="font-size: 1.5rem;">🥇</span>';
        if(index === 1) rankDisplay = '<span style="font-size: 1.5rem;">🥈</span>';
        if(index === 2) rankDisplay = '<span style="font-size: 1.5rem;">🥉</span>';
        
        return `
            <div class="action-order-card">
                <div class="action-card-info" style="min-width: 50px; align-items: center; justify-content: center;">
                    ${rankDisplay}
                </div>
                
                <div class="action-details">
                    <div style="font-weight: 700; color: var(--text-main); font-size: 1rem;">${meal.name}</div>
                    ${meal.sizeName ? `<div style="font-size: 0.85rem; color: var(--text-muted);">${meal.sizeName}</div>` : ''}
                </div>
                
                <div style="display: flex; flex-direction: column; align-items: flex-end;">
                     <span class="action-status status-ready-soft" style="background: #E0F2FE; color: #0284C7; border: 1px solid #BAE6FD;">
                        ${meal.count} طلب
                    </span>
                    <span style="font-size: 0.8rem; color: #9ca3af; margin-top: 4px;">
                        ${formatPrice(meal.revenue)}
                    </span>
                </div>
            </div>
        `;
    }).join('');
}

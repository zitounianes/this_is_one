// =====================================================
// Admin Core Logic (Shared across all admin pages)
// =====================================================

document.addEventListener('DOMContentLoaded', async () => {
    checkLogin();
    await loadSidebar();
    highlightSidebar();
});

async function loadSidebar() {
    const container = document.getElementById('sidebar-container');
    if (!container) return;
    
    try {
        const response = await fetch('admin-sidebar.html');
        const html = await response.text();
        container.innerHTML = html;
        
        // Start badge updates
        startBadgeUpdates();
    } catch (error) {
        console.error('Error loading sidebar:', error);
    }
}

function startBadgeUpdates() {
    const updateBadges = () => {
        if (typeof getOrders !== 'function') return;
        
        const orders = getOrders();
        const newOrdersCount = orders.filter(o => o.status === 'new').length;
        
        const badge = document.getElementById('newOrdersBadge');
        if (badge) {
            if (newOrdersCount > 0) {
                badge.textContent = newOrdersCount;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        }
    };

    // Initial update
    updateBadges();

    // Listen for data updates from data.js
    document.addEventListener('orders-updated', updateBadges);
    document.addEventListener('data-ready', updateBadges);
    
    // Background refresh every 30 seconds if not already polling (like in admin-orders.js)
    // Only start a global interval if we are NOT on the orders page 
    // to avoid double polling, though refreshOrders handles concurrency well.
    if (!window.location.pathname.includes('admin-orders.html')) {
        setInterval(async () => {
            if (typeof refreshOrders === 'function') {
                await refreshOrders();
            }
        }, 30000);
    }
}

function checkLogin() {
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn');
    const isLoginPage = window.location.href.includes('admin-login.html');
    
    if (!isLoggedIn && !isLoginPage) {
        // Use replace to prevent back button history
        window.location.replace('admin-login.html');
    } else if (isLoggedIn && isLoginPage) {
        window.location.replace('admin-dashboard.html');
    }
}

function handleLogout() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        sessionStorage.removeItem('adminLoggedIn');
        window.location.href = 'admin-login.html';
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('open');
}

function highlightSidebar() {
    const path = window.location.pathname;
    const navItems = {
        'admin-dashboard.html': 'nav-dashboard',
        'admin-orders.html': 'nav-orders',
        'admin-meals.html': 'nav-meals',
        'admin-categories.html': 'nav-categories',
        'admin-ratings.html': 'nav-ratings',
        'admin-settings.html': 'nav-settings'
    };
    
    // Default to dashboard check if we are on 'admin.html' acting as dashboard
    if (path.endsWith('admin.html')) {
        const el = document.getElementById('nav-dashboard');
        if (el) el.classList.add('active');
        return;
    }

    // Find key that matches current path
    const currentPage = Object.keys(navItems).find(key => path.includes(key));
    if (currentPage) {
        const id = navItems[currentPage];
        const el = document.getElementById(id);
        if (el) {
            // Remove active from all first
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            el.classList.add('active');
        }
    }
}

// Global error handler for fetch calls to redirect to login on 401
window.addEventListener('unhandledrejection', function(event) {
    if (event.reason && event.reason.status === 401) {
        sessionStorage.removeItem('adminLoggedIn');
        window.location.href = 'admin-login.html';
    }
});

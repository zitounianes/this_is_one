// ===================================
// Admin Orders Logic
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    // Only load orders and settings
    initializeData({ orders: true, settings: true }).then(() => {
        renderOrders();
        
        // Auto-refresh orders
        setInterval(async () => {
            if (typeof refreshOrders === 'function') {
                const oldOrders = JSON.stringify(getOrders());
                await refreshOrders();
                const newOrders = getOrders();
                if (JSON.stringify(newOrders) !== oldOrders) {
                    renderOrders();
                }
            }
        }, 5000);
    });
    
    // Setup Filter Tabs
    const tabs = document.querySelectorAll('.orders-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            currentOrderFilter = tab.dataset.status;
            renderOrders();
        });
    });
});

let currentOrderFilter = 'new'; // 'new', 'preparing', 'ready', 'delivered', 'cancelled', 'all'

function renderOrders() {
    const container = document.getElementById('ordersList');
    if (!container) return;
    
    let orders = getOrders();
    
    // Update tabs UI
    const tabs = document.querySelectorAll('.orders-tab');
    tabs.forEach(tab => {
        if (tab.dataset.status === currentOrderFilter) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Filter
    if (currentOrderFilter !== 'all') {
        orders = orders.filter(o => o.status === currentOrderFilter);
    }
    
    // Check Alerts (Moved from dashboard logic if we want alerts here too)
    // For now skipping duplicate alert logic to keep it simple
    
    if (orders.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #9ca3af;">
                <div style="font-size: 3rem; margin-bottom: 10px;">📦</div>
                <p>لا توجد طلبات في هذه القائمة</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = orders.map(order => {
        const statusText = getStatusText(order.status);
        const statusColor = getStatusColor(order.status);
        
        let actionButtons = '';
        if (order.status === 'new') {
            actionButtons = `
                <button class="btn-status-action next" onclick="updateStatus('${order.id}', 'preparing')">بدء التحضير</button>
                <button class="btn-status-action prev" onclick="cancelOrderBtn('${order.id}')">إلغاء</button>
            `;
        } else if (order.status === 'preparing') {
            actionButtons = `
                <button class="btn-status-action prev" onclick="updateStatus('${order.id}', 'new')" title="رجوع للحالة السابقة">↩️</button>
                <button class="btn-status-action next" onclick="updateStatus('${order.id}', 'ready')">جاهز</button>
            `;
        } else if (order.status === 'ready') {
            actionButtons = `
                <button class="btn-status-action prev" onclick="updateStatus('${order.id}', 'preparing')" title="رجوع للحالة السابقة">↩️</button>
                <button class="btn-status-action next" onclick="updateStatus('${order.id}', 'delivered')">تم التسليم</button>
            `;
        } else if (order.status === 'delivered') {
            actionButtons = `
                <button class="btn-status-action prev" onclick="safeUpdateStatus('${order.id}', 'ready', 'delivered')" title="رجوع للحالة السابقة">↩️ تراجع</button>
            `;
        }
        
        // Count items
        const itemsCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
        
        return `
            <div class="order-card-row">
                <div class="order-row-start">
                    <div class="order-number">#${order.orderNumber}</div>
                    <div class="order-status-badge" style="background: ${statusColor}20; color: ${statusColor};">
                        <span class="status-dot" style="background: ${statusColor};"></span>
                        ${statusText}
                    </div>
                </div>
                
                <div class="order-row-middle">
                    <div class="customer-info">
                        <h4>
                            ${order.customerName}
                            <span class="order-type-badge ${order.orderType === 'delivery' ? 'type-delivery' : 'type-dinein'}">
                                ${order.orderType === 'delivery' ? '🛵 توصيل' : '🍽️ طاولة'}
                            </span>
                        </h4>
                        <p>
                            <span>📞 ${order.customerPhone}</span>
                            <span>⏰ ${new Date(order.createdAt).toLocaleTimeString('ar-DZ', {hour:'2-digit', minute:'2-digit'})}</span>
                        </p>
                    </div>
                    <div style="flex: 1; color: #6b7280; font-size: 0.95rem; font-weight: 600; display: flex; align-items: center; gap: 6px;">
                        <span>📦</span> ${itemsCount} منتجات
                    </div>
                </div>
                
                <div class="order-row-end">
                    <div class="order-total">${formatPrice(order.total)}</div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn-order-view" onclick="viewOrderDetails('${order.id}')">👁️</button>
                        ${actionButtons}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function safeUpdateStatus(orderId, newStatus, currentStatus) {
    if (currentStatus === 'delivered') {
        if (!confirm('⚠️ تنبيه: هل أنت متأكد من التراجع عن حالة "تم التسليم"؟\n\nسيتم إعادة الطلب إلى قائمة "جاهز للاستلام".')) {
            return;
        }
    }
    updateStatus(orderId, newStatus);
}

// Ensure updateStatus uses the one from orders.js or defined here?
// orders.js has updateOrderStatus(id, status).
async function updateStatus(orderId, status) {
    // updateOrderStatus is in orders.js
    if (await updateOrderStatus(orderId, status)) {
        showToast(`تم تغيير حالة الطلب إلى ${getStatusText(status)}`, 'success');
        renderOrders();
    } else {
        showToast('فشل تغيير الحالة', 'error');
    }
}

async function cancelOrderBtn(orderId) {
    // cancelOrder is in orders.js
    if (confirm('هل أنت متأكد من إلغاء هذا الطلب؟')) {
        const success = await cancelOrder(orderId);
        if (success) {
            showToast('تم إلغاء الطلب', 'success');
            renderOrders();
        }
    }
}

// =======================
// Modal & Details Logic
// =======================

function viewOrderDetails(orderId) {
    const order = getOrderById(orderId); // from orders.js
    if (!order) return;
    
    const modalBody = document.getElementById('orderModalBody');
    const itemsHtml = order.items.map(item => `
        <div class="modal-item-row">
            <div class="item-info">
                <span class="item-qty">${item.quantity}x</span>
                <div class="item-details">
                    <div class="item-name">${item.name}</div>
                    ${item.sizeName ? `<div class="item-size">${item.sizeName}</div>` : ''}
                </div>
            </div>
            <div class="item-price">${formatPrice(item.price * item.quantity)}</div>
        </div>
    `).join('');
    
    let locationButtons = '';
    if (order.location && order.location.lat && order.location.lng) {
        locationButtons = `
            <div class="location-actions">
                <button onclick="openLocationInMaps(${order.location.lat}, ${order.location.lng})" class="btn-location map">
                    <span>📍</span> فتح الخريطة
                </button>
                <button onclick="copyLocation(${order.location.lat}, ${order.location.lng})" class="btn-location copy">
                    <span>📋</span> نسخ
                </button>
            </div>
        `;
    } else if (order.orderType === 'delivery') {
        const addrText = order.address || '';
        const safeAddr = addrText.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        
        locationButtons = `
            <div class="location-actions">
                <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addrText)}" target="_blank" class="btn-location map" style="text-decoration:none;">
                    <span>📍</span> بحث في الخريطة
                </a>
                <button onclick="copyToClipboard('${safeAddr}')" class="btn-location copy">
                    <span>📋</span> ${addrText ? 'نسخ العنوان' : 'نسخ (فارغ)'}
                </button>
            </div>
        `;
    }
    
    const statusColor = getStatusColor(order.status); // orders.js
    const statusText = getStatusText(order.status); // orders.js

    modalBody.innerHTML = `
        <div class="order-details-container">
            <div class="order-details-header">
                <div class="order-id-badge">
                    <span class="label">رقم الطلب</span>
                    <span class="value">#${order.orderNumber}</span>
                </div>
                <div class="order-status-pill" style="background: ${statusColor}15; color: ${statusColor}; border: 1px solid ${statusColor}30;">
                    <span class="dot" style="background: ${statusColor};"></span>
                    ${statusText}
                </div>
            </div>

            <div class="details-card customer-card">
                <h4 class="card-title">👤 بيانات العميل</h4>
                <div class="info-row">
                    <span class="icon">👤</span>
                    <span class="text">${order.customerName}</span>
                </div>
                <div class="info-row">
                    <a href="tel:${order.customerPhone}" class="phone-link">
                        <span class="icon">📞</span>
                        <span class="text">${order.customerPhone}</span>
                    </a>
                </div>
                <div class="info-row">
                    <span class="icon">${order.orderType === 'delivery' ? '🛵' : '🍽️'}</span>
                    <span class="text" style="font-weight: bold; color: var(--primary);">
                        ${order.orderType === 'delivery' ? 'طلب توصيل' : 'تناول في المطعم'}
                    </span>
                </div>
                ${order.orderType === 'delivery' ? `
                <div class="info-row">
                    <span class="icon">📍</span>
                    <span class="text">${order.address || (order.location ? 'موقع محدد على الخريطة' : '⚠️ لا يوجد عنوان')}</span>
                </div>
                ` : ''}
                ${locationButtons}
            </div>

            ${order.notes ? `
            <div class="details-card notes-card">
                <h4 class="card-title">📝 ملاحظات</h4>
                <p class="notes-text">${order.notes}</p>
            </div>
            ` : ''}
            
            <div class="details-card items-card">
                <h4 class="card-title">🛍️ الطلب</h4>
                <div class="items-list">
                    ${itemsHtml}
                </div>
            </div>
            
            <div class="details-card summary-card">
                <div class="summary-row"><span>المجموع الفرعي</span><span>${formatPrice(order.subtotal)}</span></div>
                <div class="summary-row"><span>التوصيل</span><span>${formatPrice(order.deliveryCost)}</span></div>
                <div class="summary-divider"></div>
                <div class="summary-row total"><span>الإجمالي</span><span>${formatPrice(order.total)}</span></div>
            </div>

            <div class="modal-actions-footer">
                <button onclick="printOrder('${order.id}')" class="btn-print-order"><span>🖨️</span> طباعة الفاتورة</button>
            </div>
        </div>
    `;
    
    document.getElementById('orderModal').classList.add('active');
}

function closeOrderModal() {
    document.getElementById('orderModal').classList.remove('active');
}

function openLocationInMaps(lat, lng) {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, '_blank');
}

function copyLocation(lat, lng) {
    const mapsLink = `https://www.google.com/maps?q=${lat},${lng}`;
    copyToClipboard(mapsLink);
}

function printOrder(orderId) {
    const order = getOrderById(orderId);
    if (!order) return;
    
    const settings = getSettings();
    const printWindow = window.open('', '', 'width=400,height=600');
    
    const itemsHtml = order.items.map(item => `
        <tr class="item-row">
            <td style="vertical-align: top;">${item.quantity}x</td>
            <td class="item-name"><div>${item.name}</div>${item.sizeName ? `<div class="item-variant">${item.sizeName}</div>` : ''}</td>
            <td class="item-price">${formatPrice(item.price * item.quantity)}</td>
        </tr>
    `).join('');
    
    const html = `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>فاتورة #${order.orderNumber}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap');
                body { margin: 0; padding: 10px; font-family: 'Tajawal', sans-serif; font-size: 14px; max-width: 300px; margin: 0 auto; }
                .receipt-container { width: 100%; }
                .header { text-align: center; margin-bottom: 15px; }
                .logo { font-size: 30px; margin-bottom: 5px; }
                .store-name { font-size: 18px; font-weight: 800; margin: 5px 0; }
                .store-info { font-size: 12px; margin-bottom: 5px; }
                .separator { border-bottom: 1px dashed #000; margin: 10px 0; width: 100%; }
                .order-info { font-size: 13px; margin-bottom: 5px; }
                .customer-block { margin: 10px 0; padding: 5px 0; font-size: 13px; }
                table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                th { text-align: right; border-bottom: 1px solid #000; padding: 5px 0; font-size: 12px; }
                td { padding: 6px 0; vertical-align: top; }
                .item-name { padding-right: 5px; }
                .item-variant { font-size: 11px; color: #444; }
                .item-price { text-align: left; white-space: nowrap; }
                .totals { margin-top: 5px; }
                .total-row { display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 13px; }
                .grand-total { font-weight: 800; font-size: 16px; border-top: 1px solid #000; padding-top: 5px; margin-top: 5px; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; }
                @media print { @page { margin: 0; size: 80mm auto; } body { padding: 5px; max-width: 100%; } }
            </style>
        </head>
        <body>
            <div class="receipt-container">
                <div class="header">
                    <div class="logo">🍔</div>
                    <div class="store-name">${settings.name || 'Fast Food'}</div>
                    <div class="store-info">${settings.phone || ''}</div>
                    <div class="store-info">${new Date().toLocaleString('ar-DZ')}</div>
                </div>
                <div class="separator"></div>
                <div class="order-info">
                    <div style="font-weight: bold; font-size: 16px; text-align: center;">طلب #${order.orderNumber}</div>
                </div>
                
                <div class="customer-block">
                    <div><strong>${order.customerName}</strong></div>
                    <div>${order.customerPhone}</div>
                </div>
                
                <table>
                    <thead><tr><th style="width: 25px;">#</th><th>الصنف</th><th style="text-align: left; width: 60px;">السعر</th></tr></thead>
                    <tbody>${itemsHtml}</tbody>
                </table>
                
                <div class="separator"></div>
                
                <div class="totals">
                    <div class="total-row"><span>المجموع:</span><span>${formatPrice(order.subtotal)}</span></div>
                    ${order.deliveryCost > 0 ? `<div class="total-row"><span>التوصيل:</span><span>${formatPrice(order.deliveryCost)}</span></div>` : ''}
                    <div class="total-row grand-total"><span>الإجمالي:</span><span>${formatPrice(order.total)}</span></div>
                </div>
                
                <div class="footer"><div>شكراً لطلبك!</div></div>
            </div>
            <script>window.onload = function() { setTimeout(function() { window.print(); }, 500); }</script>
        </body>
        </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
}

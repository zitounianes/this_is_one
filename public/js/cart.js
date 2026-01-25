// =====================================================
// إدارة السلة - Cart Management
// =====================================================

// إضافة وجبة للسلة
function addToCart(mealId, selectedSize = null, quantity = 1) {
    // التحقق من حالة المطعم
    const settings = getSettings();
    if (settings && settings.isOpen === false) {
        showToast('عذراً، المطعم مغلق حالياً', 'error');
        return false;
    }

    const meals = getMeals();
    const meal = meals.find(m => m.id === mealId);
    
    if (!meal || !meal.active) {
        showToast('هذه الوجبة غير متوفرة حالياً', 'error');
        return false;
    }
    
    let price = meal.price;
    let sizeName = '';
    
    if (meal.hasSizes && meal.sizes.length > 0) {
        if (!selectedSize) {
            showToast('الرجاء اختيار الحجم', 'warning');
            return false;
        }
        const size = meal.sizes.find(s => s.name === selectedSize);
        if (size) {
            price = size.price;
            sizeName = size.name;
        }
    }
    
    const cart = getCart();
    
    // البحث عن نفس الوجبة بنفس الحجم
    const existingIndex = cart.findIndex(
        item => item.mealId === mealId && item.sizeName === sizeName
    );
    
    if (existingIndex > -1) {
        cart[existingIndex].quantity += quantity;
    } else {
        cart.push({
            id: generateId(),
            mealId: mealId,
            name: meal.name,
            sizeName: sizeName,
            price: price,
            quantity: quantity,
            image: meal.image
        });
    }
    
    saveCart(cart);
    updateCartUI();
    showToast('تمت الإضافة للسلة', 'success');
    return true;
}

// إزالة وجبة من السلة
function removeFromCart(itemId) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== itemId);
    saveCart(cart);
    updateCartUI();
    renderCart();
}

// تحديث كمية وجبة
function updateCartQuantity(itemId, newQuantity) {
    const cart = getCart();
    const item = cart.find(i => i.id === itemId);
    
    if (item) {
        if (newQuantity <= 0) {
            removeFromCart(itemId);
        } else {
            item.quantity = newQuantity;
            saveCart(cart);
            updateCartUI();
            renderCart();
        }
    }
}

// تفريغ السلة
function clearCart() {
    saveCart([]);
    updateCartUI();
    renderCart();
}

// حساب مجموع السلة
function getCartTotal() {
    const cart = getCart();
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// حساب عدد العناصر في السلة
function getCartItemCount() {
    const cart = getCart();
    return cart.reduce((count, item) => count + item.quantity, 0);
}

// تحديث واجهة السلة (العداد)
function updateCartUI() {
    const countElements = document.querySelectorAll('.cart-count');
    const count = getCartItemCount();
    
    countElements.forEach(el => {
        if (count > 0) {
            el.textContent = count;
            el.style.display = 'flex';
            el.classList.add('has-items');
        } else {
            el.textContent = ''; // Clear text to avoid flashing '0'
            el.style.display = 'none';
            el.classList.remove('has-items');
        }
    });
}

// عرض محتويات السلة
function renderCart() {
    const container = document.getElementById('cartItems');
    if (!container) return;
    
    const cart = getCart();
    const emptyCart = document.querySelector('.cart-empty');
    const cartContent = document.querySelector('.cart-content');
    
    if (cart.length === 0) {
        if (emptyCart) emptyCart.style.display = 'block';
        if (cartContent) cartContent.style.display = 'none';
        return;
    }
    
    if (emptyCart) emptyCart.style.display = 'none';
    if (cartContent) cartContent.style.display = 'block';
    
    container.innerHTML = cart.map(item => `
        <div class="cart-item" data-id="${item.id}">
            <div class="cart-item-image">
                ${item.image 
                    ? `<img src="${item.image}" alt="${item.name}">` 
                    : '<div class="meal-placeholder">🍽️</div>'}
            </div>
            <div class="cart-item-details">
                <h4 class="cart-item-name">${item.name}</h4>
                ${item.sizeName ? `<span class="cart-item-size">الحجم: ${item.sizeName}</span>` : ''}
                <div class="cart-item-actions">
                    <div class="quantity-control">
                        <button class="quantity-btn" onclick="updateCartQuantity('${item.id}', ${item.quantity - 1})">−</button>
                        <span class="quantity-value">${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateCartQuantity('${item.id}', ${item.quantity + 1})">+</button>
                    </div>
                    <button class="btn btn-icon btn-danger" onclick="removeFromCart('${item.id}')">🗑️</button>
                </div>
            </div>
            <div class="cart-item-price">${formatPrice(item.price * item.quantity)}</div>
        </div>
    `).join('');
    
    updateCartSummary();
}

// تحديث ملخص السلة
function updateCartSummary() {
    const subtotal = getCartTotal();
    const settings = getSettings();
    const deliveryCost = settings.delivery?.enabled ? calculateDeliveryCost(subtotal) : 0;
    const total = subtotal + deliveryCost;
    
    const subtotalEl = document.getElementById('cartSubtotal');
    const deliveryEl = document.getElementById('cartDelivery');
    const totalEl = document.getElementById('cartTotal');
    
    if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
    if (deliveryEl) {
        if (!settings.delivery?.enabled) {
            deliveryEl.textContent = 'غير متاح';
        } else if (settings.delivery.type === 'free') {
            deliveryEl.textContent = 'مجاني';
        } else if (settings.delivery.type === 'fixed') {
            deliveryEl.textContent = formatPrice(settings.delivery.fixedCost);
        } else if (settings.delivery.type === 'not_specified') {
            deliveryEl.textContent = 'غير محدد';
        } else if (settings.delivery.type === 'distance') {
             // If we have distance (from checkout page), we could calculate it, but here in cart we might not know it
             deliveryEl.textContent = 'يُحسب حسب المسافة';
        } else {
             deliveryEl.textContent = deliveryCost > 0 ? formatPrice(deliveryCost) : 'غير محدد';
        }
    }
    if (totalEl) {
         const isUnknown = settings.delivery?.type === 'distance' || settings.delivery?.type === 'not_specified';
         totalEl.textContent = formatPrice(total) + (isUnknown ? ' + التوصيل' : '');
    }
}

// تهيئة السلة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    updateCartUI();
});


// =====================================================
// إدارة البيانات - Data Management (Backend Integrated)
// =====================================================

// Global State
const appState = {
    categories: [],
    meals: [],
    settings: JSON.parse(localStorage.getItem('appSettings') || '{}'), // Load cached settings immediately
    orders: []
};

// ... (existing code)

// --- Settings ---

// Initial saveSettings removed to avoid duplicate declaration error
// See bottom of file for actual implementation

// Flags
let isDataInitialized = false;
let initPromise = null;

// ===================================
// Initialization
// ===================================

async function initializeData() {
    if (initPromise) return initPromise;
    
    initPromise = (async () => {
        try {
            console.log('🔄 Initializing Data from Backend...');
            
            // 1. Load data in parallel
            const [categories, meals, settings, orders] = await Promise.all([
                ApiClient.getCategories().catch(err => {
                    console.error('Failed to load categories', err);
                    return [];
                }),
                ApiClient.getMeals().catch(err => {
                    console.error('Failed to load meals', err);
                    return [];
                }),
                ApiClient.getSettings().catch(err => {
                     console.error('Failed to load settings', err);
                     return {};
                }),
                ApiClient.getOrders().catch(err => {
                    // Orders might fail for non-admin, just return empty
                    return [];
                })
            ]);
            
            // 2. Update State
            appState.categories = categories;
            appState.meals = meals;
            appState.settings = settings;

            // Polyfill orderNumber and normalize items for frontend compatibility
            appState.orders = orders.map(o => normalizeOrder(o));
            
            isDataInitialized = true;
            console.log('✅ Data Initialized', appState);
            
            // 3. Dispatch Event
            document.dispatchEvent(new CustomEvent('data-ready'));
            
            return true;
        } catch (error) {
            console.error('❌ Data Initialization Failed:', error);
            return false;
        }
    })();
    
    return initPromise;
}

// ===================================
// Getters (Sync Access to State)
// ===================================

function getCategories() {
    return appState.categories || [];
}

function getMeals() {
    return appState.meals || [];
}

function getSettings() {
    // Return with defaults if empty to avoid crashes
    return {
        restaurantName: null, // Default to null to avoid showing generic name
        currency: 'دج',
        isOpen: null, // Default to null to avoid flashing wrong status
        delivery: { enabled: true, type: 'fixed', fixedCost: 200 },
        ...appState.settings
    };
}

function getOrders() {
    return appState.orders || [];
}

// Cart is Client-Side Only
function getCart() {
    try {
        return JSON.parse(localStorage.getItem('cart') || '[]');
    } catch(e) {
        return [];
    }
}

// ===================================
// Data Mutation Methods (Async)
// ===================================

// --- Categories ---

async function createCategoryData(category) {
    // Optimistic Update
    appState.categories.push(category); 
    
    try {
        const saved = await ApiClient.saveCategory(category);
        const idx = appState.categories.indexOf(category);
        if (idx !== -1) appState.categories[idx] = saved;
        return saved;
    } catch (e) {
        console.error("Create Category Failed", e);
        return null;
    }
}

async function updateCategoryData(category) {
    const idx = appState.categories.findIndex(c => c.id === category.id);
    if (idx !== -1) appState.categories[idx] = category;
    
    try {
        return await ApiClient.saveCategory(category);
    } catch (e) {
        console.error("Update Category Failed", e);
        return null;
    }
}

async function deleteCategoryData(id) {
    if (!id) return; // Safety check
    
    const targetId = String(id); // Normalize to string for comparison
    
    // 1. Precise Identification: Find all meals strictly in this category
    // Using String() ensures we match "5" with 5
    const mealsToDelete = appState.meals.filter(m => String(m.categoryId) === targetId);
    
    // 2. Remove meals from local state (Keep only those NOT matching targetId)
    appState.meals = appState.meals.filter(m => String(m.categoryId) !== targetId);
    
    // 3. Remove category from local state
    appState.categories = appState.categories.filter(c => String(c.id) !== targetId);
    
    // 4. Update Backend
    try {
        // Manually delete the specific meals we identified
        const deleteMealPromises = mealsToDelete.map(meal => 
            ApiClient.request(`/meals?id=${meal.id}`, { method: 'DELETE' })
                .catch(err => console.error('Failed to delete meal ' + meal.id, err))
        );
        
        await Promise.all(deleteMealPromises);

        // Then delete the category ONLY (No cascade flag to prevent backend side-effects)
        // We have already handled the children manually.
        await ApiClient.request(`/categories?id=${id}`, { method: 'DELETE' });
        
    } catch(e) {
        console.error("Delete category failed", e);
    }
}

function saveCategories(categories) {
    console.warn("saveCategories (bulk) is deprecated. Use create/updateCategoryData instead.");
    appState.categories = categories; 
}


// --- Meals ---

async function createMealData(meal) {
    appState.meals.push(meal);
    try {
        const saved = await ApiClient.saveMeal(meal);
        const idx = appState.meals.indexOf(meal);
        if (idx !== -1) appState.meals[idx] = saved;
        return saved;
    } catch (e) { console.error(e); }
}

async function updateMealData(meal) {
    const idx = appState.meals.findIndex(m => m.id === meal.id);
    if (idx !== -1) appState.meals[idx] = meal;
    try {
        return await ApiClient.saveMeal(meal); // UPSERT
    } catch (e) { console.error(e); }
}

async function deleteMealData(id) {
    appState.meals = appState.meals.filter(m => m.id !== id);
    try {
         await ApiClient.request(`/meals?id=${id}`, { method: 'DELETE' });
    } catch (e) { console.error(e); }
}

function saveMeals(meals) {
    console.warn("saveMeals (bulk) is deprecated.");
    appState.meals = meals;
}

// --- Settings ---

async function updateSettingsData(settings) {
    // Merge with existing to prevent data loss
    const current = appState.settings || {};
    const updated = { ...current, ...settings };
    
    appState.settings = updated;
    localStorage.setItem('appSettings', JSON.stringify(updated));
    
    try {
        await ApiClient.saveSettings(updated);
        return updated;
    } catch (e) { 
        console.error("Save Settings Failed", e); 
        return null;
    }
}

// Alias for compatibility
const saveSettings = updateSettingsData;

// --- Orders ---

async function submitOrder(orderData) {
    try {
        const savedOrder = await ApiClient.createOrder(orderData);
        // Polyfill ID for frontend and normalize
        const normalized = normalizeOrder(savedOrder);
        
        appState.orders.unshift(normalized);
        return normalized;
    } catch (e) {
        console.error("Submit Order Failed", e);
        return null;
    }
}

// Helper to normalize backend order object to frontend structure
function normalizeOrder(order) {
    if (!order) return null;
    
    // Map items fields
    let items = [];
    if (order.items && Array.isArray(order.items)) {
        items = order.items.map(item => ({
            ...item,
            name: item.name || item.mealName || 'Unknown', // Map mealName to name
            sizeName: item.sizeName || item.size || ''     // Map size to sizeName
        }));
    }
    
    return {
        ...order,
        orderNumber: order.orderNumber || order.id,
        items: items
    };
}


async function updateOrderStatusData(orderId, status) {
    const order = appState.orders.find(o => o.id == orderId); // Loose equality for string/int IDs
    if (order) {
        order.status = status;
        // In a real app we would call PATCH /orders/:id
        // For now, assume logic exists or we implement it
        // ApiClient.updateOrderStatus(orderId, status); // Todo impl
        // Temporary: We are not implementing the API call here as requested by 'No Error' approach, 
        // rely on ApiClient.updateOrderStatus being present or ignored.
        // Actually, let's try to call it if it exists.
        try {
             if (ApiClient.updateOrderStatus) await ApiClient.updateOrderStatus(orderId, status);
             else await ApiClient.request(`/orders?id=${orderId}&status=${status}`, { method: 'PUT' });
        } catch(e) { console.error("Update Status Failed", e); }
    }
}

function saveOrders(orders) {
    // Mainly used by client-side logic previously
    appState.orders = orders;
}

async function refreshOrders() {
    try {
        const orders = await ApiClient.getOrders();
        appState.orders = orders.map(o => normalizeOrder(o));
        document.dispatchEvent(new CustomEvent('orders-updated'));
        return appState.orders;
    } catch (e) {
        console.error("Failed to refresh orders", e);
        return [];
    }
}

// --- Cart ---

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// ===================================
// Auto-Init logic
// ===================================
// We don't auto-run initializeData() to allow hooking events first, 
// OR we run it but UI must listen to 'data-ready'
initializeData();


// ===================================
// Admin Settings Logic
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    initializeData({ settings: true }).then(() => {
        loadSettings();
    });
});

function loadSettings() {
    const settings = getSettings();
    document.getElementById('settingName').value = settings.restaurantName || '';
    document.getElementById('settingPhone').value = settings.phone || '';
    document.getElementById('settingAddress').value = settings.address || '';
    
    // Checkboxes might need explicit handling if value is string "true" in some legacy cases, but assume boolean
    document.getElementById('settingIsOpen').checked = settings.isOpen;
    
    if (settings.delivery) {
        document.getElementById('settingDeliveryType').value = settings.delivery.type || 'fixed';
        document.getElementById('settingFixedCost').value = settings.delivery.fixedCost || 0;
        
        document.getElementById('settingCostPerKm').value = settings.delivery.costPerKm || 50;
        document.getElementById('settingMaxDistance').value = settings.delivery.maxDistance || 20;
        
        if (settings.location) {
            document.getElementById('settingRestLat').value = settings.location.lat || '';
            document.getElementById('settingRestLng').value = settings.location.lng || '';
        }
        
        toggleDeliveryType();
    }
}

function toggleDeliveryType() {
    const type = document.getElementById('settingDeliveryType').value;
    const fixedGroup = document.getElementById('fixedCostGroup');
    const distanceGroup = document.getElementById('distanceCostGroup');
    
    if (type === 'fixed') {
        fixedGroup.style.display = 'block';
        distanceGroup.style.display = 'none';
    } else if (type === 'distance') {
        fixedGroup.style.display = 'none';
        distanceGroup.style.display = 'block';
    } else {
        fixedGroup.style.display = 'none';
        distanceGroup.style.display = 'none';
    }
}

async function handleSaveSettings() {
    const submitBtn = document.querySelector('button[onclick="handleSaveSettings()"]');
    if (submitBtn) { submitBtn.textContent = '⏳ جاري الحفظ...'; submitBtn.disabled = true; }
    
    try {
        let settings = getSettings();
        
        // Basic Info
        settings.restaurantName = document.getElementById('settingName').value;
        settings.phone = document.getElementById('settingPhone').value;
        settings.address = document.getElementById('settingAddress').value;
        settings.isOpen = document.getElementById('settingIsOpen').checked;
        
        // Delivery
        if (!settings.delivery) settings.delivery = {};
        settings.delivery.enabled = true;
        settings.delivery.type = document.getElementById('settingDeliveryType').value;
        settings.delivery.fixedCost = parseFloat(document.getElementById('settingFixedCost').value) || 0;
        settings.delivery.costPerKm = parseFloat(document.getElementById('settingCostPerKm').value) || 0;
        settings.delivery.maxDistance = parseFloat(document.getElementById('settingMaxDistance').value) || 0;
        
        // Location
        const latInput = document.getElementById('settingRestLat').value;
        const lngInput = document.getElementById('settingRestLng').value;

        if (latInput && lngInput) {
            settings.location = { 
                lat: parseFloat(latInput), 
                lng: parseFloat(lngInput) 
            };
        } else {
            settings.location = null; 
        }

        // Save
        if (typeof updateSettingsData === 'function') {
            await updateSettingsData(settings);
            // Re-render handled by page reload or toast?
            // Usually settings update is silent regarding other parts unless needed.
        } else {
            // Fallback local
            localStorage.setItem('settings', JSON.stringify(settings));
        }
        
        showToast('تم حفظ الإعدادات بنجاح', 'success');
        
    } catch (e) {
        showToast('فشل حفظ الإعدادات: ' + e.message, 'error');
    } finally {
        if (submitBtn) { submitBtn.textContent = 'حفظ التغييرات'; submitBtn.disabled = false; }
    }
}

async function detectRestaurantLocation() {
    try {
        const btn = document.querySelector('button[onclick="detectRestaurantLocation()"]');
        const originalText = btn.innerHTML;
        btn.innerHTML = '⏳ جاري التحديد...';
        btn.disabled = true;
        
        // getCurrentLocation is in utils.js usually or admin needs it.
        // utils.js has getCurrentLocation if not I need to create it?
        // Let's assume utils.js has it or use navigator directly
        
        if (typeof getCurrentLocation === 'function') {
             const position = await getCurrentLocation();
             document.getElementById('settingRestLat').value = position.lat;
             document.getElementById('settingRestLng').value = position.lng;
             showToast('تم تحديد الموقع بنجاح', 'success');
        } else {
             // Basic implementation
             navigator.geolocation.getCurrentPosition(
                (pos) => {
                    document.getElementById('settingRestLat').value = pos.coords.latitude;
                    document.getElementById('settingRestLng').value = pos.coords.longitude;
                    showToast('تم تحديد الموقع بنجاح', 'success');
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                },
                (err) => {
                    throw err;
                }
             );
             return; // Async handling splits here
        }
        
        btn.innerHTML = originalText;
        btn.disabled = false;
    } catch (e) {
        showToast('فشل تحديد الموقع. يرجى السماح بالوصول للموقع.', 'error');
        const btn = document.querySelector('button[onclick="detectRestaurantLocation()"]');
        if(btn) { btn.innerHTML = '📍 تحديد موقعي الحالي'; btn.disabled = false; }
    }
}

async function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
        showToast('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    // Verify current (in real app, send to backend, here we check locally if loaded)
    const settings = getSettings();
    // Start with default if not set
    const storedPassword = settings.adminPassword || 'admin123'; 
    
    // If backend handles auth, we should call an API endpoint.
    // Assuming backend data.js handles updateSettingsData which saves it.
    // But verification of old password should ideally happen on backend.
    
    if (currentPassword !== storedPassword) {
        showToast('كلمة السر الحالية غير صحيحة', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showToast('كلمة السر الجديدة غير متطابقة', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showToast('كلمة السر يجب أن تكون 6 أحرف على الأقل', 'error');
        return;
    }
    
    settings.adminPassword = newPassword;
    
    if (typeof updateSettingsData === 'function') {
        await updateSettingsData(settings);
    } else {
        localStorage.setItem('settings', JSON.stringify(settings));
    }
    
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    
    showToast('تم تغيير كلمة السر بنجاح ✅', 'success');
}

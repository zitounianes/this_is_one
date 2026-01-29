// ===================================
// Admin Settings Logic (Modern)
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    initializeData({ settings: true }).then(() => {
        loadSettings();
    });
});

let originalSettings = null; // To track changes if needed

function loadSettings() {
    const settings = getSettings();
    originalSettings = JSON.stringify(settings); // Deep copy for comparison if needed

    // Basic Info
    setValue('settingName', settings.restaurantName);
    setValue('settingPhone', settings.phone);
    setValue('settingAddress', settings.address);
    setChecked('settingIsOpen', settings.isOpen);
    
    // Delivery
    if (settings.delivery) {
        const type = settings.delivery.type || 'fixed';
        const radio = document.querySelector(`input[name="deliveryType"][value="${type}"]`);
        if (radio) radio.checked = true;
        
        setValue('settingFixedCost', settings.delivery.fixedCost);
        setValue('settingCostPerKm', settings.delivery.costPerKm);
        setValue('settingMaxDistance', settings.delivery.maxDistance);
        
        /* Location UI Removed */
    }
    
    toggleDeliveryMode();
    setupChangeDetection();
}

function setValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = (val !== undefined && val !== null) ? val : '';
}

function setChecked(id, val) {
    const el = document.getElementById(id);
    if (el) el.checked = !!val;
}

function toggleDeliveryMode() {
    const selected = document.querySelector('input[name="deliveryType"]:checked');
    const type = selected ? selected.value : 'fixed';
    
    const fixedGroup = document.getElementById('fixedCostGroup');
    const distanceGroup = document.getElementById('distanceCostGroup');
    
    if (fixedGroup) fixedGroup.style.display = (type === 'fixed') ? 'block' : 'none';
    
    // Feature 'Distance Calculation' replaced by 'Unspecified', so we hide settings.
    if (distanceGroup) distanceGroup.style.display = 'none'; 
}

// detectRestaurantLocation Removed
// updateCoordsDisplay Removed - Logic cleaned from loadSettings below

async function handleSaveSettings() {
    const btn = document.querySelector('.btn-floating-save');
    const originalText = btn ? btn.innerHTML : 'حفظ';
    if (btn) {
        btn.innerHTML = `<svg class="animate-spin" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg> جاري الحفظ...`;
        btn.disabled = true;
    }
    
    try {
        let settings = getSettings() || {};
        
        // Basic Info
        settings.restaurantName = document.getElementById('settingName').value;
        settings.phone = document.getElementById('settingPhone').value;
        settings.address = document.getElementById('settingAddress').value;
        settings.isOpen = document.getElementById('settingIsOpen').checked;
        
        // Delivery
        if (!settings.delivery) settings.delivery = {};
        settings.delivery.enabled = true;
        
        const selectedType = document.querySelector('input[name="deliveryType"]:checked');
        settings.delivery.type = selectedType ? selectedType.value : 'fixed';
        
        settings.delivery.fixedCost = parseFloat(document.getElementById('settingFixedCost')?.value) || 0;
        
        // These inputs might be hidden/removed, so we use optional chaining or handle specific cases
        if (document.getElementById('settingCostPerKm')) {
            settings.delivery.costPerKm = parseFloat(document.getElementById('settingCostPerKm').value) || 0;
        }
        if (document.getElementById('settingMaxDistance')) {
            settings.delivery.maxDistance = parseFloat(document.getElementById('settingMaxDistance').value) || 0;
        }

        // Location - We preserve existing or set to null if intended, but UI is gone.
        // We do NOT update settings.location here as the inputs are removed.
        
        // Save
        if (typeof updateSettingsData === 'function') {
            await updateSettingsData(settings);
        } else {
            localStorage.setItem('settings', JSON.stringify(settings));
        }
        
        showToast('تم حفظ الإعدادات بنجاح', 'success');
        hideSaveBar();
        
    } catch (e) {
        showToast('فشل حفظ الإعدادات: ' + e.message, 'error');
        console.error(e);
    } finally {
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
}

function setupChangeDetection() {
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.addEventListener('input', showSaveBar);
        input.addEventListener('change', showSaveBar);
    });
}

function showSaveBar() {
    const bar = document.getElementById('saveBar');
    if (bar) bar.classList.add('visible');
}

function hideSaveBar() {
    const bar = document.getElementById('saveBar');
    if (bar) bar.classList.remove('visible');
}

function changePassword() {
     const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
        showToast('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    const settings = getSettings();
    const storedPassword = settings.adminPassword || 'admin123'; 
    
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
        updateSettingsData(settings); 
    } else {
        localStorage.setItem('settings', JSON.stringify(settings));
    }
    
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    
    showToast('تم تغيير كلمة السر بنجاح', 'success');
}

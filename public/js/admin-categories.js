// ===================================
// Admin Categories Logic
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    initializeData({ categories: true, meals: true }).then(() => {
        // We load meals too effectively for delete safety check (deleteCategoryData in data.js handles it, 
        // but frontend confirmation might want to know count? Admin.js said "Delete this category will delete all meals".
        renderCategories();
    });

    // Setup Category SVG Input
    const categoryIconInput = document.getElementById('categoryIconInput');
    if (categoryIconInput) {
        categoryIconInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                if (file.type !== 'image/svg+xml' && !file.name.toLowerCase().endsWith('.svg')) {
                    showToast('يرجى اختيار ملف SVG صحيح', 'error');
                    this.value = '';
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    const svgContent = e.target.result;
                    if (!svgContent.trim().startsWith('<svg') && !svgContent.includes('<svg')) {
                         showToast('الملف لا يحتوي على كود SVG صحيح', 'error');
                         return;
                    }
                    
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(svgContent, 'image/svg+xml');
                    const svgEl = doc.querySelector('svg');
                    
                    if (svgEl) {
                        svgEl.removeAttribute('width');
                        svgEl.removeAttribute('height');
                        svgEl.style.width = '100%';
                        svgEl.style.height = '100%';
                        svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
                        
                        const serializer = new XMLSerializer();
                        const newSvgContent = serializer.serializeToString(svgEl);
                        
                        document.getElementById('categoryIcon').value = newSvgContent;
                        
                        const preview = document.getElementById('categoryIconPreview');
                        preview.innerHTML = newSvgContent;
                        preview.style.display = 'flex';
                    } else {
                         showToast('ملف SVG غير صالح', 'error');
                    }
                }
                reader.readAsText(file);
            }
        });
    }
});

function renderCategories() {
    const container = document.getElementById('categoriesList');
    if (!container) return;
    
    const categories = getCategories();
    
    if (categories.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:20px;">لا يوجد أقسام حالياً</p>';
        return;
    }

    container.innerHTML = `
        <div class="categories-grid">
            ${categories.map(cat => `
                <div class="category-card-new ${!cat.active ? 'inactive' : ''}">
                    <div class="category-card-header">
                        <div class="status-light ${cat.active ? 'on' : 'off'}"></div>
                        <label class="switch">
                            <input type="checkbox" onchange="toggleCategoryActive(${cat.id})" ${cat.active ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                    </div>
                    
                    <div class="category-card-body">
                        <div class="category-icon-wrapper ${!cat.active ? 'dimmed' : ''}">
                            <span class="category-icon">${cat.icon}</span>
                        </div>
                        <h3 class="category-name">${cat.name}</h3>
                    </div>
                    
                    <div class="category-card-actions">
                        <button class="cat-btn cat-btn-edit" onclick="editCategory(${cat.id})">
                            ✏️ تعديل
                        </button>
                        <button class="cat-btn cat-btn-delete" onclick="deleteCategory(${cat.id})">
                            🗑️ حذف
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function openCategoryModal(id = null) {
    const form = document.getElementById('categoryForm');
    form.reset();
    document.getElementById('categoryId').value = '';
    document.getElementById('categoryIcon').value = '';
    
    const preview = document.getElementById('categoryIconPreview');
    preview.innerHTML = '';
    preview.style.display = 'none';
    
    const iconInput = document.getElementById('categoryIconInput');
    if (iconInput) iconInput.value = '';
    
    if (id) {
        const cat = getCategories().find(c => c.id === id);
        if (cat) {
            document.getElementById('categoryId').value = cat.id;
            document.getElementById('categoryName').value = cat.name;
            document.getElementById('categoryIcon').value = cat.icon;
            document.getElementById('categoryModalTitle').textContent = 'تعديل قسم';
            
            if (cat.icon) {
                if (cat.icon.includes('<svg') || cat.icon.includes('svg')) {
                    preview.innerHTML = cat.icon;
                    preview.style.display = 'flex';
                } else {
                    preview.innerHTML = `<span style="font-size: 2rem;">${cat.icon}</span>`;
                    preview.style.display = 'flex';
                }
            }
        }
    } else {
        document.getElementById('categoryModalTitle').textContent = 'إضافة قسم جديد';
    }
    
    document.getElementById('categoryModal').classList.add('active');
}

function closeCategoryModal() {
    document.getElementById('categoryModal').classList.remove('active');
}

async function saveCategory(event) {
    event.preventDefault();
    const submitBtn = document.querySelector('#categoryForm button[type="submit"]');
    if (submitBtn) { submitBtn.textContent = '⏳ جاري الحفظ...'; submitBtn.disabled = true; }
    
    try {
        const id = document.getElementById('categoryId').value;
        const name = document.getElementById('categoryName').value.trim();
        const icon = document.getElementById('categoryIcon').value || '📁';
        
        if (!name) throw new Error('يرجى إدخال اسم القسم');
        
        if (id) {
            await updateCategoryData({ id: parseInt(id), name, icon, active: true });
            showToast('تم تحديث القسم', 'success');
        } else {
            await createCategoryData({ name, icon, order: getCategories().length + 1, active: true });
            showToast('تم إضافة القسم بنجاح', 'success');
        }
        
        closeCategoryModal();
        renderCategories();
    } catch (error) {
        showToast(error.message || 'خطأ غير معروف', 'error');
    } finally {
        if (submitBtn) { submitBtn.textContent = 'حفظ'; submitBtn.disabled = false; }
    }
}

function editCategory(id) {
    openCategoryModal(id);
}

async function deleteCategory(id) {
    if (confirm('حذف هذا القسم سيحذف جميع الوجبات التابعة له! هل أنت متأكد؟')) {
        await deleteCategoryData(id);
        renderCategories();
        showToast('تم حذف القسم', 'warning');
    }
}

async function toggleCategoryActive(id) {
    const category = getCategories().find(c => c.id === id);
    if (category) {
        const updated = { ...category, active: !category.active };
        await updateCategoryData(updated);
        renderCategories();
        showToast(`${updated.name} ${updated.active ? 'مفعّل الآن' : 'تم إيقافه'}`, updated.active ? 'success' : 'info');
    }
}

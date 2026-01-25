const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('🌱 Starting seed...');

        // 1. Categories
        const categories = [
            { id: 1, name: 'بيتزا', icon: '🍕', order: 1, active: true },
            { id: 2, name: 'برغر', icon: '🍔', order: 2, active: true },
            { id: 3, name: 'شاورما', icon: '🌯', order: 3, active: true },
            { id: 4, name: 'طاكوس', icon: '🌮', order: 4, active: true },
            { id: 5, name: 'سلطات', icon: '🥗', order: 5, active: true },
            { id: 6, name: 'مشروبات', icon: '🥤', order: 6, active: true },
            { id: 7, name: 'حلويات', icon: '🍰', order: 7, active: true }
        ];

        // 2. Meals
        const meals = [
            // Pizza
            { id: 1, categoryId: 1, name: 'بيتزا مارغريتا', description: 'صلصة طماطم طازجة، جبن موزاريلا، ريحان طازج', image: '', price: 800, active: true, popular: true, order: 1, hasSizes: true, sizes: [{ name: 'صغيرة', price: 800 }, { name: 'وسط', price: 1200 }, { name: 'كبيرة', price: 1600 }] },
            { id: 2, categoryId: 1, name: 'بيتزا خضار', description: 'فلفل ملون، زيتون، فطر، بصل، طماطم، جبن موزاريلا', image: '', price: 900, active: true, popular: false, order: 2, hasSizes: true, sizes: [{ name: 'Classic', price: 900 }, { name: 'Mega', price: 1400 }, { name: 'Family', price: 1900 }] },
            { id: 3, categoryId: 1, name: 'بيتزا اللحم', description: 'لحم مفروم، فلفل، بصل، جبن موزاريلا، صلصة خاصة', image: '', price: 1000, active: true, popular: true, order: 3, hasSizes: true, sizes: [{ name: 'صغيرة', price: 1000 }, { name: 'وسط', price: 1500 }, { name: 'كبيرة', price: 2000 }] },
            { id: 4, categoryId: 1, name: 'بيتزا الدجاج', description: 'دجاج مشوي، فطر، جبن موزاريلا، صلصة الباربكيو', image: '', price: 1100, active: true, popular: false, order: 4, hasSizes: true, sizes: [{ name: 'Classic', price: 1100 }, { name: 'XL', price: 1700 }] },
            // Burger
            { id: 5, categoryId: 2, name: 'برغر كلاسيك', description: 'لحم بقري، جبن شيدر، خس، طماطم، بصل، صلصة خاصة', image: '', price: 600, active: true, popular: true, order: 1, hasSizes: true, sizes: [{ name: 'Single', price: 600 }, { name: 'Double', price: 900 }, { name: 'Triple', price: 1200 }] },
            { id: 6, categoryId: 2, name: 'برغر الدجاج', description: 'صدر دجاج مقرمش، خس، مايونيز، مخلل', image: '', price: 550, active: true, popular: false, order: 2, hasSizes: false, sizes: [] },
            { id: 7, categoryId: 2, name: 'برغر سموكي', description: 'لحم بقري مدخن، جبن جودا، بصل مكرمل، صلصة الباربكيو', image: '', price: 800, active: true, popular: true, order: 3, hasSizes: true, sizes: [{ name: 'عادي', price: 800 }, { name: 'ميجا', price: 1100 }] },
            // Shawarma
            { id: 8, categoryId: 3, name: 'شاورما دجاج', description: 'دجاج متبل، بطاطس، ثوم، مخلل، خبز عربي', image: '', price: 400, active: true, popular: true, order: 1, hasSizes: true, sizes: [{ name: 'عادي', price: 400 }, { name: 'جامبو', price: 600 }] },
            { id: 9, categoryId: 3, name: 'شاورما لحم', description: 'لحم بقري، طماطم، بقدونس، طحينة، خبز عربي', image: '', price: 500, active: true, popular: false, order: 2, hasSizes: true, sizes: [{ name: 'عادي', price: 500 }, { name: 'جامبو', price: 750 }] },
            { id: 10, categoryId: 3, name: 'بلاتو شاورما مشكل', description: 'شاورما دجاج ولحم، بطاطس، سلطة، ثوم', image: '', price: 1200, active: true, popular: true, order: 3, hasSizes: false, sizes: [] },
            // Tacos
            { id: 11, categoryId: 4, name: 'طاكوس دجاج', description: 'دجاج متبل، جبن، خس، صلصة حارة', image: '', price: 350, active: true, popular: false, order: 1, hasSizes: false, sizes: [] },
            { id: 12, categoryId: 4, name: 'طاكوس لحم', description: 'لحم مفروم، فاصوليا، جبن، كريمة حامضة', image: '', price: 400, active: true, popular: false, order: 2, hasSizes: false, sizes: [] },
            // Salads
            { id: 13, categoryId: 5, name: 'سلطة سيزر', description: 'خس روماني، خبز محمص، جبن بارميزان، صلصة سيزر', image: '', price: 450, active: true, popular: false, order: 1, hasSizes: true, sizes: [{ name: 'عادي', price: 450 }, { name: 'مع دجاج', price: 650 }] },
            { id: 14, categoryId: 5, name: 'سلطة يونانية', description: 'خيار، طماطم، زيتون، جبن فيتا، بصل، زيت زيتون', image: '', price: 400, active: true, popular: false, order: 2, hasSizes: false, sizes: [] },
            // Drinks
            { id: 15, categoryId: 6, name: 'عصير برتقال طبيعي', description: 'عصير برتقال طازج 100%', image: '', price: 150, active: true, popular: false, order: 1, hasSizes: true, sizes: [{ name: 'صغير', price: 150 }, { name: 'كبير', price: 250 }] },
            { id: 16, categoryId: 6, name: 'كوكا كولا', description: 'مشروب غازي بارد', image: '', price: 100, active: true, popular: false, order: 2, hasSizes: false, sizes: [] },
            { id: 17, categoryId: 6, name: 'ميلك شيك شوكولا', description: 'حليب، آيس كريم شوكولا، كريمة', image: '', price: 350, active: true, popular: true, order: 3, hasSizes: false, sizes: [] },
            // Desserts
            { id: 18, categoryId: 7, name: 'تيراميسو', description: 'كعكة إيطالية بالقهوة والماسكاربوني', image: '', price: 400, active: true, popular: true, order: 1, hasSizes: false, sizes: [] },
            { id: 19, categoryId: 7, name: 'براوني بالشوكولا', description: 'براوني ساخن مع آيس كريم فانيلا', image: '', price: 350, active: true, popular: false, order: 2, hasSizes: false, sizes: [] },
            { id: 20, categoryId: 7, name: 'كريب نوتيلا', description: 'كريب طازج مع نوتيلا وموز وفراولة', image: '', price: 300, active: true, popular: true, order: 3, hasSizes: true, sizes: [{ name: 'عادي', price: 300 }, { name: 'XL', price: 450 }] }
        ];

        // 3. Settings
        const settings = {
            restaurantName: 'مطعمي',
            phone: '0555123456',
            address: 'الجزائر العاصمة',
            currency: 'دج',
            isOpen: true,
            allowPreOrders: true,
            minPreOrderHours: 1,
            maxPreOrderHours: 24,
            openTime: '10:00',
            closeTime: '23:00',
            deliveryEnabled: true,
            deliveryType: 'fixed',
            deliveryFixedCost: 200,
            deliveryFreeAbove: 2000,
            deliveryCostPerKm: 50,
            deliveryMaxDistance: 15,
            adminPassword: 'admin123'
        };

        // --- Execution ---

        // 1. Settings
        await prisma.settings.upsert({
            where: { id: 1 },
            update: {}, // Keep existing if present
            create: { id: 1, ...settings }
        });
        console.log('✅ Settings seeded');

        // 2. Categories
        for (const cat of categories) {
            await prisma.category.upsert({
                where: { id: cat.id },
                update: {}, 
                create: {
                    id: cat.id,
                    name: cat.name,
                    icon: cat.icon,
                    order: cat.order,
                    active: cat.active
                }
            });
        }
        console.log(`✅ ${categories.length} Categories seeded`);

        // 3. Meals
        for (const meal of meals) {
            const { sizes, ...mealData } = meal;
            
            // Upsert Meal
            await prisma.meal.upsert({
                where: { id: meal.id },
                update: {},
                create: {
                    ...mealData,
                    sizes: {
                        create: sizes.map(s => ({ name: s.name, price: s.price }))
                    }
                }
            });
        }
        console.log(`✅ ${meals.length} Meals seeded`);

        console.log('🏁 Seed completed successfully.');
    } catch (e) {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();

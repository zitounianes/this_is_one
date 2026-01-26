const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
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
 
     // 2. Settings
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

    // 3. Update Settings
    await prisma.settings.upsert({
        where: { id: 1 },
        update: {},
        create: { id: 1, ...settings }
    });
    console.log('✅ Settings seeded');

    // 4. Update Categories
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
    console.log('✅ Categories seeded');
    console.log('🚀 Seeding completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

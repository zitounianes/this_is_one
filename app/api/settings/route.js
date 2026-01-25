import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function GET() {
  try {
    // Get the first settings record
    const settings = await prisma.settings.findFirst();
    if (!settings) {
        return NextResponse.json({});
    }
    return NextResponse.json(mapSettingsToFrontend(settings));
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    
    // Upsert settings (ID 1)
    // We assume body contains all fields or we merge them?
    // Prisma upsert needs create/update blocks.
    
    // First, let's just use update if we know ID is 1, or upsert.
    // For simplicity, always update/create ID 1.
    
    // Clean body to match schema if needed, but Prisma ignores extra fields usually if not STRICT
    // However, delivery nested object in body (from frontend) needs different handling?
    // Frontend `getSettings` returns:
    // { restaurantName: '...', delivery: { enabled: true, ... } }
    // Schema has flat fields for delivery like deliveryEnabled, deliveryFixedCost.
    // I need to MAP frontend object structure to Schema flat structure in PUT,
    // and MAP Schema flat structure to frontend structure in GET.
    
    // Actually, `data.js` and `admin.js` use `settings.delivery` object.
    
    // Wait, let's check JS side expectation.
    // `js/data.js`: `getSettings` returns `{ delivery: { enabled: true ... } ... }` (defaults)
    // `js/admin.js`: `loadSettings` reads `settings.delivery.type`, etc.
    // `js/admin.js`: `handleSaveSettings` constructs `{ delivery: { ... } }`.
    
    // So API must handle this mapping.
    
    // MAPPING in PUT:
    const data = {
        restaurantName: body.restaurantName,
        phone: body.phone,
        address: body.address,
        isOpen: body.isOpen,
        adminPassword: body.adminPassword,
        // Delivery mapping
        deliveryEnabled: body.delivery ? body.delivery.enabled : true,
        deliveryType: body.delivery ? body.delivery.type : 'fixed',
        deliveryFixedCost: body.delivery ? parseFloat(body.delivery.fixedCost || 0) : 0,
        deliveryCostPerKm: body.delivery ? parseFloat(body.delivery.costPerKm || 0) : 50,
        deliveryMaxDistance: body.delivery ? parseFloat(body.delivery.maxDistance || 0) : 20,
        deliveryFreeAbove: body.delivery ? parseFloat(body.delivery.freeAbove || 0) : 2000,
        // ... other fields if sent ...
    };
    
    // Upsert
    const settings = await prisma.settings.upsert({
        where: { id: 1 },
        update: data,
        create: { id: 1, ...data }
    });
    
    // Return mapped back to frontend format
    // Or just return what DB gave and let frontend handle?
    // Frontend expects `delivery` object.
    const mapped = mapSettingsToFrontend(settings);
    
    return NextResponse.json(mapped);
    
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}

// Helper to Map DB -> Frontend
function mapSettingsToFrontend(dbSettings) {
    if (!dbSettings) return {};
    return {
        ...dbSettings,
        delivery: {
            enabled: dbSettings.deliveryEnabled,
            type: dbSettings.deliveryType,
            fixedCost: dbSettings.deliveryFixedCost,
            costPerKm: dbSettings.deliveryCostPerKm,
            maxDistance: dbSettings.deliveryMaxDistance,
            freeAbove: dbSettings.deliveryFreeAbove
        }
    };
}

// Update GET to use mapping
export async function POST(request) {
    // Just in case used instead of PUT
    return PUT(request);
}

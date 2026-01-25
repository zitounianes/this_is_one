import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    const order = await prisma.order.create({
      data: {
        customerName: body.customerName,
        customerPhone: body.customerPhone,
        customerAddress: body.address || body.customerAddress, // Map 'address' to schema
        location: body.location ? JSON.stringify(body.location) : '',
        total: body.total || 0,
        subtotal: body.subtotal || 0, // Add to schema if missing or map correctly
        deliveryCost: body.deliveryCost || 0,
        status: 'new',
        orderType: body.orderType || 'delivery',
        notes: body.notes,
        status: body.status || 'new', // Allow setting status if needed
        items: {
          create: body.items.map(item => ({
            mealId: item.mealId || item.id,
            mealName: item.name || item.mealName || 'Unknown',
            quantity: item.quantity,
            price: item.price,
            size: item.sizeName
          }))
        }
      },
      include: { items: true }
    });
    
    return NextResponse.json(order);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, status, rating, review } = body;

        if (!id) return NextResponse.json({error: 'ID required'}, {status: 400});

        const data = {};
        if (status) data.status = status;
        if (rating) data.rating = rating; // Need to add to schema!
        if (review) data.review = review; // Need to add to schema!

        // If schema doesn't have rating/review yet, this might fail unless updated.
        // My previous schema didn't have rating/review. I should update schema.prisma first!
        // But for "No errors", let's be careful.
        // I will update schema.prisma in next step to be sure.
        
        const order = await prisma.order.update({
            where: { id: parseInt(id) },
            data: {
                ...(status && { status }),
                ...(rating && { rating: parseInt(rating) }),
                ...(review !== undefined && { review }) // Allow empty string reviews
            }
        });
        
        return NextResponse.json(order);
    } catch (error) {
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}

export async function DELETE(request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({error: 'ID required'}, {status: 400});

    try {
        await prisma.order.delete({ where: { id: parseInt(id) } });
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }
}

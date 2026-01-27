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
    console.error('GET /api/orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    console.log('POST /api/orders - creating order for:', body.customerName);

    const order = await prisma.order.create({
      data: {
        customerName: body.customerName,
        customerPhone: body.customerPhone,
        customerAddress: body.customerAddress || body.address || '',
        location: body.location ? (typeof body.location === 'string' ? body.location : JSON.stringify(body.location)) : '',
        total: parseFloat(body.total) || 0,
        subtotal: parseFloat(body.subtotal) || 0,
        deliveryCost: parseFloat(body.deliveryCost) || 0,
        status: body.status || 'new',
        orderType: body.orderType || 'delivery',
        notes: body.notes || '',
        items: {
          create: body.items.map(item => ({
            mealId: parseInt(item.mealId || item.id),
            mealName: item.name || item.mealName || 'Unknown',
            quantity: parseInt(item.quantity),
            price: parseFloat(item.price),
            size: item.sizeName || item.size || ''
          }))
        }
      },
      include: { items: true }
    });
    
    console.log('Order created successfully:', order.id);
    return NextResponse.json(order);
  } catch (error) {
    console.error('POST /api/orders error:', error);
    return NextResponse.json({ 
      error: 'Failed to create order: ' + (error.message || 'Unknown error') 
    }, { status: 500 });
  }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, status, rating, review } = body;

        if (!id) return NextResponse.json({error: 'ID required'}, {status: 400});

        console.log(`PUT /api/orders - updating order ${id}`, { status, rating });

        const data = {};
        if (status) data.status = status;
        if (rating !== undefined) data.rating = parseInt(rating);
        if (review !== undefined) data.review = review;
        
        const order = await prisma.order.update({
            where: { id: parseInt(id) },
            data: data
        });
        
        return NextResponse.json(order);
    } catch (error) {
        console.error('PUT /api/orders error:', error);
        return NextResponse.json({ error: 'Update failed: ' + error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({error: 'ID required'}, {status: 400});

    try {
        await prisma.order.delete({ where: { id: parseInt(id) } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('DELETE /api/orders error:', error);
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }
}


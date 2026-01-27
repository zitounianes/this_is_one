import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('categoryId');

  try {
    const where = categoryId ? { categoryId: parseInt(categoryId) } : {};
    
    const meals = await prisma.meal.findMany({
      where,
      include: {
        sizes: true,
        category: true
      },
      orderBy: { order: 'asc' }
    });
    return NextResponse.json(meals);
  } catch (error) {
    console.error('GET /api/meals error:', error);
    return NextResponse.json({ error: 'Failed to fetch meals' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    console.log('POST /api/meals - received:', JSON.stringify({
      id: body.id,
      name: body.name,
      categoryId: body.categoryId,
      price: body.price,
      hasSizes: body.hasSizes,
      sizesCount: body.sizes?.length
    }));

    // Validate required fields
    if (!body.name || body.name.trim() === '') {
      return NextResponse.json({ error: 'اسم الوجبة مطلوب' }, { status: 400 });
    }

    if (!body.categoryId) {
      return NextResponse.json({ error: 'القسم مطلوب' }, { status: 400 });
    }

    // ID exists -> Update
    if (body.id) {
        // Handle sizes update (delete old, create new is simplest strategy for now)
        if (body.sizes !== undefined) {
            await prisma.mealSize.deleteMany({ where: { mealId: body.id }});
        }
        
        const meal = await prisma.meal.update({
            where: { id: body.id },
            data: {
                name: body.name,
                description: body.description || '',
                image: body.image || null,
                price: parseFloat(body.price) || 0,
                categoryId: parseInt(body.categoryId),
                active: body.active !== undefined ? body.active : true,
                popular: body.popular || false,
                hasSizes: body.hasSizes || false,
                sizes: body.sizes && body.sizes.length > 0 ? {
                    create: body.sizes.map(s => ({
                        name: s.name,
                        price: parseFloat(s.price)
                    }))
                } : undefined
            },
            include: { sizes: true }
        });
        console.log('Meal updated:', meal.id);
        return NextResponse.json(meal);
    }
    
    // Create
    const meal = await prisma.meal.create({
      data: {
        name: body.name,
        description: body.description || '',
        image: body.image || null,
        price: parseFloat(body.price) || 0,
        categoryId: parseInt(body.categoryId),
        active: body.active !== undefined ? body.active : true,
        popular: body.popular || false,
        hasSizes: body.hasSizes || false,
        order: body.order || 0,
        sizes: {
          create: (body.sizes || []).map(s => ({
            name: s.name,
            price: parseFloat(s.price)
          }))
        }
      },
      include: { sizes: true }
    });
    
    console.log('Meal created:', meal.id);
    return NextResponse.json(meal);
  } catch (error) {
    console.error('POST /api/meals error:', error);
    return NextResponse.json({ 
      error: 'فشل في حفظ الوجبة: ' + (error.message || 'خطأ غير معروف')
    }, { status: 500 });
  }
}

export async function DELETE(request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    try {
        await prisma.meal.delete({
            where: { id: parseInt(id) }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}

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
    return NextResponse.json({ error: 'Failed to fetch meals' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    // ID exists -> Update
    if (body.id) {
        // Handle sizes update (delete old, create new is simplest strategy for now)
        if (body.sizes) {
            await prisma.mealSize.deleteMany({ where: { mealId: body.id }});
        }
        
        const meal = await prisma.meal.update({
            where: { id: body.id },
            data: {
                name: body.name,
                description: body.description,
                image: body.image,
                price: parseFloat(body.price),
                categoryId: body.categoryId,
                active: body.active,
                popular: body.popular,
                hasSizes: body.hasSizes,
                sizes: body.sizes ? {
                    create: body.sizes.map(s => ({
                        name: s.name,
                        price: parseFloat(s.price)
                    }))
                } : undefined
            },
            include: { sizes: true }
        });
        return NextResponse.json(meal);
    }
    
    // Create
    const meal = await prisma.meal.create({
      data: {
        name: body.name,
        description: body.description,
        image: body.image,
        price: parseFloat(body.price),
        categoryId: body.categoryId,
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
    
    return NextResponse.json(meal);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to save meal' }, { status: 500 });
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

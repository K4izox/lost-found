const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const student = await prisma.user.findFirst({ where: { role: 'student' } });
    if (!student) { console.log('No student found. Run create_user.js first.'); return; }

    await prisma.item.deleteMany({ where: { userId: student.id } });
    console.log('Cleared old items.');

    const items = [
        { type: 'lost', title: 'Black Laptop Bag', description: 'Lost my black laptop bag near the library. Contains MacBook and charger.', category: 'electronics', location: 'academic', locationDetail: 'Near library entrance', images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80'] },
        { type: 'found', title: 'Student ID Card', description: 'Found a student ID card on the cafeteria table. Name: Ahmad Fauzi.', category: 'personal', location: 'food', locationDetail: 'Main cafeteria', images: ['https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=800&q=80'] },
        { type: 'lost', title: 'Blue Water Bottle', description: 'Lost blue Hydro Flask near the sports center.', category: 'personal', location: 'common', locationDetail: 'Sports area', images: ['https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80'] },
        { type: 'found', title: 'Wireless Earbuds', description: 'Found wireless earbuds near the parking lot.', category: 'electronics', location: 'common', locationDetail: 'Parking Lot B', images: ['https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80'] },
        { type: 'lost', title: 'Green Umbrella', description: 'Left my green umbrella in lecture hall A-202 after morning class.', category: 'personal', location: 'academic', locationDetail: 'Gedung A Room 202', images: [] },
        { type: 'found', title: 'Physics Textbook', description: 'Found a Physics textbook in the reading room. Has name written inside.', category: 'academic', location: 'academic', locationDetail: 'Reading room 2nd floor', images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80'] },
    ];

    for (const item of items) {
        await prisma.item.create({ data: { ...item, date: new Date(), status: 'active', userId: student.id } });
        console.log(`\u2713 Created: ${item.type} \u2014 ${item.title}`);
    }

    await prisma.$disconnect();
    console.log('\nSeed items done!');
}

main().catch(e => { console.error(e); process.exit(1); });

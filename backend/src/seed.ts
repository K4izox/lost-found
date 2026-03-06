import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

async function main() {
    console.log(`Start seeding ...`);

    const hashedPassword = await bcrypt.hash('Password123!', 10);

    const user = await prisma.user.upsert({
        where: { id: 'e0b59bde-4e11-4fd2-8b6b-67a65977a450' },
        update: {},
        create: {
            id: 'e0b59bde-4e11-4fd2-8b6b-67a65977a450',
            name: 'Default User',
            email: 'student@president.ac.id',
            password: hashedPassword,
            role: 'student',
        },
    });

    console.log(`Created dummy user with id: ${user.id}`);

    // Create a test item 
    await prisma.item.create({
        data: {
            type: 'lost',
            title: 'Kunci Motor Honda',
            description: 'Kunci motor hilang di sekitar area parkiran gedung A.',
            category: 'personal',
            location: 'academic',
            locationDetail: 'Parkiran Gedung A',
            date: new Date(),
            status: 'active',
            images: ['https://images.unsplash.com/photo-1582139329536-e7284fece509?w=800&q=80'],
            userId: user.id,
        }
    });

    console.log(`Seeding finished.`);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });

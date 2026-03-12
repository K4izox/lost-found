const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    const accounts = [
        { name: 'Admin Campus Connect', email: 'admin@president.ac.id', password: 'Admin123!', role: 'admin' },
        { name: 'Dosen Budi Santoso', email: 'lecturer@president.ac.id', password: 'Lecturer123!', role: 'lecturer' },
        { name: 'Staff Keamanan', email: 'staff@president.ac.id', password: 'Staff123!', role: 'staff' },
        { name: 'Farel Mahasiswa', email: 'farel@student.president.ac.id', password: 'Student123!', role: 'student' },
    ];

    for (const acc of accounts) {
        const hashed = await bcrypt.hash(acc.password, 10);
        const user = await prisma.user.upsert({
            where: { email: acc.email },
            update: { password: hashed, name: acc.name, role: acc.role },
            create: { name: acc.name, email: acc.email, password: hashed, role: acc.role },
        });
        console.log(`✓ ${user.role.padEnd(10)} | ${user.email.padEnd(35)} | Password: ${acc.password}`);
    }

    await prisma.$disconnect();
    console.log('\nSemua akun berhasil dibuat/diperbarui!');
}

main().catch(e => { console.error(e); process.exit(1); });

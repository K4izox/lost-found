require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const p = new PrismaClient();

async function run() {
    const hash = await bcrypt.hash('admin123', 10);
    console.log('Generated hash:', hash);
    
    const updated = await p.user.update({
        where: { email: 'andri@student.president.ac.id' },
        data: { password: hash }
    });
    
    // Verify it works
    const verify = await bcrypt.compare('admin123', updated.password);
    console.log('Password verified:', verify);
    console.log('Done! Login should work now.');
}

run().catch(console.error).finally(() => p.$disconnect());

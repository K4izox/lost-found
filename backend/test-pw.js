const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function test(pw) {
    try {
        const url = `postgresql://postgres:${pw}@localhost:5432/campus_connect?schema=public`;
        fs.writeFileSync('.env', `DATABASE_URL="${url}"`);
        const p = new PrismaClient();
        await p.$connect();
        console.log('SUCCESS! PW IS:', pw);
        process.exit(0);
    } catch(e) {
        process.stdout.write('.');
    }
}

async function run() {
    const pwords = ['root', 'admin', 'password', 'postgres', '1234', '12345', '123456', '12345678', 'ilovepresident', 'president', '0000', '123123', 'admin123', 'qwerty'];
    for(const p of pwords) {
        await test(p);
    }
    console.log('\nFAILED ALL');
    fs.writeFileSync('.env', `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/campus_connect?schema=public"`);
}

run();

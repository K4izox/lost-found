require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const p = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://postgres:postgres@localhost:5432/campus_connect?schema=public"
        }
    }
});

async function run() {
    try {
        await p.$connect();
        console.log('SUCCESS with postgres:postgres');
    } catch(e) {
        console.error('FAILED with postgres:postgres:', e.message);
    } finally {
        await p.$disconnect();
    }
}

run();

const { PrismaClient } = require('@prisma/client');
const Groq = require('groq-sdk');
require('dotenv').config();

async function run() {
    try {
        console.log("Testing DB...");
        const prisma = new PrismaClient();
        await prisma.item.findMany({ take: 1 });
        console.log("DB connection OK");
        
        console.log("Testing Groq...");
        const apiKey = process.env.GROQ_API_KEY;
        console.log("API KEY starts with:", apiKey ? apiKey.substring(0, 5) : null);
        const groq = new Groq({ apiKey });
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: "hi" }],
            model: "llama-3.1-8b-instant",
        });
        console.log("Groq OK:", chatCompletion.choices[0]?.message?.content);
    } catch(err) {
        console.error("ERROR:", err.message);
        console.error("FULL:", err);
    }
}
run();

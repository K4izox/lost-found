import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    try {
        const items = await prisma.item.findMany({
            where: {
                title: {
                    contains: "kunci motor honda",
                    mode: "insensitive"
                }
            }
        });

        console.log(`Found ${items.length} items to delete.`);

        for (const item of items) {
            // Delete messages in those conversations first
            const convs = await prisma.conversation.findMany({
                where: { itemId: item.id }
            });

            for (const conv of convs) {
                await prisma.message.deleteMany({
                    where: { conversationId: conv.id }
                });
            }

            // Then delete conversations
            await prisma.conversation.deleteMany({
                where: { itemId: item.id }
            });

            // Finally, delete the item
            await prisma.item.delete({
                where: { id: item.id }
            });
            console.log(`Deleted item: ${item.title}`);
        }
        console.log('Cleanup complete.');
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();

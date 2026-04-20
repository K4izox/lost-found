import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import xss from 'xss';
import Groq from 'groq-sdk';
import fs from 'fs';
import { sendNotificationEmail } from './lib/email';
import crypto from 'crypto';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_123';

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;

app.use(cors({
    origin: process.env.FRONTEND_URL || true,
    credentials: true
}));
app.use(express.json());

app.use(helmet({ crossOriginResourcePolicy: false }));

const sanitizeInput = (req: Request, res: Response, next: express.NextFunction) => {
    if (req.body && typeof req.body === 'object') {
        for (const key in req.body) {
            if (typeof req.body[key] === 'string') {
                req.body[key] = xss(req.body[key]);
            }
        }
    }
    next();
};
app.use(sanitizeInput);

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3000, // Increased for development
    message: { error: 'Terlalu banyak permintaan dari IP Anda, silakan coba lagi setelah 15 menit.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', generalLimiter);

const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 1000, // Temporarily increased from 15 to allow retry
    message: { error: 'Terlalu banyak percobaan masuk/daftar. Silakan coba lagi dalam 1 jam.' },
});
app.use('/api/auth', authLimiter);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

const authenticateToken = (req: Request, res: Response, next: express.NextFunction): void => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        res.status(401).json({ error: 'Access denied. No token provided.' });
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        (req as any).user = decoded;
        next();
    } catch (error) {
        res.status(403).json({ error: 'Invalid token.' });
    }
};

const requireAdmin = (req: Request, res: Response, next: express.NextFunction): void => {
    if ((req as any).user && (req as any).user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Requires admin privileges' });
    }
};

app.post('/api/auth/register', async (req: Request, res: Response): Promise<any> => {
    try {
        const { name, email, password, role } = req.body;

        const isStudent = role === 'student';
        const validStudentDomain = email?.endsWith('@student.president.ac.id');
        const validStaffDomain = email?.endsWith('@president.ac.id');

        if (isStudent && !validStudentDomain) {
            return res.status(400).json({ error: 'Akun mahasiswa harus menggunakan email @student.president.ac.id' });
        }
        if (!isStudent && !validStaffDomain) {
            return res.status(400).json({ error: 'Akun dosen/staff/admin harus menggunakan email @president.ac.id' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already in use' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.user.create({
            data: { name, email, password: hashedPassword, role }
        });

        const token = jwt.sign({ userId: newUser.id, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({ token, user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, avatar: newUser.avatar } });
    } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        if ((user as any).isBanned) {
            return res.status(403).json({ error: 'Akun Anda telah dinonaktifkan. Hubungi administrator.' });
        }

        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

app.post('/api/auth/forgot-password', async (req: Request, res: Response): Promise<any> => {
    try {
        const { email } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            // For security, don't reveal if user exists, but here we can be helpful
            return res.json({ message: 'Jika email terdaftar, instruksi pemulihan akan dikirim.' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 3600000); // 1 hour

        await prisma.user.update({
            where: { id: user.id },
            data: { resetToken: token, resetTokenExpiry: expiry }
        });

        const resetLink = `/reset-password?token=${token}`;
        await sendNotificationEmail(
            user.email,
            user.name,
            'Reset Kata Sandi Anda',
            'Anda menerima email ini karena ada permintaan untuk mengatur ulang kata sandi akun Anda. Klik tombol di bawah ini untuk melanjutkan.',
            resetLink
        );

        res.json({ message: 'Instruksi pemulihan telah dikirim ke email Anda.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Gagal memproses permintaan lupa password' });
    }
});

app.post('/api/auth/reset-password', async (req: Request, res: Response): Promise<any> => {
    try {
        const { token, password } = req.body;

        const user = await prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: { gt: new Date() }
            }
        });

        if (!user) {
            return res.status(400).json({ error: 'Token tidak valid atau sudah kedaluwarsa.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null
            }
        });

        res.json({ message: 'Kata sandi Anda telah berhasil diperbarui.' });
    } catch (error) {
        res.status(500).json({ error: 'Gagal memperbarui kata sandi' });
    }
});

app.get('/api/users/profile', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, role: true, avatar: true, items: { orderBy: { createdAt: 'desc' } } }
        });

        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

app.patch('/api/users/profile', authenticateToken, upload.single('avatar'), async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = (req as any).user.userId;
        const { name } = req.body;

        const updateData: any = {};
        if (name) updateData.name = name;

        if (req.file) {
            const base_url = `${req.protocol}://${req.get('host')}`;
            updateData.avatar = `${base_url}/uploads/${req.file.filename}`;
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: { id: true, name: true, email: true, role: true, avatar: true }
        });

        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

app.get('/', (req: Request, res: Response) => {
    res.json({ status: 'ok', message: 'Welcome to Campus Connect Backend API' });
});

app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', message: 'Campus Connect Backend is running!' });
});

app.get('/api/items', async (req: Request, res: Response) => {
    try {
        const items = await prisma.item.findMany({
            include: { user: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch items' });
    }
});

app.get('/api/items/:id', async (req: Request, res: Response): Promise<any> => {
    try {
        const item = await prisma.item.findUnique({
            where: { id: req.params.id as string },
            include: { user: true }
        });
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch item' });
    }
});

app.patch('/api/items/:id/status', authenticateToken, async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = (req as any).user.userId;
        const itemId = req.params.id as string;
        const { status } = req.body;

        const item = await prisma.item.findUnique({ where: { id: itemId } });

        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        if (item.userId !== userId && (req as any).user.role !== 'admin') {
            return res.status(403).json({ error: 'Only the creator or admin can update the status' });
        }

        const validStatuses = ['active', 'claimed', 'resolved', 'expired'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const updatedItem = await prisma.item.update({
            where: { id: itemId },
            data: { status }
        });
        
        // Notify conversation participants when status changes
        // Especially useful for 'claimed' or 'resolved'
        try {
            const conversations = await prisma.conversation.findMany({
                where: { itemId }
            });
            
            // Get all unique users involved, excluding the one making the change
            const usersToNotify = new Set<string>();
            conversations.forEach(c => {
                if (c.user1Id !== userId) usersToNotify.add(c.user1Id);
                if (c.user2Id !== userId) usersToNotify.add(c.user2Id);
            });
            
            if (usersToNotify.size > 0) {
                const notificationsData = Array.from(usersToNotify).map(targetId => ({
                    userId: targetId,
                    title: `Perubahan Status Barang`,
                    message: `Status barang "${item.title}" yang kamu diskusikan telah diubah menjadi: ${status.toUpperCase()}.`,
                    type: "status",
                    link: `/item/${item.id}`
                }));
                
                await prisma.notification.createMany({
                    data: notificationsData
                });

                // Send email notifications asynchronously to all involved users
                (async () => {
                   const usersInvolved = await prisma.user.findMany({
                       where: { id: { in: Array.from(usersToNotify) } }
                   });
                   for (const user of usersInvolved) {
                       await sendNotificationEmail(
                           user.email,
                           user.name,
                           `Status Change: ${item.title}`,
                           `The item status for "${item.title}" that you are discussing has been changed to: ${status.toUpperCase()}.`,
                           `/item/${item.id}`
                       );
                   }
                })();
            }
        } catch (notifError) {
            console.error("Failed to spawn status notifications", notifError);
        }

        res.json(updatedItem);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update item status' });
    }
});

app.post('/api/items', authenticateToken, upload.array('images', 5), async (req: Request, res: Response) => {
    try {
        const {
            type, title, description, category, location, locationDetail, date
        } = req.body;

        const userId = (req as any).user.userId;

        const files = req.files as Express.Multer.File[];
        const base_url = `${req.protocol}://${req.get('host')}`;
        const imageUrls = files ? files.map(file => `${base_url}/uploads/${file.filename}`) : [];

        const newItem = await prisma.item.create({
            data: {
                type,
                title,
                description,
                category,
                location,
                locationDetail,
                date: new Date(date),
                images: imageUrls,
                userId
            }
        });

        // Notify all users about the new lost/found item
        (async () => {
            try {
                // Fetch all users EXCLUDING the reporter
                const users = await prisma.user.findMany({
                    where: { id: { not: userId } },
                    select: { id: true, email: true, name: true }
                });

                if (users.length > 0) {
                    // 1. Create in-app notifications for all users
                    const notificationsData = users.map(user => ({
                        userId: user.id,
                        title: `New Item ${type === 'lost' ? 'Lost' : 'Found'}: ${title}`,
                        message: `Someone just reported a ${type} item: "${title}". Check if it belongs to you!`,
                        type: type === 'lost' ? 'lost' : 'found',
                        link: `/item/${newItem.id}`
                    }));

                    await prisma.notification.createMany({
                        data: notificationsData
                    });

                    // 2. Send broadcast emails to all users (with a slight delay to avoid rate limits)
                    for (const user of users) {
                        await sendNotificationEmail(
                            user.email,
                            user.name,
                            `New Item Reported: ${title}`,
                            `Hi, someone has reported a newly ${type === 'lost' ? 'lost' : 'found'} item on Campus Connect: "${title}". Click below to see the details.`,
                            `/item/${newItem.id}`
                        );
                        // Optional sleep to avoid Gmail rate limits:
                        // await new Promise(resolve => setTimeout(resolve, 100)); 
                    }
                }

                // 3. Send confirmation email to the reporter
                const reporter = await prisma.user.findUnique({ where: { id: userId } });
                if (reporter) {
                    await sendNotificationEmail(
                        reporter.email,
                        reporter.name,
                        `Report Confirmation: ${title}`,
                        `Your item report "${title}" has been successfully posted to Campus Connect! We have notified the entire campus.`,
                        `/item/${newItem.id}`
                    );
                }
            } catch (asyncError) {
                console.error("Error in broadcast notifications:", asyncError);
            }
        })();

        res.status(201).json(newItem);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create item' });
    }
});

app.post('/api/ai/chat', async (req: Request, res: Response) => {
    try {
        const { message, history } = req.body;
        const apiKey = process.env.GROQ_API_KEY || '';

        if (!apiKey || apiKey === "your_groq_api_key_here") {
            return res.json({ response: "Hello! API Key saya masih berupa bawaan ('your_groq_api_key_here'). Silakan daftarkan kunci asli Anda di situs Groq Cloud dan ubah di dalam file .env agar saya bisa berbicara dengan Anda! 😊" });
        }

        const groq = new Groq({ apiKey });

        // Retrieve all items to give full context to the AI
        const items = await prisma.item.findMany({
            select: { id: true, title: true, description: true, type: true, category: true, location: true, date: true, status: true }
        });

        const systemInstruction = `You are a Smart Assistant (Lost & Found AI) who is friendly, cool, and highly helpful, specifically for President University students.
Your main tasks are TWO:
1. Act as a "Tour Guide" or Help Guide if a user is confused about how to use the Lost & Found website.
2. Match lost/found item reports with data in the database.

Here is the list of ALL items in the database along with their status and type:
${JSON.stringify(items, null, 2)}

Main rules:
1. VERY IMPORTANT: You MUST ONLY discuss topics related to lost/found items at President University, OR how to use this website. If a user asks about unrelated topics (like web coding, math, recipes, etc.), POLITELY DECLINE and say "Sorry, I only know about the Lost & Found web. Are you looking for a specific item or need help using the web?"
2. Answer in relaxed, friendly English suitable for college students (feel free to use emojis).
3. If a user asks for website guidance (e.g., "how do I claim?", "where do I report an item?"), explain the steps in a friendly manner (e.g., you can click 'report' at the top, or go to the Browse Items menu, etc.).
4. Very Important! Pay attention to the "type" column on items:
   - type "found": This means a campus hero FOUND the item and secured it. If a user is looking for their lost item and it matches this "found" item, deliver the good news that their item has likely been found!
   - type "lost": This means a student HAS REPORTED THE LOSS of the item (asking for help to find it).
5. If an item matches:
   - If the status is "claimed" or "resolved", inform them that the item was in the database but has already been claimed/the issue is resolved.
   - If the status is "active", give them a DIRECT LINK to the item page using this Markdown format: [View Item](/item/ITEM_ID) (replace ITEM_ID with the actual id from the database). It is crucial to create this link so they can just click it!
6. If a user's lost item is not yet in the database, be sympathetic and provide this link: [Report Lost Item](/report-lost) so their request for help can be announced to the entire campus.
7. DO NOT INVENT OR FAKE PAGE LINKS (like /claim-item or /my-items). Use ONLY the following URLs to guide the user:
   - Browse (Search general items): /browse
   - Report Lost: /report-lost
   - Report Found: /report-found
   - FAQ / Usage Guide: /faq
   - Platform Guidelines: /guidelines
8. Never mention "JSON" or "Raw database". Speak like a human.`;

        // Format history for Groq messages array
        const messages: any[] = [
            { role: "system", content: systemInstruction },
            { role: "assistant", content: "Understood. I am ready to serve students in a friendly manner and will check the items database first." },
        ];

        // Add history
        if (history && Array.isArray(history)) {
            history.forEach((h: any) => {
                // Map 'model' role back to 'assistant' for Groq
                const groqRole = h.role === 'model' ? 'assistant' : 'user';
                messages.push({ role: groqRole, content: h.content });
            });
        }

        messages.push({ role: "user", content: message });

        const chatCompletion = await groq.chat.completions.create({
            messages: messages,
            model: "llama-3.1-8b-instant",
        });

        const responseText = chatCompletion.choices[0]?.message?.content || "Maaf, saya tidak dapat merespons saat ini.";

        res.json({ response: responseText });
    } catch (error: any) {
        console.error("AI Error:", error);
        if (error.message && error.message.includes('Prisma')) {
            res.status(500).json({ error: 'Database sedang offline! Harap nyalakan server PostgreSQL Anda pada komputer ini agar AI dapat membaca data barang hilang.' });
        } else {
            res.status(500).json({ error: 'Gagal menghubungi AI Assistant.' });
        }
    }
});

app.post('/api/conversations', authenticateToken, async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = (req as any).user.userId;
        const { itemId, receiverId } = req.body;

        if (userId === receiverId) {
            return res.status(400).json({ error: 'Cannot start conversation with yourself' });
        }

        const existingConversation = await prisma.conversation.findFirst({
            where: {
                itemId,
                OR: [
                    { user1Id: userId, user2Id: receiverId },
                    { user1Id: receiverId, user2Id: userId }
                ]
            }
        });

        if (existingConversation) {
            return res.json(existingConversation);
        }

        const newConversation = await prisma.conversation.create({
            data: {
                itemId,
                user1Id: userId,
                user2Id: receiverId
            }
        });

        res.status(201).json(newConversation);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create conversation' });
    }
});

app.get('/api/messages/unread-count', authenticateToken, async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = (req as any).user.userId;
        const count = await prisma.message.count({
            where: {
                read: false,
                senderId: { not: userId },
                conversation: {
                    OR: [
                        { user1Id: userId },
                        { user2Id: userId }
                    ]
                }
            }
        });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch unread count' });
    }
});

app.get('/api/conversations', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;

        const conversations = await prisma.conversation.findMany({
            where: {
                OR: [
                    { user1Id: userId },
                    { user2Id: userId }
                ]
            },
            include: {
                item: true,
                user1: { select: { id: true, name: true, avatar: true } },
                user2: { select: { id: true, name: true, avatar: true } },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                },
                _count: {
                    select: {
                        messages: {
                            where: {
                                read: false,
                                senderId: { not: userId }
                            }
                        }
                    }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        const formatted = conversations.map(c => {
            const partner = c.user1Id === userId ? c.user2 : c.user1;
            return {
                id: c.id,
                itemId: c.itemId,
                itemTitle: c.item.title,
                participants: [c.user1Id, c.user2Id],
                partnerName: partner.name,
                partnerAvatar: partner.avatar,
                lastMessage: c.messages[0],
                unreadCount: c._count.messages,
                createdAt: c.createdAt
            };
        });

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
});

app.get('/api/conversations/:id/messages', authenticateToken, async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = (req as any).user.userId;
        const conversationId = req.params.id as string;

        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId }
        });

        if (!conversation || (conversation.user1Id !== userId && conversation.user2Id !== userId)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const messages = await prisma.message.findMany({
            where: { conversationId },
            include: {
                sender: { select: { name: true } }
            },
            orderBy: { createdAt: 'asc' }
        });

        await prisma.message.updateMany({
            where: {
                conversationId,
                senderId: { not: userId },
                read: false
            },
            data: { read: true }
        });

        const formatted = messages.map(m => ({
            id: m.id,
            conversationId: m.conversationId,
            senderId: m.senderId,
            senderName: m.sender.name,
            content: m.content,
            createdAt: m.createdAt,
            read: m.read
        }));

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

app.post('/api/conversations/:id/messages', authenticateToken, async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = (req as any).user.userId;
        const conversationId = req.params.id as string;
        const { content } = req.body;

        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId }
        });

        if (!conversation || (conversation.user1Id !== userId && conversation.user2Id !== userId)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const message = await prisma.message.create({
            data: {
                conversationId,
                senderId: userId,
                content
            },
            include: {
                sender: { select: { name: true } }
            }
        });

        await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() }
        });

        const receiverId = conversation.user1Id === userId ? conversation.user2Id : conversation.user1Id;
        
        const isSystemClaim = typeof content === 'string' && content.includes('[SYSTEM MESSAGE]: A claim verification');
        
        if (isSystemClaim) {
            await prisma.notification.create({
                data: {
                    userId: receiverId,
                    title: "Klaim Barang Masuk",
                    message: `${message.sender.name} telah mengirimkan pengajuan klaim/verifikasi. Cek Pesan Anda!`,
                    type: "claim",
                    link: `/messages`
                }
            });

            // Send email notification asynchronously
            (async () => {
                const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
                if (receiver) {
                    await sendNotificationEmail(
                        receiver.email,
                        receiver.name,
                        `Pengajuan Klaim: ${message.sender.name}`,
                        `${message.sender.name} has contacted you about your item. Please check your messages in Campus Connect to respond.`,
                        `/messages`
                    );
                }
            })();
        } else {
            await prisma.notification.create({
                data: {
                    userId: receiverId,
                    title: "Pesan Baru",
                    message: `${message.sender.name} mengirim pesan kepadamu`,
                    type: "message",
                    link: `/messages`
                }
            });

            // Send email notification asynchronously
            (async () => {
                const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
                if (receiver) {
                    await sendNotificationEmail(
                        receiver.email,
                        receiver.name,
                        `New Message from ${message.sender.name}`,
                        `You have received a new message from ${message.sender.name}. You can reply to it in the messages section.`,
                        `/messages`
                    );
                }
            })();
        }

        res.status(201).json({
            id: message.id,
            conversationId: message.conversationId,
            senderId: message.senderId,
            senderName: message.sender.name,
            content: message.content,
            createdAt: message.createdAt,
            read: message.read
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to send message' });
    }
});

app.get('/api/notifications', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 30
        });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

app.get('/api/notifications/unread-count', authenticateToken, async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = (req as any).user.userId;
        const count = await prisma.notification.count({
            where: { userId, isRead: false }
        });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch unread notifications count' });
    }
});

app.patch('/api/notifications/:id/read', authenticateToken, async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = (req as any).user.userId;
        const notificationId = req.params.id as string;

        await prisma.notification.updateMany({
            where: { id: notificationId, userId },
            data: { isRead: true }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update notification' });
    }
});

app.patch('/api/notifications/read-all', authenticateToken, async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = (req as any).user.userId;
        await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to mark all as read' });
    }
});

app.delete('/api/items/:id', authenticateToken, async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = (req as any).user.userId;
        const itemId = req.params.id as string;
        const userRole = (req as any).user.role;

        const item = await prisma.item.findUnique({ where: { id: itemId } });
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        if (item.userId !== userId && userRole !== 'admin') {
            return res.status(403).json({ error: 'Only the creator or admin can delete this item' });
        }

        // Delete associations that don't have Cascade delete
        await prisma.conversation.deleteMany({ where: { itemId } });

        await prisma.item.delete({ where: { id: itemId } });
        res.json({ success: true, message: 'Item deleted successfully' });
    } catch (error) {
        console.error("Delete Item Error:", error);
        res.status(500).json({ error: 'Failed to delete item' });
    }
});

app.get('/api/admin/stats', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
        const totalUsers = await prisma.user.count();
        const totalItems = await prisma.item.count();
        const activeItems = await prisma.item.count({ where: { status: 'active' } });
        const resolvedItems = await prisma.item.count({ where: { status: 'resolved' } });
        const claimedItems = await prisma.item.count({ where: { status: 'claimed' } });
        res.json({ totalUsers, totalItems, activeItems, resolvedItems, claimedItems });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch admin stats' });
    }
});

app.get('/api/admin/users', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
        const users = await (prisma as any).user.findMany({
            select: { id: true, name: true, email: true, role: true, isBanned: true, createdAt: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

app.patch('/api/admin/users/:id/ban', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<any> => {
    try {
        const targetId = req.params.id as string;
        const self = (req as any).user.userId;
        if (targetId === self) return res.status(400).json({ error: 'Cannot ban yourself' });
        await (prisma as any).user.update({ where: { id: targetId }, data: { isBanned: true } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to ban user' });
    }
});

app.patch('/api/admin/users/:id/unban', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<any> => {
    try {
        const targetId = req.params.id as string;
        await (prisma as any).user.update({ where: { id: targetId }, data: { isBanned: false } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to unban user' });
    }
});

app.post('/api/admin/broadcast', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { title, message, sendEmail } = req.body;
        const users = await prisma.user.findMany({ select: { id: true, email: true, name: true } });
        
        // In-app notifications
        await prisma.notification.createMany({
            data: users.map(u => ({
                userId: u.id,
                title,
                message,
                type: 'system',
                isRead: false,
            }))
        });

        // Optional email broadcast
        if (sendEmail) {
            // Run in background
            (async () => {
                for (const user of users) {
                    await sendNotificationEmail(
                        user.email,
                        user.name,
                        `Broadcast: ${title}`,
                        message
                    );
                }
            })();
        }

        res.json({ success: true, sent: users.length });
    } catch (error) {
        res.status(500).json({ error: 'Failed to broadcast notification' });
    }
});

app.get('/api/admin/chart-stats', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
        const now = new Date();
        // Normalize today to UTC midnight so day boundaries are exact
        const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const days = Array.from({ length: 7 }, (_, i) => {
            return new Date(todayUTC.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
        });
        const daily = await Promise.all(days.map(async (d) => {
            const nextDay = new Date(d.getTime() + 24 * 60 * 60 * 1000);
            const [lost, found] = await Promise.all([
                prisma.item.count({ where: { type: 'lost', createdAt: { gte: d, lt: nextDay } } }),
                prisma.item.count({ where: { type: 'found', createdAt: { gte: d, lt: nextDay } } }),
            ]);
            return {
                date: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
                lost, found
            };
        }));
        const byCategory = await prisma.item.groupBy({
            by: ['category'],
            _count: { _all: true },
        });
        res.json({ daily, byCategory: byCategory.map(c => ({ name: c.category, value: c._count._all })) });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch chart stats' });
    }
});

app.post('/api/items/:id/report', authenticateToken, async (req: Request, res: Response) => {
    try {
        const itemId = req.params.id as string;
        const reporterId = (req as any).user.userId as string;
        const reason = req.body.reason as string;
        const description = (req.body.description as string) || null;

        const report = await (prisma as any).report.create({
            data: { itemId, reporterId, reason, description }
        });

        res.status(201).json(report);
    } catch (error) {
        res.status(500).json({ error: 'Failed to submit report' });
    }
});

app.get('/api/admin/reports', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
        const reports = await (prisma as any).report.findMany({
            include: {
                item: { select: { title: true, type: true } },
                reporter: { select: { name: true, email: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(reports);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
});

app.patch('/api/admin/reports/:id/status', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { status } = req.body;
        await (prisma as any).report.update({
            where: { id: req.params.id },
            data: { status }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update report status' });
    }
});

app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});

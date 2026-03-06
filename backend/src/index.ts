import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_123';

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Configure Multer for image uploads
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

// Middleware to verify JWT token
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

// --- ROUTES ---

// Authentication
app.post('/api/auth/register', async (req: Request, res: Response): Promise<any> => {
    try {
        const { name, email, password, role } = req.body;
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

app.post('/api/auth/login', async (req: Request, res: Response): Promise<any> => {
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

        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

app.get('/', (req: Request, res: Response) => {
    res.json({ status: 'ok', message: 'Welcome to Campus Connect Backend API' });
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', message: 'Campus Connect Backend is running!' });
});

// Get all items (simulating browse feature)
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

// Get single item
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

// Update item status
app.patch('/api/items/:id/status', authenticateToken, async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = (req as any).user.userId;
        const itemId = req.params.id as string;
        const { status } = req.body;

        const item = await prisma.item.findUnique({ where: { id: itemId } });

        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        if (item.userId !== userId) {
            return res.status(403).json({ error: 'Only the creator can update the status' });
        }

        const validStatuses = ['active', 'claimed', 'resolved', 'expired'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const updatedItem = await prisma.item.update({
            where: { id: itemId },
            data: { status }
        });

        res.json(updatedItem);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update item status' });
    }
});

// Create a new item (protected route)
app.post('/api/items', authenticateToken, upload.array('images', 5), async (req: Request, res: Response) => {
    try {
        const {
            type, title, description, category, location, locationDetail, date
        } = req.body;

        const userId = (req as any).user.userId;

        // Process uploaded files
        const files = req.files as Express.Multer.File[];
        const base_url = `${req.protocol}://${req.get('host')}`;
        const imageUrls = files ? files.map(file => `${base_url}/uploads/${file.filename}`) : [];

        // Note: For now, if no images are uploaded, array will be empty.
        // We might also receive strings in req.body.images if updating, but currently this is just for creating.

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

        res.status(201).json(newItem);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create item' });
    }
});

// --- CHAT ROUTES ---

// Create or get conversation
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

// Get conversations for current user
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
                unreadCount: 0,
                createdAt: c.createdAt
            };
        });

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
});

// Get messages for a conversation
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

// Send a message
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

// Start server
app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});

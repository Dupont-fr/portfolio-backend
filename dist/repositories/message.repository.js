import { prisma } from '../config/prisma.js';
export async function createMessage(data) {
    return prisma.message.create({
        data: {
            name: data.name,
            email: data.email,
            subject: data.subject,
            message: data.message,
        },
        select: { id: true, createdAt: true },
    });
}
//# sourceMappingURL=message.repository.js.map
import { prisma } from '../config/prisma.js'
import type { MessageInput } from '../validators/message.validator.js'

export async function createMessage(data: MessageInput) {
  return prisma.message.create({
    data: {
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
    },
    select: { id: true, createdAt: true },
  })
}

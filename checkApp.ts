import { PrismaClient } from '@prisma/client'
import { sendVkMessage } from './lib/vkBot'
const prisma = new PrismaClient()

async function check() {
  const latest = await prisma.application.findFirst({
    orderBy: { createdAt: 'desc' }
  })
  console.log('Latest application:', latest)
  if (latest && latest.vkLink) {
    console.log('Testing sending message to:', latest.vkLink)
    await sendVkMessage(latest.vkLink, 'Привет! Это тестовое сообщение от разработчика.')
  }
}

check()

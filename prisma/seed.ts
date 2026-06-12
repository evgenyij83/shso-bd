const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Очистка БД (опционально)
  await prisma.fighter.deleteMany()
  await prisma.user.deleteMany()
  await prisma.squad.deleteMany()

  // Создание отрядов
  const squad1 = await prisma.squad.create({
    data: { name: 'ССО "Атлант"' },
  })

  const squad2 = await prisma.squad.create({
    data: { name: 'СПО "Искра"' },
  })

  // Создание пользователей (уникальные коды)
  // Руководство университета
  await prisma.user.create({
    data: {
      uniqueCode: 'UNIV-ADMIN-123',
      role: 'UNIVERSITY_ADMIN',
    },
  })

  // Командир штаба
  await prisma.user.create({
    data: {
      uniqueCode: 'HQ-COM-123',
      role: 'HQ_COMMANDER',
    },
  })

  // Командир отряда 1
  await prisma.user.create({
    data: {
      uniqueCode: 'SQUAD1-COM',
      role: 'SQUAD_COMMANDER',
      squadId: squad1.id,
    },
  })

  // Создание бойцов
  await prisma.fighter.create({
    data: {
      squadId: squad1.id,
      position: 'Командир',
      fullName: 'Иванов Иван Иванович',
      faculty: 'Строительный',
      studyGroup: 'СТ-101',
      course: 3,
      educationForm: 'Бюджет',
      phone: '+7 (999) 123-45-67',
      vkLink: 'https://vk.com/ivanov',
    },
  })

  await prisma.fighter.create({
    data: {
      squadId: squad1.id,
      position: 'Боец',
      fullName: 'Петров Петр Петрович',
      faculty: 'Строительный',
      studyGroup: 'СТ-102',
      course: 2,
      educationForm: 'Коммерческое',
      phone: '+7 (999) 765-43-21',
      vkLink: 'https://vk.com/petrov',
    },
  })

  await prisma.fighter.create({
    data: {
      squadId: squad2.id,
      position: 'Командир',
      fullName: 'Смирнова Анна',
      faculty: 'Педагогический',
      studyGroup: 'ПЕД-201',
      course: 4,
      educationForm: 'Бюджет',
      phone: '+7 (999) 000-00-00',
    },
  })

  console.log('Database has been seeded. 🌱')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

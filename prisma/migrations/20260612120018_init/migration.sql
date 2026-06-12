-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "uniqueCode" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "squadId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Squad" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Squad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fighter" (
    "id" TEXT NOT NULL,
    "squadId" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "faculty" TEXT NOT NULL,
    "studyGroup" TEXT NOT NULL,
    "course" INTEGER NOT NULL,
    "educationForm" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "vkLink" TEXT,

    CONSTRAINT "Fighter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_uniqueCode_key" ON "User"("uniqueCode");

-- CreateIndex
CREATE UNIQUE INDEX "Squad_name_key" ON "Squad"("name");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_squadId_fkey" FOREIGN KEY ("squadId") REFERENCES "Squad"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fighter" ADD CONSTRAINT "Fighter_squadId_fkey" FOREIGN KEY ("squadId") REFERENCES "Squad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

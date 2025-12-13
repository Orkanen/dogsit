/*
  Warnings:

  - A unique constraint covering the columns `[certificationId]` on the table `CourseEnrollment` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `courseenrollment` ADD COLUMN `certificationId` INTEGER NULL;

-- CreateIndex
CREATE UNIQUE INDEX `CourseEnrollment_certificationId_key` ON `CourseEnrollment`(`certificationId`);

-- AddForeignKey
ALTER TABLE `CourseEnrollment` ADD CONSTRAINT `CourseEnrollment_certificationId_fkey` FOREIGN KEY (`certificationId`) REFERENCES `Certification`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

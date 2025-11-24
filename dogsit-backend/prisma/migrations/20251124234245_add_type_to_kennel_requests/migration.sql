-- AlterTable
ALTER TABLE `kennelmembershiprequest` ADD COLUMN `type` VARCHAR(191) NOT NULL DEFAULT 'MEMBERSHIP';

-- AlterTable
ALTER TABLE `kennelpetrequest` ADD COLUMN `type` VARCHAR(191) NOT NULL DEFAULT 'PET_LINK';

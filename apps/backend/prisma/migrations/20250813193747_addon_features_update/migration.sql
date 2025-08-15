/*
  Warnings:

  - A unique constraint covering the columns `[bookingId,description]` on the table `BookingCharge` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `License` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[licenseId,renewalAlertDays]` on the table `LicenseRenewalAlert` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[posOrderId]` on the table `PosOrderAddon` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[roomTypeId,startDate,endDate]` on the table `SeasonalRate` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `BookingCharge_bookingId_description_key` ON `BookingCharge`(`bookingId`, `description`);

-- CreateIndex
CREATE UNIQUE INDEX `License_name_key` ON `License`(`name`);

-- CreateIndex
CREATE UNIQUE INDEX `LicenseRenewalAlert_licenseId_renewalAlertDays_key` ON `LicenseRenewalAlert`(`licenseId`, `renewalAlertDays`);

-- CreateIndex
CREATE UNIQUE INDEX `PosOrderAddon_posOrderId_key` ON `PosOrderAddon`(`posOrderId`);

-- CreateIndex
CREATE UNIQUE INDEX `SeasonalRate_roomTypeId_startDate_endDate_key` ON `SeasonalRate`(`roomTypeId`, `startDate`, `endDate`);

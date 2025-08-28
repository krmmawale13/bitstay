import { BadRequestException } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';

/** Allowed forward transitions for each status. */
export const BOOKING_STATUS_FLOW: Record<BookingStatus, BookingStatus[]> = {
  PENDING:     [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
  CONFIRMED:   [BookingStatus.CHECKED_IN, BookingStatus.CANCELLED],
  CHECKED_IN:  [BookingStatus.CHECKED_OUT],
  CHECKED_OUT: [],
  CANCELLED:   [],
};

/** Throw if an invalid status transition is attempted. */
export function assertStatusTransition(from: BookingStatus, to: BookingStatus) {
  const allowed = BOOKING_STATUS_FLOW[from] || [];
  if (!allowed.includes(to)) {
    throw new BadRequestException(`Invalid status transition: ${from} → ${to}`);
  }
}

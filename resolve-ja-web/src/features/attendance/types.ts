import { ServiceRequest } from '@/features/requests/types';

export type CheckInInput = {
  selfiePath: string;
  lat?: number;
  lng?: number;
};

export type GeneratePinOutput = {
  pin: string;
};

export type StartRequestInput = {
  pin: string;
};

export type AttendanceActionResult = ServiceRequest;

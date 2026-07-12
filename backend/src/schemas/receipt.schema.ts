import { z } from 'zod';

export const receiptExtractionSchema = z.object({
  station_name: z.string().min(1, "Station name is required"),
  station_address: z.string().nullable().optional(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  time: z.string().nullable().optional(),
  fuel_type: z.string().min(1, "Fuel type is required"),
  quantity_liters: z.number().nonnegative("Quantity must be positive"),
  price_per_liter: z.number().nonnegative("Price per liter must be positive"),
  total_amount: z.number().nonnegative("Total amount must be positive"),
  currency: z.string().default("USD"),
  payment_method: z.string().nullable().optional(),
  vehicle_number: z.string().nullable().optional(),
  odometer_reading: z.number().nullable().optional(),
  receipt_number: z.string().nullable().optional(),
  raw_ocr_text: z.string().min(1, "Raw OCR text is required"),
  confidence: z.number().min(0).max(1),
});

export const receiptUpdateSchema = z.object({
  station_name: z.string().min(1).optional(),
  station_address: z.string().nullable().optional(),
  date: z.string().refine((val) => !isNaN(Date.parse(val))).optional(),
  time: z.string().nullable().optional(),
  fuel_type: z.string().min(1).optional(),
  quantity_liters: z.number().nonnegative().optional(),
  price_per_liter: z.number().nonnegative().optional(),
  total_amount: z.number().nonnegative().optional(),
  currency: z.string().optional(),
  payment_method: z.string().nullable().optional(),
  vehicle_number: z.string().nullable().optional(),
  odometer_reading: z.number().nullable().optional(),
  receipt_number: z.string().nullable().optional(),
});

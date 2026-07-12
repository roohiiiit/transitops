import { Request, Response, NextFunction } from 'express';
import { prisma } from '../services/database.service';
import { StorageFactory } from '../services/storage/storage.factory';
import { ClaudeService } from '../services/claude.service';
import { receiptExtractionSchema, receiptUpdateSchema } from '../schemas/receipt.schema';

const storageService = StorageFactory.getStorageService();
const claudeService = new ClaudeService();

export class ReceiptController {
  async createReceipt(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file uploaded' });
      }

      // 1. Upload the image to storage
      const imageUrl = await storageService.uploadFile(req.file);

      // 2. Create database entry with PENDING status
      let receipt = await prisma.receipt.create({
        data: {
          image_url: imageUrl,
          status: 'PENDING',
        },
      });

      // 3. Trigger Claude vision extraction
      try {
        const extractedData = await claudeService.extractReceiptData(
          req.file.buffer,
          req.file.mimetype
        );

        // 4. Validate the extracted data using Zod
        const validatedData = receiptExtractionSchema.parse(extractedData);

        // 5. Save the validated fields in database and set status to PROCESSED
        receipt = await prisma.receipt.update({
          where: { id: receipt.id },
          data: {
            status: 'PROCESSED',
            station_name: validatedData.station_name,
            station_address: validatedData.station_address,
            date: validatedData.date ? new Date(validatedData.date) : null,
            time: validatedData.time,
            fuel_type: validatedData.fuel_type,
            quantity_liters: validatedData.quantity_liters,
            price_per_liter: validatedData.price_per_liter,
            total_amount: validatedData.total_amount,
            currency: validatedData.currency,
            payment_method: validatedData.payment_method,
            vehicle_number: validatedData.vehicle_number,
            odometer_reading: validatedData.odometer_reading,
            receipt_number: validatedData.receipt_number,
            raw_ocr_text: validatedData.raw_ocr_text,
            confidence: validatedData.confidence,
          },
        });

        // 6. Return response to the client
        return res.status(201).json(receipt);
      } catch (err: any) {
        console.error('Extraction/Validation failed for receipt ID:', receipt.id, err);

        // Update status to FAILED and store the error message
        receipt = await prisma.receipt.update({
          where: { id: receipt.id },
          data: {
            status: 'FAILED',
            error_message: err.message || 'Unknown error occurred during extraction/validation',
          },
        });

        return res.status(422).json({
          message: 'Failed to extract receipt data',
          record: receipt,
          error: err.message,
        });
      }
    } catch (err) {
      next(err);
    }
  }

  async getReceipts(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const limit = parseInt(req.query.limit as string || '10', 10);
      const skip = (page - 1) * limit;

      const startDateStr = req.query.start_date as string;
      const endDateStr = req.query.end_date as string;
      const stationName = req.query.station_name as string;

      const where: any = {};

      // Filter by date range (comparing with receipt date)
      if (startDateStr || endDateStr) {
        where.date = {};
        if (startDateStr) {
          where.date.gte = new Date(startDateStr);
        }
        if (endDateStr) {
          where.date.lte = new Date(endDateStr);
        }
      }

      // Filter by station_name (partial match case-insensitive)
      if (stationName) {
        where.station_name = {
          contains: stationName,
          mode: 'insensitive',
        };
      }

      const [receipts, total] = await prisma.$transaction([
        prisma.receipt.findMany({
          where,
          skip,
          take: limit,
          orderBy: { created_at: 'desc' },
        }),
        prisma.receipt.count({ where }),
      ]);

      return res.status(200).json({
        data: receipts,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async getReceiptById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const receipt = await prisma.receipt.findUnique({
        where: { id },
      });

      if (!receipt) {
        return res.status(404).json({ error: 'Receipt not found' });
      }

      return res.status(200).json(receipt);
    } catch (err) {
      next(err);
    }
  }

  async updateReceipt(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validatedData = receiptUpdateSchema.parse(req.body);

      // Verify receipt exists
      const existingReceipt = await prisma.receipt.findUnique({
        where: { id },
      });

      if (!existingReceipt) {
        return res.status(404).json({ error: 'Receipt not found' });
      }

      // Map date string to Date object if updating
      const updateData: any = { ...validatedData };
      if (validatedData.date) {
        updateData.date = new Date(validatedData.date);
      }

      const updatedReceipt = await prisma.receipt.update({
        where: { id },
        data: updateData,
      });

      return res.status(200).json(updatedReceipt);
    } catch (err) {
      next(err);
    }
  }
}

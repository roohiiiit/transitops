import Anthropic from '@anthropic-ai/sdk';

export interface ExtractedReceiptData {
  station_name: string;
  station_address: string | null;
  date: string;
  time: string | null;
  fuel_type: string;
  quantity_liters: number;
  price_per_liter: number;
  total_amount: number;
  currency: string;
  payment_method: string | null;
  vehicle_number: string | null;
  odometer_reading: number | null;
  receipt_number: string | null;
  raw_ocr_text: string;
  confidence: number;
}

export class ClaudeService {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });
  }

  async extractReceiptData(
    fileBuffer: Buffer,
    mimeType: string
  ): Promise<ExtractedReceiptData> {
    const base64Image = fileBuffer.toString('base64');

    const prompt = `You are an expert OCR vision AI. Your task is to analyze the provided image of a fuel/gas receipt and extract structured data from it.
Analyze the image carefully, extract the raw text, and return a JSON object with the following fields:
- station_name: Name of the gas station (string)
- station_address: Address of the gas station (string, null if not present)
- date: Date of purchase formatted as an ISO date string (YYYY-MM-DD, e.g. "2026-07-12")
- time: Time of purchase (string, e.g., "14:30", null if not present)
- fuel_type: Type of fuel (e.g. Petrol, Diesel, Premium, Regular, etc. string)
- quantity_liters: Number of liters purchased (number)
- price_per_liter: Price per liter (number)
- total_amount: Total amount paid (number)
- currency: Currency code (e.g. USD, EUR, INR, GBP. Guess based on symbols or location if not explicitly stated, defaulting to USD)
- payment_method: Method of payment (e.g. Cash, Card, UPI, null if not present)
- vehicle_number: Vehicle license plate number if printed on the receipt (string, null if not present)
- odometer_reading: Odometer reading if printed on the receipt (number, null if not present)
- receipt_number: Receipt or Invoice ID (string, null if not present)
- raw_ocr_text: The complete raw text transcribed from the receipt (string)
- confidence: Your self-reported confidence level in this extraction as a float between 0.0 and 1.0 (number)

Output MUST be a single, valid JSON object ONLY. Do not write any preamble, markdown code blocks, explanation, or notes. Output should start with '{' and end with '}'.`;

    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType as any,
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });

    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response received from Claude API');
    }

    let rawText = textContent.text.trim();
    
    // Clean up Markdown code block wrapper if present
    if (rawText.startsWith('```json')) {
      rawText = rawText.slice(7);
    } else if (rawText.startsWith('```')) {
      rawText = rawText.slice(3);
    }
    
    if (rawText.endsWith('```')) {
      rawText = rawText.slice(0, -3);
    }
    
    rawText = rawText.trim();

    try {
      const parsedData = JSON.parse(rawText);
      return parsedData as ExtractedReceiptData;
    } catch (error: any) {
      throw new Error(`Failed to parse Claude response as JSON: ${error.message}. Raw response was: ${rawText}`);
    }
  }
}

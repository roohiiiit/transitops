import fs from 'fs';
import path from 'path';
import { IStorageService } from './storage.interface';

export class LocalStorageService implements IStorageService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || './uploads';
    
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    const destination = path.join(this.uploadDir, filename);

    // Save the file
    await fs.promises.writeFile(destination, file.buffer);

    // Return the relative URL path for Express static hosting
    return `/uploads/${filename}`;
  }
}

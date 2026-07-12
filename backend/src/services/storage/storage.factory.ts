import { IStorageService } from './storage.interface';
import { LocalStorageService } from './local.storage';
import { S3StorageService } from './s3.storage';

export class StorageFactory {
  static getStorageService(): IStorageService {
    const provider = process.env.STORAGE_PROVIDER || 'local';

    if (provider.toLowerCase() === 's3') {
      return new S3StorageService();
    }

    return new LocalStorageService();
  }
}

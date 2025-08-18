import * as fs from 'fs/promises';
import * as path from 'path';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FileUploadService {
  constructor(private configService: ConfigService) {}

  async uploadProfilePicture(file: Express.Multer.File): Promise<string> {
    try {
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(
        process.cwd(),
        'uploads',
        'profile-pictures',
      );

      try {
        await fs.access(uploadsDir);
      } catch {
        await fs.mkdir(uploadsDir, { recursive: true });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = path.extname(file.originalname);
      const filename = `profile_${timestamp}_${randomString}${fileExtension}`;
      const filePath = path.join(uploadsDir, filename);

      // Save file
      await fs.writeFile(filePath, file.buffer);

      // Return the file URL (relative to your API base URL)
      const baseUrl =
        this.configService.get<string>('API_BASE_URL') ||
        'http://localhost:3000';
      return `${baseUrl}/uploads/profile-pictures/${filename}`;
    } catch (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  async deleteProfilePicture(fileUrl: string): Promise<void> {
    try {
      if (!fileUrl || fileUrl === '') return;

      // Extract filename from URL
      const filename = path.basename(fileUrl);
      const filePath = path.join(
        process.cwd(),
        'uploads',
        'profile-pictures',
        filename,
      );

      // Delete file if it exists
      try {
        await fs.access(filePath);
        await fs.unlink(filePath);
      } catch {
        // File doesn't exist, ignore
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  }
}

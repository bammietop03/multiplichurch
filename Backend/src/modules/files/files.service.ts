import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { StorageService } from '../../core/storage/storage.service';
import { AuditService } from '../../core/audit/audit.service';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Upload file
   */
  async uploadFile(
    file: Express.Multer.File,
    userId: string,
    isPublic: boolean = false,
  ) {
    // Validate file
    this.validateFile(file);

    try {
      // Upload to storage
      const storageFile = await this.storageService.upload({
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        buffer: file.buffer,
      });

      // Save to database
      const dbFile = await this.prisma.file.create({
        data: {
          userId,
          filename: storageFile.filename,
          originalName: storageFile.originalName,
          mimeType: storageFile.mimetype,
          size: storageFile.size,
          storageType: this.storageService.getProviderType(),
          storagePath: storageFile.storagePath,
          url: storageFile.url,
          isPublic,
        },
      });

      // Audit log
      await this.auditService.log({
        action: 'FILE_UPLOADED',
        resource: 'File',
        resourceId: dbFile.id,
        userId,
        metadata: {
          filename: dbFile.originalName,
          size: dbFile.size,
          mimetype: dbFile.mimeType,
        },
      });

      return {
        id: dbFile.id,
        filename: dbFile.filename,
        originalName: dbFile.originalName,
        mimetype: dbFile.mimeType,
        size: dbFile.size,
        url: dbFile.url,
        storagePath: dbFile.storagePath,
        uploadedAt: dbFile.createdAt,
      };
    } catch (error) {
      this.logger.error('File upload failed', error);
      throw error;
    }
  }

  /**
   * Get file
   */
  async getFile(id: string) {
    const file = await this.prisma.file.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    return file;
  }

  /**
   * Get download URL with signed access (supports local and R2 storage)
   */
  async getDownloadUrl(filename: string, expiresIn: number = 3600) {
    const file = await this.prisma.file.findFirst({
      where: { filename },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    const signedUrl = await this.storageService.getSignedUrl(file.storagePath, {
      expiresIn,
    });
    const publicUrl = await this.storageService.getUrl(file.storagePath);

    return {
      url: publicUrl,
      signedUrl,
      expiresIn,
    };
  }

  /**
   * Delete file
   */
  async deleteFile(id: string, userId: string) {
    const file = await this.prisma.file.findUnique({
      where: { id },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Check ownership
    if (file.userId !== userId) {
      throw new ForbiddenException('You can only delete your own files');
    }

    try {
      // Delete from storage
      await this.storageService.delete(file.storagePath);

      // Delete from database
      await this.prisma.file.delete({
        where: { id },
      });

      // Audit log
      await this.auditService.log({
        action: 'FILE_DELETED',
        resource: 'File',
        resourceId: id,
        userId,
        metadata: {
          filename: file.originalName,
        },
      });
    } catch (error) {
      this.logger.error('File deletion failed', error);
      throw error;
    }
  }

  /**
   * List user files
   */
  async listUserFiles(userId: string, skip: number = 0, take: number = 10) {
    const [files, total] = await Promise.all([
      this.prisma.file.findMany({
        where: { userId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.file.count({
        where: { userId },
      }),
    ]);

    return {
      data: files,
      pagination: {
        skip,
        take,
        total,
        pages: Math.ceil(total / take),
      },
    };
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of 50MB`,
      );
    }
  }
}

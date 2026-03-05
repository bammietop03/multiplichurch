import {
  Controller,
  Post,
  Get,
  Delete,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmailVerifiedGuard } from '../../common/guards';
import { Request, Express } from 'express';

export interface FileUploadDto {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string | null;
  storagePath: string;
  uploadedAt: Date;
}

export interface FileDownloadDto {
  url: string;
  signedUrl: string;
  expiresIn: number;
}

@ApiTags('Files')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, EmailVerifiedGuard)
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File to upload',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'The file to upload',
        },
      },
      required: ['file'],
    },
  })
  @ApiQuery({
    name: 'isPublic',
    required: false,
    type: 'boolean',
    description: 'Whether the file should be publicly accessible',
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
    schema: {
      example: {
        id: 'uuid',
        filename: 'nanoid.ext',
        originalName: 'document.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        url: '/files/nanoid.ext',
        storagePath: 'uploads/nanoid.ext',
        uploadedAt: '2026-01-03T10:00:00Z',
      },
    },
  })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('isPublic') isPublic: string,
    @Req() request: Request & { user: any },
  ): Promise<FileUploadDto> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return this.filesService.uploadFile(
      file,
      request.user.id,
      isPublic === 'true',
    );
  }

  @Get('download/:filename')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get download URL for a file' })
  @ApiParam({ name: 'filename', description: 'File identifier' })
  @ApiResponse({
    status: 200,
    description: 'Download URL generated',
    schema: {
      example: {
        url: '/files/nanoid.ext',
        signedUrl: 'https://account-id.r2.cloudflarestorage.com/...',
        expiresIn: 3600,
      },
    },
  })
  async getDownloadUrl(
    @Param('filename') filename: string,
    @Query('expiresIn') expiresIn: string,
  ): Promise<FileDownloadDto> {
    const expiry = expiresIn ? parseInt(expiresIn, 10) : 3600;
    return this.filesService.getDownloadUrl(filename, expiry);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get file details' })
  @ApiParam({ name: 'id', description: 'File ID' })
  async getFile(@Param('id') id: string) {
    return this.filesService.getFile(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a file' })
  @ApiParam({ name: 'id', description: 'File ID' })
  async deleteFile(
    @Param('id') id: string,
    @Req() request: Request & { user: any },
  ): Promise<void> {
    await this.filesService.deleteFile(id, request.user.id);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List user files' })
  async listFiles(
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '10',
    @Req() request: Request & { user: any },
  ) {
    return this.filesService.listUserFiles(
      request.user.id,
      parseInt(skip, 10),
      parseInt(take, 10),
    );
  }
}

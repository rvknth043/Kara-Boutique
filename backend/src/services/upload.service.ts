import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import dotenv from 'dotenv';

dotenv.config();

const UPLOAD_PROVIDER = process.env.UPLOAD_PROVIDER || 'S3'; // 'S3' or 'CLOUDINARY'

// AWS S3 Configuration
const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const S3_BUCKET = process.env.AWS_S3_BUCKET || 'kara-boutique-images';

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer configuration for memory storage
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: any, cb: any) => {
  // Accept images only
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

export class ImageUploadService {
  /**
   * Upload image to S3
   */
  private static async uploadToS3(
    buffer: Buffer,
    filename: string,
    mimetype: string
  ): Promise<string> {
    const key = `products/${Date.now()}-${filename}`;
    
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
      ACL: 'public-read',
    });
    
    await s3Client.send(command);
    
    return `https://${S3_BUCKET}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${key}`;
  }
  
  /**
   * Upload image to Cloudinary
   */
  private static async uploadToCloudinary(buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'kara-boutique/products',
          resource_type: 'image',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result!.secure_url);
        }
      );
      
      uploadStream.end(buffer);
    });
  }
  
  /**
   * Delete image from S3
   */
  private static async deleteFromS3(url: string): Promise<void> {
    // Extract key from URL
    const key = url.split('.amazonaws.com/')[1];
    
    if (!key) return;
    
    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });
    
    await s3Client.send(command);
  }
  
  /**
   * Delete image from Cloudinary
   */
  private static async deleteFromCloudinary(url: string): Promise<void> {
    // Extract public_id from URL
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    const publicId = `kara-boutique/products/${filename.split('.')[0]}`;
    
    await cloudinary.uploader.destroy(publicId);
  }
  
  /**
   * Optimize image
   */
  private static async optimizeImage(buffer: Buffer): Promise<Buffer> {
    return await sharp(buffer)
      .resize(1200, 1600, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85, progressive: true })
      .toBuffer();
  }
  
  /**
   * Upload single image
   */
  static async uploadImage(file: Express.Multer.File): Promise<string> {
    try {
      // Optimize image
      const optimizedBuffer = await this.optimizeImage(file.buffer);
      
      // Upload based on provider
      if (UPLOAD_PROVIDER === 'CLOUDINARY') {
        return await this.uploadToCloudinary(optimizedBuffer);
      } else {
        return await this.uploadToS3(
          optimizedBuffer,
          file.originalname,
          file.mimetype
        );
      }
    } catch (error) {
      console.error('Image upload error:', error);
      throw new Error('Failed to upload image');
    }
  }
  
  /**
   * Upload multiple images
   */
  static async uploadMultipleImages(files: Express.Multer.File[]): Promise<string[]> {
    const uploadPromises = files.map(file => this.uploadImage(file));
    return await Promise.all(uploadPromises);
  }
  
  /**
   * Delete image
   */
  static async deleteImage(url: string): Promise<void> {
    try {
      if (UPLOAD_PROVIDER === 'CLOUDINARY') {
        await this.deleteFromCloudinary(url);
      } else {
        await this.deleteFromS3(url);
      }
    } catch (error) {
      console.error('Image delete error:', error);
      throw new Error('Failed to delete image');
    }
  }
  
  /**
   * Generate thumbnail
   */
  static async generateThumbnail(buffer: Buffer): Promise<Buffer> {
    return await sharp(buffer)
      .resize(300, 400, {
        fit: 'cover',
      })
      .jpeg({ quality: 80 })
      .toBuffer();
  }
}

export default ImageUploadService;

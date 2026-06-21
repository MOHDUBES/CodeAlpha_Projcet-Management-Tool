import { cloudinary } from '../config/cloudinary';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';

interface UploadOptions {
  folder?: string;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  transformation?: object[];
  maxWidth?: number;
  maxHeight?: number;
}

export const uploadToCloudinary = async (
  buffer: Buffer,
  options: UploadOptions = {}
): Promise<{ url: string; publicId: string; resourceType: string }> => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: options.folder || 'pm-saas',
      resource_type: options.resourceType || 'auto',
      ...(options.transformation && { transformation: options.transformation }),
    };

    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          logger.error(`Cloudinary upload error: ${error.message}`);
          reject(new AppError('File upload failed', 500));
          return;
        }
        if (!result) {
          reject(new AppError('Upload returned no result', 500));
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type,
        });
      }
    );
    stream.end(buffer);
  });
};

export const deleteFromCloudinary = async (
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    logger.info(`Deleted from Cloudinary: ${publicId}`);
  } catch (error) {
    logger.error(`Cloudinary delete error: ${error}`);
  }
};

export const uploadAvatar = async (buffer: Buffer): Promise<{ url: string; publicId: string }> => {
  const result = await uploadToCloudinary(buffer, {
    folder: 'pm-saas/avatars',
    resourceType: 'image',
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  });
  return { url: result.url, publicId: result.publicId };
};

export const uploadProjectLogo = async (buffer: Buffer): Promise<{ url: string; publicId: string }> => {
  const result = await uploadToCloudinary(buffer, {
    folder: 'pm-saas/project-logos',
    resourceType: 'image',
    transformation: [
      { width: 200, height: 200, crop: 'fill' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  });
  return { url: result.url, publicId: result.publicId };
};

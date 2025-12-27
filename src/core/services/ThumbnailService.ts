import imageCompression from "browser-image-compression";
import { maxSize } from "zod";

export class ThumbnailService {
  private static readonly MAX_WIDTH_OR_HEIGHT = 300;
  private static readonly MAX_SIZE_MB = 1;
  private static readonly QUALITY = 0.8;

  static async createThumbnail(originalFile: File): Promise<File> {
    const options = {
      maxSizeMB: this.MAX_SIZE_MB,
      maxWidthOrHeight: this.MAX_WIDTH_OR_HEIGHT,
      useWebWorker: true,
      fileType: originalFile.type,
      initialQuality: this.QUALITY,
    };

    const compressedBlob = await imageCompression(originalFile, options);
    const originalName = originalFile.name;
    const extension = originalName.substring(originalName.lastIndexOf("."));
    const thumbnailName = originalName.replace(extension, `_thumb${extension}`);
    return new File([compressedBlob], thumbnailName, { type: originalFile.type });
  };

  static getLocalPreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  static revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url);
  }

}
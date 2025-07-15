import React from "react";
import {
  MAX_FILE_SIZE,
  MAX_FILE_SIZE_DISPLAY,
} from "@/constraints/chat-constraints";
import { FileText, Image as ImageIcon, File } from "lucide-react";

// Helper function to get file icon based on mime type
export const getFileIcon = (contentType: string) => {
  if (contentType.startsWith("image/")) {
    return <ImageIcon className='w-4 h-4' />;
  }
  if (contentType.includes("pdf")) {
    return <FileText className='w-4 h-4' />;
  }
  if (contentType.includes("text/")) {
    return <FileText className='w-4 h-4' />;
  }
  return <File className='w-4 h-4' />;
};

// Helper function to format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

// Helper function to resize images for optimal LLM processing
export const resizeImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    // Only process image files
    if (!file.type.startsWith("image/")) {
      resolve(file);
      return;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      const MAX_DIMENSION = 896;
      const { width, height } = img;

      // Only resize if the image is larger than 896x896
      if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
        resolve(file);
        return;
      }

      // Calculate scaling factor
      const scale = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
      const newWidth = Math.floor(width * scale);
      const newHeight = Math.floor(height * scale);

      // Set canvas dimensions
      canvas.width = newWidth;
      canvas.height = newHeight;

      // Draw the resized image
      ctx?.drawImage(img, 0, 0, newWidth, newHeight);

      // Convert canvas to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // Create a new file with the resized image
            const resizedFile = new globalThis.File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(resizedFile);
          } else {
            reject(new Error("Failed to resize image"));
          }
        },
        file.type,
        0.9 // Quality factor for JPEG compression
      );
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    // Create object URL for the image
    img.src = URL.createObjectURL(file);
  });
};

// Helper function to process multiple files (resize images)
export const processFiles = async (files: FileList): Promise<File[]> => {
  const fileArray = Array.from(files);
  const processedFiles: File[] = [];

  for (const file of fileArray) {
    try {
      const processedFile = await resizeImage(file);
      processedFiles.push(processedFile);
    } catch (error) {
      console.error(`Failed to process file ${file.name}:`, error);
      // Fall back to original file if processing fails
      processedFiles.push(file);
    }
  }

  return processedFiles;
};

// File validation function
export const validateFiles = (
  files: File[]
): { isValid: boolean; error?: string } => {
  const oversizedFiles: string[] = [];

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      oversizedFiles.push(file.name);
    }
  }

  if (oversizedFiles.length > 0) {
    const fileList = oversizedFiles.join(", ");
    return {
      isValid: false,
      error: `The following file${oversizedFiles.length > 1 ? "s" : ""} exceed${
        oversizedFiles.length === 1 ? "s" : ""
      } the ${MAX_FILE_SIZE_DISPLAY} limit: ${fileList}`,
    };
  }

  return { isValid: true };
};

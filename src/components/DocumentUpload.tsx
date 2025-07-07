"use client";

import React, { useState } from "react";
import {
  Upload,
  File,
  CheckCircle,
  AlertCircle,
  X,
  Loader2,
} from "lucide-react";

interface DocumentUploadProps {
  collectionName: string;
  onDocumentsAdded?: () => void;
  useOllamaEmbedding?: boolean;
}

interface UploadStatus {
  status: "idle" | "processing" | "success" | "error";
  message?: string;
  progress?: {
    current: number;
    total: number;
    step: string;
  };
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  collectionName,
  onDocumentsAdded,
  useOllamaEmbedding = false,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    status: "idle",
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === "application/pdf") {
        setSelectedFile(file);
        setUploadStatus({ status: "idle" });
      } else {
        setUploadStatus({
          status: "error",
          message: "Please select a PDF file only.",
        });
      }
    }
  };

  const processAndUploadDocument = async () => {
    if (!selectedFile) return;

    setUploadStatus({
      status: "processing",
      progress: { current: 1, total: 3, step: "Uploading PDF..." },
    });

    try {
      // Step 1: Upload and process PDF on server
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("collectionName", collectionName);
      formData.append("useOllamaEmbedding", useOllamaEmbedding.toString());

      setUploadStatus({
        status: "processing",
        progress: {
          current: 2,
          total: 3,
          step: "Processing PDF and generating embeddings...",
        },
      });

      const response = await fetch("/api/process-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        // Try to parse error response, fallback to status text
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If response is not JSON, use the status text
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to process PDF");
      }

      setUploadStatus({
        status: "processing",
        progress: { current: 3, total: 3, step: "Finalizing..." },
      });

      setUploadStatus({
        status: "success",
        message: `Successfully added ${result.data.totalChunks} document chunks to the collection.`,
      });

      // Clear selected file
      setSelectedFile(null);

      // Notify parent component
      if (onDocumentsAdded) {
        onDocumentsAdded();
      }
    } catch (error) {
      console.error("Error processing document:", error);
      setUploadStatus({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to process document.",
      });
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setUploadStatus({ status: "idle" });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 p-6'>
      <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2'>
        <Upload className='w-5 h-5' />
        Add Documents
      </h3>

      {!selectedFile ? (
        <div className='space-y-4'>
          <div className='text-center'>
            <File className='w-12 h-12 text-gray-400 mx-auto mb-4' />
            <p className='text-gray-600 dark:text-gray-300 mb-4'>
              Select a PDF file to add to the collection
            </p>
            <label htmlFor='file-input' className='inline-block'>
              <span className='bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg cursor-pointer transition-colors font-medium'>
                Select PDF File
              </span>
              <input
                id='file-input'
                type='file'
                accept='.pdf'
                onChange={handleFileSelect}
                className='hidden'
              />
            </label>
            <p className='text-xs text-gray-500 dark:text-gray-400 mt-3'>
              PDF files only. Max size: 10MB
            </p>
          </div>
        </div>
      ) : (
        <div className='space-y-4'>
          {/* Selected File Display */}
          <div className='flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg'>
            <div className='flex items-center gap-3'>
              <File className='w-6 h-6 text-red-500' />
              <div>
                <p className='font-medium text-gray-900 dark:text-white'>
                  {selectedFile.name}
                </p>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            {uploadStatus.status === "idle" && (
              <button
                onClick={clearFile}
                className='p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded'
              >
                <X className='w-4 h-4 text-gray-500' />
              </button>
            )}
          </div>

          {/* Processing Status */}
          {uploadStatus.status === "processing" && uploadStatus.progress && (
            <div className='space-y-2'>
              <div className='flex items-center justify-between text-sm'>
                <span className='text-gray-600 dark:text-gray-300'>
                  {uploadStatus.progress.step}
                </span>
                <span className='text-gray-500 dark:text-gray-400'>
                  {uploadStatus.progress.current} /{" "}
                  {uploadStatus.progress.total}
                </span>
              </div>
              <div className='w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2'>
                <div
                  className='bg-blue-600 h-2 rounded-full transition-all duration-300'
                  style={{
                    width: `${
                      (uploadStatus.progress.current /
                        uploadStatus.progress.total) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Status Messages */}
          {uploadStatus.status === "success" && (
            <div className='flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-lg'>
              <CheckCircle className='w-5 h-5' />
              <p className='text-sm'>{uploadStatus.message}</p>
            </div>
          )}

          {uploadStatus.status === "error" && (
            <div className='flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg'>
              <AlertCircle className='w-5 h-5' />
              <p className='text-sm'>{uploadStatus.message}</p>
            </div>
          )}

          {/* Upload Button */}
          {uploadStatus.status === "idle" && (
            <button
              onClick={processAndUploadDocument}
              className='w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2'
            >
              <Upload className='w-4 h-4' />
              Process and Add to Collection
            </button>
          )}

          {uploadStatus.status === "processing" && (
            <button
              disabled
              className='w-full bg-gray-400 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2'
            >
              <Loader2 className='w-4 h-4 animate-spin' />
              Processing...
            </button>
          )}
        </div>
      )}

      {/* Info Section */}
      <div className='mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
        <h4 className='text-sm font-medium text-blue-800 dark:text-blue-200 mb-1'>
          How it works:
        </h4>
        <ul className='text-xs text-blue-700 dark:text-blue-300 space-y-1'>
          <li>• PDF is uploaded and processed on the server</li>
          <li>
            • Text is extracted and split into chunks (2500 chars, 250 overlap)
          </li>
          <li>
            • {useOllamaEmbedding ? "Ollama embeddings" : "Default embeddings"}{" "}
            are generated server-side
          </li>
          <li>• Chunks are added directly to the collection</li>
        </ul>
      </div>
    </div>
  );
};

export default DocumentUpload;

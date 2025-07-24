"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Database,
  FileText,
  ChevronLeft,
  ChevronRight,
  Upload,
  File,
  CheckCircle,
  AlertCircle,
  X,
  Loader2,
} from "lucide-react";
import {
  Collection,
  chromaDBManager,
  CollectionDocument,
} from "@/lib/chromadb";

interface UploadStatus {
  status: "idle" | "processing" | "success" | "error";
  message?: string;
  progress?: {
    current: number;
    total: number;
    step: string;
  };
  telemetry?: {
    startTime?: number;
    uploadTime?: number;
    processingTime?: number;
    totalTime?: number;
    fileSize?: number;
    textLength?: number;
    totalPages?: number;
    totalChunks?: number;
    embeddingDimensions?: number;
    avgChunkSize?: number;
    embeddingsGenerated?: boolean;
  };
  detailedSteps?: {
    upload: {
      status: "pending" | "processing" | "complete" | "error";
      time?: number;
    };
    parsing: {
      status: "pending" | "processing" | "complete" | "error";
      time?: number;
    };
    chunking: {
      status: "pending" | "processing" | "complete" | "error";
      time?: number;
    };
    embedding: {
      status: "pending" | "processing" | "complete" | "error";
      time?: number;
    };
    storage: {
      status: "pending" | "processing" | "complete" | "error";
      time?: number;
    };
  };
}

interface CollectionDetailProps {
  collection: Collection;
  onBack: () => void;
  onCollectionUpdated?: () => void;
}

const CollectionDetail: React.FC<CollectionDetailProps> = ({
  collection,
  onBack,
  onCollectionUpdated,
}) => {
  const [documents, setDocuments] = useState<CollectionDocument[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    status: "idle",
  });
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [selectedDocument, setSelectedDocument] =
    useState<CollectionDocument | null>(null);
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);

  const documentsPerPage = 20; // Configurable page size

  useEffect(() => {
    const loadDocuments = async () => {
      setLoading(true);
      setError(null);
      try {
        const offset = (currentPage - 1) * documentsPerPage;
        const response = await chromaDBManager.getCollectionDocuments(
          collection.name,
          documentsPerPage,
          offset
        );
        setDocuments(response.documents);
        setTotalCount(response.totalCount);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch documents";
        console.error("Failed to fetch documents:", err);
        setError(errorMessage);
        setDocuments([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };

    loadDocuments();
  }, [collection.id, collection.name, currentPage, documentsPerPage]);

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

    const startTime = Date.now();
    const controller = new AbortController();
    setAbortController(controller);

    // Initialize detailed step tracking
    const initialSteps = {
      upload: { status: "pending" as const },
      parsing: { status: "pending" as const },
      chunking: { status: "pending" as const },
      embedding: { status: "pending" as const },
      storage: { status: "pending" as const },
    };

    setUploadStatus({
      status: "processing",
      progress: { current: 0, total: 4, step: "Preparing upload..." },
      telemetry: {
        startTime,
        fileSize: selectedFile.size,
      },
      detailedSteps: initialSteps,
    });

    try {
      // Step 1: Upload
      setUploadStatus((prev) => ({
        ...prev,
        progress: { current: 1, total: 4, step: "Uploading PDF file..." },
        detailedSteps: {
          ...prev.detailedSteps!,
          upload: { status: "processing" },
        },
      }));

      const uploadStartTime = Date.now();
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("collectionName", collection.name);
      formData.append("useOllamaEmbedding", "true");

      // Use the streaming endpoint for real-time updates
      const response = await fetch("/api/process-pdf-stream", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If response is not JSON, use the status text
        }
        throw new Error(errorMessage);
      }

      // Process Server-Sent Events
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response stream available");
      }

      let buffer = "";

      while (true) {
        // Check if cancelled
        if (controller.signal.aborted) {
          throw new Error("Upload cancelled by user");
        }

        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete lines
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep the incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              await handleStreamUpdate(data, startTime, uploadStartTime);
            } catch (error) {
              console.error("Error parsing SSE data:", error);
            }
          }
        }
      }

      // Clear selected file and abort controller
      setSelectedFile(null);
      setAbortController(null);

      // Refresh documents
      handleDocumentsAdded();
    } catch (error) {
      console.error("Error processing document:", error);
      const totalTime = Date.now() - startTime;

      // Clear abort controller
      setAbortController(null);

      // Handle cancellation vs actual error
      if (
        error instanceof Error &&
        error.message === "Upload cancelled by user"
      ) {
        setUploadStatus({
          status: "error",
          message: "Upload cancelled by user. Performing cleanup...",
        });

        // Perform cleanup
        await performCleanup();
      } else if (error instanceof Error && error.name === "AbortError") {
        setUploadStatus({
          status: "error",
          message: "Upload cancelled by user. Performing cleanup...",
        });

        // Perform cleanup
        await performCleanup();
      } else {
        setUploadStatus((prev) => ({
          ...prev,
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Failed to process document.",
          telemetry: {
            ...prev.telemetry,
            totalTime,
          },
        }));
      }
    }
  };

  const handleStreamUpdate = async (
    data: {
      type: string;
      step?: string;
      status?: string;
      message?: string;
      time?: number;
      pages?: number;
      textLength?: number;
      chunks?: number;
      dimensions?: number;
      progress?: number;
      error?: string;
      data?: {
        totalChunks: number;
        totalPages: number;
        embeddingsGenerated: boolean;
        embeddingDimensions?: number;
        processingMetrics?: {
          totalTime: number;
          parseTime: number;
          chunkingTime: number;
          embeddingTime: number;
          storageTime: number;
          avgChunkSize: number;
          textLength: number;
        };
      };
    },
    startTime: number,
    uploadStartTime: number
  ) => {
    switch (data.type) {
      case "progress":
        if (data.step === "upload" && data.status === "complete") {
          setUploadStatus((prev) => ({
            ...prev,
            progress: {
              current: 1,
              total: 4,
              step: "Upload completed, starting server processing...",
            },
            detailedSteps: {
              ...prev.detailedSteps!,
              upload: {
                status: "complete",
                time: data.time || Date.now() - uploadStartTime,
              },
            },
          }));
        }

        if (data.step === "parsing") {
          if (data.status === "processing") {
            setUploadStatus((prev) => ({
              ...prev,
              progress: {
                current: 2,
                total: 4,
                step: "Parsing PDF content...",
              },
              detailedSteps: {
                ...prev.detailedSteps!,
                parsing: { status: "processing" },
              },
            }));
          } else if (data.status === "complete") {
            setUploadStatus((prev) => ({
              ...prev,
              detailedSteps: {
                ...prev.detailedSteps!,
                parsing: { status: "complete", time: data.time },
              },
              telemetry: {
                ...prev.telemetry!,
                totalPages: data.pages,
                textLength: data.textLength,
              },
            }));
          }
        }

        if (data.step === "chunking") {
          if (data.status === "processing") {
            setUploadStatus((prev) => ({
              ...prev,
              progress: {
                current: 2,
                total: 4,
                step: "Splitting text into chunks...",
              },
              detailedSteps: {
                ...prev.detailedSteps!,
                chunking: { status: "processing" },
              },
            }));
          } else if (data.status === "complete") {
            setUploadStatus((prev) => ({
              ...prev,
              detailedSteps: {
                ...prev.detailedSteps!,
                chunking: { status: "complete", time: data.time },
              },
              telemetry: {
                ...prev.telemetry!,
                totalChunks: data.chunks,
              },
            }));
          }
        }

        if (data.step === "embedding") {
          if (data.status === "processing") {
            const progressMsg = data.progress
              ? `Generating embeddings... ${data.progress}%`
              : "Generating AI embeddings...";
            setUploadStatus((prev) => ({
              ...prev,
              progress: { current: 3, total: 4, step: progressMsg },
              detailedSteps: {
                ...prev.detailedSteps!,
                embedding: { status: "processing" },
              },
            }));
          } else if (data.status === "complete") {
            setUploadStatus((prev) => ({
              ...prev,
              detailedSteps: {
                ...prev.detailedSteps!,
                embedding: { status: "complete", time: data.time },
              },
              telemetry: {
                ...prev.telemetry!,
                embeddingDimensions: data.dimensions,
                embeddingsGenerated: true,
              },
            }));
          }
        }

        if (data.step === "storage") {
          if (data.status === "processing") {
            setUploadStatus((prev) => ({
              ...prev,
              progress: {
                current: 4,
                total: 4,
                step: "Storing in ChromaDB...",
              },
              detailedSteps: {
                ...prev.detailedSteps!,
                storage: { status: "processing" },
              },
            }));
          } else if (data.status === "complete") {
            setUploadStatus((prev) => ({
              ...prev,
              detailedSteps: {
                ...prev.detailedSteps!,
                storage: { status: "complete", time: data.time },
              },
            }));
          }
        }
        break;

      case "complete":
        if (!data.data || !selectedFile) {
          throw new Error("Invalid completion data or missing file");
        }

        const totalTime = Date.now() - startTime;
        const metrics = data.data.processingMetrics;

        setUploadStatus({
          status: "success",
          message: `Successfully processed "${selectedFile.name}" and added ${data.data.totalChunks} chunks to the collection.`,
          telemetry: {
            startTime,
            uploadTime: Date.now() - uploadStartTime,
            processingTime: totalTime,
            totalTime,
            fileSize: selectedFile.size,
            textLength: metrics?.textLength || 0,
            totalPages: data.data.totalPages,
            totalChunks: data.data.totalChunks,
            embeddingDimensions: data.data.embeddingDimensions,
            avgChunkSize: metrics?.avgChunkSize || 0,
            embeddingsGenerated: data.data.embeddingsGenerated,
          },
          detailedSteps: {
            upload: { status: "complete", time: Date.now() - uploadStartTime },
            parsing: { status: "complete", time: metrics?.parseTime || 0 },
            chunking: { status: "complete", time: metrics?.chunkingTime || 0 },
            embedding: {
              status: "complete",
              time: metrics?.embeddingTime || 0,
            },
            storage: { status: "complete", time: metrics?.storageTime || 0 },
          },
        });
        break;

      case "error":
        throw new Error(data.error);
    }
  };

  const clearFile = async () => {
    // If processing, we need to cancel and cleanup
    if (uploadStatus.status === "processing" && abortController) {
      setIsCancelling(true);

      // Cancel the ongoing upload
      abortController.abort();
      setAbortController(null);

      // Show cancelling status
      setUploadStatus({
        status: "error",
        message: "Cancelling upload and performing cleanup...",
      });

      // Perform cleanup
      await performCleanup();
      setIsCancelling(false);
    } else {
      // Just clear the file selection
      setSelectedFile(null);
      setUploadStatus({ status: "idle" });

      // Cancel any pending upload
      if (abortController) {
        abortController.abort();
        setAbortController(null);
      }
    }
  };

  const performCleanup = async () => {
    try {
      // Call a cleanup endpoint to remove any partially processed data
      const response = await fetch("/api/cancel-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          collectionName: collection.name,
          fileName: selectedFile?.name,
        }),
      });

      if (!response.ok) {
        console.error("Cleanup failed:", response.statusText);
      } else {
        console.log("Cleanup completed successfully");
      }
    } catch (error) {
      console.error("Error during cleanup:", error);
    } finally {
      // Reset state regardless of cleanup success
      setUploadStatus({
        status: "idle",
        message: "Upload cancelled and cleaned up.",
      });
      setSelectedFile(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  };

  const formatProcessingRate = (chunks: number, timeMs: number): string => {
    const rate = chunks / (timeMs / 1000);
    return `${rate.toFixed(1)} chunks/sec`;
  };

  const getStepIcon = (
    status: "pending" | "processing" | "complete" | "error"
  ) => {
    switch (status) {
      case "complete":
        return <CheckCircle className='w-4 h-4 text-green-500' />;
      case "processing":
        return <Loader2 className='w-4 h-4 animate-spin text-blue-500' />;
      case "error":
        return <AlertCircle className='w-4 h-4 text-red-500' />;
      default:
        return (
          <div className='w-4 h-4 rounded-full border-2 border-gray-300' />
        );
    }
  };

  const estimateTimeRemaining = (
    currentStep: number,
    totalSteps: number,
    elapsedTime: number
  ): string => {
    if (currentStep === 0) return "Calculating...";
    const avgTimePerStep = elapsedTime / currentStep;
    const remainingSteps = totalSteps - currentStep;
    const estimatedRemaining = remainingSteps * avgTimePerStep;
    return formatDuration(estimatedRemaining);
  };

  const getProgressColor = (progress: number): string => {
    if (progress < 30) return "bg-red-500";
    if (progress < 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  const handleDocumentsAdded = () => {
    // Refresh the documents list and go to first page
    setCurrentPage(1);
    const loadDocuments = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await chromaDBManager.getCollectionDocuments(
          collection.name,
          documentsPerPage,
          0
        );
        setDocuments(response.documents);
        setTotalCount(response.totalCount);

        // Notify parent component about collection update
        onCollectionUpdated?.();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch documents";
        console.error("Failed to fetch documents:", err);
        setError(errorMessage);
        setDocuments([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };

    loadDocuments();
  };

  const getDocumentContent = (doc: CollectionDocument): string => {
    const content = doc.document || `Document ID: ${doc.id}`;
    // Truncate long content for better UI display
    return content.length > 200 ? content.substring(0, 200) + "..." : content;
  };

  const totalPages = Math.ceil(totalCount / documentsPerPage);
  const startIndex = (currentPage - 1) * documentsPerPage + 1;
  const endIndex = Math.min(currentPage * documentsPerPage, totalCount);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };

  const handleDocumentClick = (doc: CollectionDocument) => {
    setSelectedDocument(doc);
    setShowDocumentDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDocumentDialog(false);
    setSelectedDocument(null);
  };

  return (
    <div className='space-y-6 h-full max-h-[calc(100vh-2rem)] overflow-hidden'>
      {/* Header */}
      <div className='flex items-center gap-3 flex-shrink-0'>
        <button
          onClick={onBack}
          className='p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors'
          aria-label='Back to collections'
        >
          <ArrowLeft className='w-5 h-5 text-gray-500 dark:text-gray-400' />
        </button>
        <div className='flex items-center gap-2'>
          <div className='w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center'>
            <Database className='w-4 h-4 text-blue-600 dark:text-blue-400' />
          </div>
          <div>
            <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
              {collection.name}
            </h2>
            <p className='text-sm text-gray-500 dark:text-gray-400'>
              Collection Details
            </p>
          </div>
        </div>
      </div>

      {/* Add Documents Section */}
      <div className='bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex-shrink-0'>
        <h3 className='text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2'>
          <Upload className='w-4 h-4' />
          Add Documents
        </h3>

        {!selectedFile ? (
          <div className='flex items-center gap-3'>
            <label htmlFor='file-input' className='inline-block'>
              <span className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors font-medium text-sm flex items-center gap-2'>
                <Upload className='w-4 h-4' />
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
            <span className='text-xs text-gray-500 dark:text-gray-400'>
              PDF files only, max 10MB
            </span>
          </div>
        ) : (
          <div className='space-y-3'>
            {/* Selected File Display */}
            <div className='flex items-center justify-between p-3 bg-white dark:bg-gray-600 rounded border'>
              <div className='flex items-center gap-2'>
                <File className='w-4 h-4 text-red-500' />
                <div>
                  <p className='text-sm font-medium text-gray-900 dark:text-white'>
                    {selectedFile.name}
                  </p>
                  <p className='text-xs text-gray-500 dark:text-gray-400'>
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>
              {(uploadStatus.status === "idle" ||
                uploadStatus.status === "error") && (
                <button
                  onClick={clearFile}
                  className='p-1 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 rounded transition-colors'
                  title='Remove selected file'
                >
                  <X className='w-4 h-4 text-red-600 dark:text-red-400' />
                </button>
              )}
            </div>

            {/* Processing Status */}
            {uploadStatus.status === "processing" && uploadStatus.progress && (
              <div className='space-y-4'>
                {/* Progress Bar */}
                <div className='space-y-2'>
                  <div className='flex items-center justify-between text-sm'>
                    <span className='text-gray-600 dark:text-gray-300'>
                      {uploadStatus.progress.step}
                    </span>
                    <div className='flex items-center gap-2'>
                      <span className='text-gray-500 dark:text-gray-400'>
                        {uploadStatus.progress.current} /{" "}
                        {uploadStatus.progress.total}
                      </span>
                      {uploadStatus.telemetry?.startTime && (
                        <span className='text-xs text-gray-400'>
                          ETA:{" "}
                          {estimateTimeRemaining(
                            uploadStatus.progress.current,
                            uploadStatus.progress.total,
                            Date.now() - uploadStatus.telemetry.startTime
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className='w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2'>
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(
                        (uploadStatus.progress.current /
                          uploadStatus.progress.total) *
                          100
                      )}`}
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

                {/* Detailed Step Progress */}
                {uploadStatus.detailedSteps && (
                  <div className='bg-gray-50 dark:bg-gray-700 rounded-lg p-4'>
                    <h4 className='text-sm font-medium text-gray-900 dark:text-white mb-3'>
                      Processing Steps
                    </h4>
                    <div className='space-y-2'>
                      <div className='flex items-center gap-3 text-sm'>
                        {getStepIcon(uploadStatus.detailedSteps.upload.status)}
                        <span className='text-gray-700 dark:text-gray-300'>
                          Upload PDF file
                        </span>
                        <span className='text-xs text-gray-500'>
                          {uploadStatus.detailedSteps.upload.status ===
                            "processing" && "Transferring..."}
                          {uploadStatus.detailedSteps.upload.status ===
                            "complete" && "✓ Uploaded"}
                        </span>
                        {uploadStatus.detailedSteps.upload.time && (
                          <span className='text-xs text-gray-500 ml-auto'>
                            {formatDuration(
                              uploadStatus.detailedSteps.upload.time
                            )}
                          </span>
                        )}
                      </div>
                      <div className='flex items-center gap-3 text-sm'>
                        {getStepIcon(uploadStatus.detailedSteps.parsing.status)}
                        <span className='text-gray-700 dark:text-gray-300'>
                          Parse PDF content
                        </span>
                        <span className='text-xs text-gray-500'>
                          {uploadStatus.detailedSteps.parsing.status ===
                            "processing" && "Processing on server..."}
                          {uploadStatus.detailedSteps.parsing.status ===
                            "complete" && "✓ Text extracted"}
                        </span>
                        {uploadStatus.detailedSteps.parsing.time && (
                          <span className='text-xs text-gray-500 ml-auto'>
                            {formatDuration(
                              uploadStatus.detailedSteps.parsing.time
                            )}
                          </span>
                        )}
                      </div>
                      <div className='flex items-center gap-3 text-sm'>
                        {getStepIcon(
                          uploadStatus.detailedSteps.chunking.status
                        )}
                        <span className='text-gray-700 dark:text-gray-300'>
                          Split into chunks
                        </span>
                        <span className='text-xs text-gray-500'>
                          {uploadStatus.detailedSteps.chunking.status ===
                            "processing" && "Processing on server..."}
                          {uploadStatus.detailedSteps.chunking.status ===
                            "complete" && "✓ Chunks created"}
                        </span>
                        {uploadStatus.detailedSteps.chunking.time && (
                          <span className='text-xs text-gray-500 ml-auto'>
                            {formatDuration(
                              uploadStatus.detailedSteps.chunking.time
                            )}
                          </span>
                        )}
                      </div>
                      <div className='flex items-center gap-3 text-sm'>
                        {getStepIcon(
                          uploadStatus.detailedSteps.embedding.status
                        )}
                        <span className='text-gray-700 dark:text-gray-300'>
                          Generate Ollama embeddings
                        </span>
                        <span className='text-xs text-gray-500'>
                          {uploadStatus.detailedSteps.embedding.status ===
                            "processing" && "Processing on server..."}
                          {uploadStatus.detailedSteps.embedding.status ===
                            "complete" && "✓ Vectors generated"}
                        </span>
                        {uploadStatus.detailedSteps.embedding.time && (
                          <span className='text-xs text-gray-500 ml-auto'>
                            {formatDuration(
                              uploadStatus.detailedSteps.embedding.time
                            )}
                          </span>
                        )}
                      </div>
                      <div className='flex items-center gap-3 text-sm'>
                        {getStepIcon(uploadStatus.detailedSteps.storage.status)}
                        <span className='text-gray-700 dark:text-gray-300'>
                          Store in ChromaDB
                        </span>
                        <span className='text-xs text-gray-500'>
                          {uploadStatus.detailedSteps.storage.status ===
                            "processing" && "Processing on server..."}
                          {uploadStatus.detailedSteps.storage.status ===
                            "complete" && "✓ Stored successfully"}
                        </span>
                        {uploadStatus.detailedSteps.storage.time && (
                          <span className='text-xs text-gray-500 ml-auto'>
                            {formatDuration(
                              uploadStatus.detailedSteps.storage.time
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Real-time Telemetry */}
                {uploadStatus.telemetry && (
                  <div className='bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3'>
                    <h5 className='text-xs font-medium text-blue-800 dark:text-blue-200 mb-2'>
                      Processing Metrics
                    </h5>
                    <div className='grid grid-cols-2 gap-3 text-xs'>
                      <div>
                        <span className='text-blue-700 dark:text-blue-300 font-medium'>
                          File Size:
                        </span>
                        <span className='text-blue-600 dark:text-blue-400 ml-2'>
                          {formatFileSize(uploadStatus.telemetry.fileSize || 0)}
                        </span>
                      </div>
                      <div>
                        <span className='text-blue-700 dark:text-blue-300 font-medium'>
                          Elapsed:
                        </span>
                        <span className='text-blue-600 dark:text-blue-400 ml-2'>
                          {formatDuration(
                            Date.now() - (uploadStatus.telemetry.startTime || 0)
                          )}
                        </span>
                      </div>
                      <div>
                        <span className='text-blue-700 dark:text-blue-300 font-medium'>
                          Processing:
                        </span>
                        <span className='text-blue-600 dark:text-blue-400 ml-2'>
                          {uploadStatus.progress?.current || 0}/
                          {uploadStatus.progress?.total || 4} steps
                        </span>
                      </div>
                    </div>
                    {/* Server processing notice */}
                    {uploadStatus.progress?.current === 2 && (
                      <div className='mt-2 text-xs text-blue-600 dark:text-blue-400'>
                        📡 Server is processing your PDF - this may take a
                        moment for large files (AI embedding generation in
                        progress)
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Status Messages */}
            {uploadStatus.status === "success" && (
              <div className='space-y-4'>
                {/* Success Message */}
                <div className='flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-lg'>
                  <CheckCircle className='w-5 h-5' />
                  <p className='text-sm'>{uploadStatus.message}</p>
                </div>

                {/* Detailed Telemetry */}
                {uploadStatus.telemetry && (
                  <div className='bg-gray-50 dark:bg-gray-700 rounded-lg p-4'>
                    <h4 className='text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2'>
                      <File className='w-4 h-4' />
                      Processing Summary
                    </h4>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
                      {/* File Information */}
                      <div className='space-y-2'>
                        <h5 className='font-medium text-gray-800 dark:text-gray-200'>
                          Document Info
                        </h5>
                        <div className='space-y-1 text-xs'>
                          <div className='flex justify-between'>
                            <span className='text-gray-600 dark:text-gray-400'>
                              File Size:
                            </span>
                            <span className='text-gray-900 dark:text-white'>
                              {formatFileSize(
                                uploadStatus.telemetry.fileSize || 0
                              )}
                            </span>
                          </div>
                          <div className='flex justify-between'>
                            <span className='text-gray-600 dark:text-gray-400'>
                              Total Pages:
                            </span>
                            <span className='text-gray-900 dark:text-white'>
                              {uploadStatus.telemetry.totalPages || "N/A"}
                            </span>
                          </div>
                          <div className='flex justify-between'>
                            <span className='text-gray-600 dark:text-gray-400'>
                              Total Chunks:
                            </span>
                            <span className='text-gray-900 dark:text-white'>
                              {uploadStatus.telemetry.totalChunks || 0}
                            </span>
                          </div>
                          <div className='flex justify-between'>
                            <span className='text-gray-600 dark:text-gray-400'>
                              Text Length:
                            </span>
                            <span className='text-gray-900 dark:text-white'>
                              {uploadStatus.telemetry.textLength?.toLocaleString() ||
                                "N/A"}{" "}
                              chars
                            </span>
                          </div>
                          <div className='flex justify-between'>
                            <span className='text-gray-600 dark:text-gray-400'>
                              Avg Chunk Size:
                            </span>
                            <span className='text-gray-900 dark:text-white'>
                              {uploadStatus.telemetry.avgChunkSize
                                ? `${uploadStatus.telemetry.avgChunkSize} chars`
                                : "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Performance Metrics */}
                      <div className='space-y-2'>
                        <h5 className='font-medium text-gray-800 dark:text-gray-200'>
                          Performance
                        </h5>
                        <div className='space-y-1 text-xs'>
                          <div className='flex justify-between'>
                            <span className='text-gray-600 dark:text-gray-400'>
                              Total Time:
                            </span>
                            <span className='text-gray-900 dark:text-white'>
                              {formatDuration(
                                uploadStatus.telemetry.totalTime || 0
                              )}
                            </span>
                          </div>
                          <div className='flex justify-between'>
                            <span className='text-gray-600 dark:text-gray-400'>
                              Processing Rate:
                            </span>
                            <span className='text-gray-900 dark:text-white'>
                              {uploadStatus.telemetry.totalChunks &&
                              uploadStatus.telemetry.totalTime
                                ? formatProcessingRate(
                                    uploadStatus.telemetry.totalChunks,
                                    uploadStatus.telemetry.totalTime
                                  )
                                : "N/A"}
                            </span>
                          </div>
                          <div className='flex justify-between'>
                            <span className='text-gray-600 dark:text-gray-400'>
                              Throughput:
                            </span>
                            <span className='text-gray-900 dark:text-white'>
                              {uploadStatus.telemetry.fileSize &&
                              uploadStatus.telemetry.totalTime
                                ? `${(
                                    uploadStatus.telemetry.fileSize /
                                    1024 /
                                    1024 /
                                    (uploadStatus.telemetry.totalTime / 1000)
                                  ).toFixed(2)} MB/s`
                                : "N/A"}
                            </span>
                          </div>
                          <div className='flex justify-between'>
                            <span className='text-gray-600 dark:text-gray-400'>
                              Embeddings:
                            </span>
                            <span className='text-gray-900 dark:text-white'>
                              {uploadStatus.telemetry.embeddingsGenerated
                                ? "Generated"
                                : "Skipped"}
                            </span>
                          </div>
                          {uploadStatus.telemetry.embeddingDimensions && (
                            <div className='flex justify-between'>
                              <span className='text-gray-600 dark:text-gray-400'>
                                Dimensions:
                              </span>
                              <span className='text-gray-900 dark:text-white'>
                                {uploadStatus.telemetry.embeddingDimensions}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Processing Steps Summary */}
                    <div className='mt-4 pt-3 border-t border-gray-200 dark:border-gray-600'>
                      <h5 className='font-medium text-gray-800 dark:text-gray-200 mb-2'>
                        Step Breakdown
                      </h5>
                      <div className='flex flex-wrap gap-2 text-xs'>
                        {uploadStatus.detailedSteps &&
                          Object.entries(uploadStatus.detailedSteps).map(
                            ([step, data]) => (
                              <div
                                key={step}
                                className='flex items-center gap-1 bg-white dark:bg-gray-600 px-2 py-1 rounded'
                              >
                                {getStepIcon(data.status)}
                                <span className='capitalize text-gray-700 dark:text-gray-300'>
                                  {step}
                                </span>
                                {data.time && (
                                  <span className='text-gray-500 dark:text-gray-400'>
                                    ({formatDuration(data.time)})
                                  </span>
                                )}
                              </div>
                            )
                          )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {uploadStatus.status === "error" && (
              <div className='flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded border border-red-200 dark:border-red-700'>
                <AlertCircle className='w-4 h-4' />
                <p className='text-xs'>{uploadStatus.message}</p>
              </div>
            )}

            {/* Upload Buttons */}
            {uploadStatus.status === "idle" && (
              <div className='flex items-center gap-2'>
                <button
                  onClick={processAndUploadDocument}
                  className='flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded transition-colors flex items-center justify-center gap-2 text-sm'
                >
                  <Upload className='w-4 h-4' />
                  Process and Add to Collection
                </button>
                <button
                  onClick={clearFile}
                  className='px-3 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded transition-colors text-sm'
                >
                  Cancel
                </button>
              </div>
            )}

            {uploadStatus.status === "processing" && (
              <div className='flex items-center gap-2'>
                <button
                  disabled
                  className='flex-1 bg-gray-400 text-white py-2 px-3 rounded flex items-center justify-center gap-2 text-sm'
                >
                  <Loader2 className='w-4 h-4 animate-spin' />
                  Processing...
                </button>
                <button
                  onClick={clearFile}
                  disabled={isCancelling}
                  className='px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded transition-colors text-sm flex items-center gap-1'
                >
                  {isCancelling ? (
                    <>
                      <Loader2 className='w-3 h-3 animate-spin' />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <X className='w-3 h-3' />
                      Cancel
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Documents Section */}
      <div className='flex flex-col flex-1 min-h-0'>
        <div className='flex items-center justify-between mb-4 flex-shrink-0'>
          <h3 className='text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2'>
            <FileText className='w-5 h-5' />
            Documents
          </h3>
          <div className='flex items-center gap-3'>
            <span className='text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full'>
              {loading ? "Loading..." : `${totalCount} total documents`}
            </span>
            {totalCount > 0 && !loading && (
              <span className='text-xs text-gray-400 dark:text-gray-500'>
                Showing {startIndex}-{endIndex} of {totalCount}
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className='text-center py-8'>
            <div className='animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2'></div>
            <p className='text-sm text-gray-500 dark:text-gray-400'>
              Loading documents...
            </p>
          </div>
        ) : error ? (
          <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4'>
            <div className='flex items-center gap-2 mb-2'>
              <AlertCircle className='w-4 h-4 text-red-500' />
              <h3 className='text-sm font-medium text-red-800 dark:text-red-200'>
                Error Loading Documents
              </h3>
            </div>
            <p className='text-sm text-red-700 dark:text-red-300'>{error}</p>
          </div>
        ) : documents.length > 0 ? (
          <div className='flex flex-col min-h-0 flex-1'>
            <div className='overflow-y-auto max-h-[50vh] pr-2'>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {documents.map((doc, index) => {
                  const globalIndex =
                    (currentPage - 1) * documentsPerPage + index + 1;
                  return (
                    <div
                      key={doc.id || index}
                      className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 p-4 flex flex-col h-fit cursor-pointer hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200'
                      onClick={() => handleDocumentClick(doc)}
                      title='Click to view full document content'
                    >
                      <div className='flex items-start justify-between mb-3'>
                        <h4 className='font-medium text-gray-900 dark:text-white text-sm flex items-center gap-2'>
                          Document {globalIndex}
                          <span className='text-xs text-blue-500 dark:text-blue-400 opacity-70'>
                            (click to view)
                          </span>
                        </h4>
                        <span className='text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded shrink-0'>
                          {doc.id.length > 8
                            ? `${doc.id.substring(0, 8)}...`
                            : doc.id}
                        </span>
                      </div>

                      <div className='text-sm text-gray-700 dark:text-gray-300 mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded flex-1'>
                        {getDocumentContent(doc)}
                      </div>

                      {doc.metadata && (
                        <div className='text-xs text-gray-500 dark:text-gray-400 mt-auto'>
                          <strong>Metadata:</strong>{" "}
                          <span className='break-words'>
                            {JSON.stringify(doc.metadata).length > 50
                              ? `${JSON.stringify(doc.metadata).substring(
                                  0,
                                  50
                                )}...`
                              : JSON.stringify(doc.metadata)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className='flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-900 sticky bottom-0'>
                <div className='flex items-center gap-2'>
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className='flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                  >
                    <ChevronLeft className='w-4 h-4' />
                    Previous
                  </button>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className='flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                  >
                    Next
                    <ChevronRight className='w-4 h-4' />
                  </button>
                </div>

                <div className='flex items-center gap-2'>
                  {/* Page numbers */}
                  <div className='flex items-center gap-1'>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNumber}
                          onClick={() => handlePageClick(pageNumber)}
                          className={`w-8 h-8 text-sm font-medium rounded-lg transition-colors ${
                            currentPage === pageNumber
                              ? "bg-blue-600 text-white"
                              : "text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                  </div>

                  <span className='text-sm text-gray-500 dark:text-gray-400 ml-2'>
                    Page {currentPage} of {totalPages}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className='text-center py-8'>
            <FileText className='w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3' />
            <p className='text-gray-500 dark:text-gray-400 text-sm'>
              No documents in this collection
            </p>
            <p className='text-xs text-gray-400 dark:text-gray-500 mt-1'>
              Documents will appear here once added to the collection
            </p>
          </div>
        )}
      </div>

      {/* Document Detail Modal */}
      {showDocumentDialog && selectedDocument && (
        <div className='fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
          <div className='bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col'>
            {/* Modal Header */}
            <div className='flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700'>
              <div className='flex items-center gap-3'>
                <div className='w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center'>
                  <FileText className='w-4 h-4 text-blue-600 dark:text-blue-400' />
                </div>
                <div>
                  <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                    Document Details
                  </h3>
                  <p className='text-sm text-gray-500 dark:text-gray-400'>
                    ID:{" "}
                    {selectedDocument.id.length > 16
                      ? `${selectedDocument.id.substring(0, 16)}...`
                      : selectedDocument.id}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseDialog}
                className='p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors'
                aria-label='Close dialog'
              >
                <X className='w-5 h-5 text-gray-500 dark:text-gray-400' />
              </button>
            </div>

            {/* Modal Content */}
            <div className='flex-1 overflow-hidden p-6 min-h-0'>
              <div className='h-full flex flex-col space-y-4'>
                {/* Document Content */}
                <div className='flex-1 min-h-0'>
                  <h4 className='text-sm font-medium text-gray-900 dark:text-white mb-2'>
                    Document Content
                  </h4>
                  <div
                    className='bg-gray-50 dark:bg-gray-700 rounded-lg p-4 overflow-y-scroll border border-gray-200 dark:border-gray-600'
                    style={{
                      height: "400px",
                      minHeight: "300px",
                      maxHeight: "500px",
                    }}
                  >
                    <pre className='text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono leading-relaxed break-words'>
                      {selectedDocument.document || "No content available"}
                    </pre>
                  </div>
                </div>

                {/* Metadata Section */}
                {selectedDocument.metadata && (
                  <div className='border-t border-gray-200 dark:border-gray-700 pt-4 flex-shrink-0'>
                    <h4 className='text-sm font-medium text-gray-900 dark:text-white mb-2'>
                      Metadata
                    </h4>
                    <div
                      className='bg-gray-50 dark:bg-gray-700 rounded-lg p-3 overflow-y-scroll border border-gray-200 dark:border-gray-600'
                      style={{
                        height: "150px",
                        maxHeight: "200px",
                      }}
                    >
                      <pre className='text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-words'>
                        {JSON.stringify(selectedDocument.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className='border-t border-gray-200 dark:border-gray-700 p-6'>
              <div className='flex justify-end'>
                <button
                  onClick={handleCloseDialog}
                  className='px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-sm font-medium'
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionDetail;

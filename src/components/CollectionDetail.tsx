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
}

interface CollectionDetailProps {
  collection: Collection;
  onBack: () => void;
}

const CollectionDetail: React.FC<CollectionDetailProps> = ({
  collection,
  onBack,
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

    setUploadStatus({
      status: "processing",
      progress: { current: 1, total: 3, step: "Uploading PDF..." },
    });

    try {
      // Step 1: Upload and process PDF on server
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("collectionName", collection.name);
      formData.append("useOllamaEmbedding", "true");

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

      // Refresh documents
      handleDocumentsAdded();
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
              {uploadStatus.status === "idle" && (
                <button
                  onClick={clearFile}
                  className='p-1 hover:bg-gray-200 dark:hover:bg-gray-500 rounded'
                >
                  <X className='w-3 h-3 text-gray-500' />
                </button>
              )}
            </div>

            {/* Processing Status */}
            {uploadStatus.status === "processing" && uploadStatus.progress && (
              <div className='space-y-2'>
                <div className='flex items-center justify-between text-xs'>
                  <span className='text-gray-600 dark:text-gray-300'>
                    {uploadStatus.progress.step}
                  </span>
                  <span className='text-gray-500 dark:text-gray-400'>
                    {uploadStatus.progress.current} /{" "}
                    {uploadStatus.progress.total}
                  </span>
                </div>
                <div className='w-full bg-gray-200 dark:bg-gray-500 rounded-full h-1.5'>
                  <div
                    className='bg-blue-600 h-1.5 rounded-full transition-all duration-300'
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
              <div className='flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded border border-green-200 dark:border-green-700'>
                <CheckCircle className='w-4 h-4' />
                <p className='text-xs'>{uploadStatus.message}</p>
              </div>
            )}

            {uploadStatus.status === "error" && (
              <div className='flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded border border-red-200 dark:border-red-700'>
                <AlertCircle className='w-4 h-4' />
                <p className='text-xs'>{uploadStatus.message}</p>
              </div>
            )}

            {/* Upload Button */}
            {uploadStatus.status === "idle" && (
              <button
                onClick={processAndUploadDocument}
                className='w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded transition-colors flex items-center justify-center gap-2 text-sm'
              >
                <Upload className='w-4 h-4' />
                Process and Add to Collection
              </button>
            )}

            {uploadStatus.status === "processing" && (
              <button
                disabled
                className='w-full bg-gray-400 text-white py-2 px-3 rounded flex items-center justify-center gap-2 text-sm'
              >
                <Loader2 className='w-4 h-4 animate-spin' />
                Processing...
              </button>
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
            <div className='overflow-y-auto max-h-[50vh] space-y-3 pr-2'>
              {documents.map((doc, index) => {
                const globalIndex =
                  (currentPage - 1) * documentsPerPage + index + 1;
                return (
                  <div
                    key={doc.id || index}
                    className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 p-4'
                  >
                    <div className='flex items-start justify-between mb-2'>
                      <h4 className='font-medium text-gray-900 dark:text-white text-sm'>
                        Document {globalIndex}
                      </h4>
                      <span className='text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded'>
                        {doc.id}
                      </span>
                    </div>

                    <div className='text-sm text-gray-700 dark:text-gray-300 mb-3 p-2 bg-gray-50 dark:bg-gray-700 rounded'>
                      {getDocumentContent(doc)}
                    </div>

                    {doc.metadata && (
                      <div className='text-xs text-gray-500 dark:text-gray-400'>
                        <strong>Metadata:</strong>{" "}
                        {JSON.stringify(doc.metadata)}
                      </div>
                    )}
                  </div>
                );
              })}
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
    </div>
  );
};

export default CollectionDetail;

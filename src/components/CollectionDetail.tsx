"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Database, FileText, Info } from "lucide-react";
import {
  Collection,
  chromaDBManager,
  CollectionDocument,
} from "@/lib/chromadb";

interface CollectionDetailProps {
  collection: Collection;
  onBack: () => void;
}

const CollectionDetail: React.FC<CollectionDetailProps> = ({
  collection,
  onBack,
}) => {
  const [documents, setDocuments] = useState<CollectionDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDocuments = async () => {
      setLoading(true);
      setError(null);
      try {
        const docs = await chromaDBManager.getCollectionDocuments(
          collection.name,
          50
        );
        setDocuments(docs);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch documents";
        console.error("Failed to fetch documents:", err);
        setError(errorMessage);
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };

    loadDocuments();
  }, [collection.id, collection.name]);

  const getDocumentContent = (doc: CollectionDocument): string => {
    const content = doc.document || `Document ID: ${doc.id}`;
    // Truncate long content for better UI display
    return content.length > 200 ? content.substring(0, 200) + "..." : content;
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center gap-3'>
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

      {/* Collection Info */}
      <div className='bg-gray-50 dark:bg-gray-700 rounded-lg p-4'>
        <h3 className='text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2'>
          <Info className='w-4 h-4' />
          Collection Information
        </h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label className='text-xs text-gray-500 dark:text-gray-400'>
              Collection ID
            </label>
            <p className='font-mono text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-600 p-2 rounded border'>
              {collection.id}
            </p>
          </div>
          <div>
            <label className='text-xs text-gray-500 dark:text-gray-400'>
              Name
            </label>
            <p className='text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-600 p-2 rounded border'>
              {collection.name}
            </p>
          </div>
        </div>

        {/* Metadata */}
        {collection.metadata && Object.keys(collection.metadata).length > 0 && (
          <div className='mt-4'>
            <label className='text-xs text-gray-500 dark:text-gray-400'>
              Metadata
            </label>
            <div className='bg-white dark:bg-gray-600 p-3 rounded border mt-1'>
              <pre className='text-xs text-gray-900 dark:text-white font-mono overflow-x-auto'>
                {JSON.stringify(collection.metadata, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Documents Section */}
      <div>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2'>
            <FileText className='w-5 h-5' />
            Documents
          </h3>
          <span className='text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full'>
            {loading ? "Loading..." : `${documents.length} documents`}
          </span>
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
              <Info className='w-4 h-4 text-red-500' />
              <h3 className='text-sm font-medium text-red-800 dark:text-red-200'>
                Error Loading Documents
              </h3>
            </div>
            <p className='text-sm text-red-700 dark:text-red-300'>{error}</p>
          </div>
        ) : documents.length > 0 ? (
          <div className='space-y-3'>
            {documents.map((doc, index) => (
              <div
                key={doc.id || index}
                className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 p-4'
              >
                <div className='flex items-start justify-between mb-2'>
                  <h4 className='font-medium text-gray-900 dark:text-white text-sm'>
                    Document {index + 1}
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
                    <strong>Metadata:</strong> {JSON.stringify(doc.metadata)}
                  </div>
                )}
              </div>
            ))}
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

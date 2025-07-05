"use client";

import React, { useState, useEffect } from "react";
import { X, Database, AlertCircle } from "lucide-react";
import {
  chromaDBManager,
  ChromaDBConnection,
  Collection,
} from "@/lib/chromadb";
import CollectionDetail from "./CollectionDetail";

interface ContextWindowManagerProps {
  isOpen: boolean;
  onClose: () => void;
  activeCollections?: Set<string>;
  onActiveCollectionsChange?: (collections: Set<string>) => void;
}

const ContextWindowManager: React.FC<ContextWindowManagerProps> = ({
  isOpen,
  onClose,
  activeCollections: externalActiveCollections,
  onActiveCollectionsChange,
}) => {
  const [connection, setConnection] = useState<ChromaDBConnection | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] =
    useState<Collection | null>(null);
  const [internalActiveCollections, setInternalActiveCollections] = useState<
    Set<string>
  >(new Set());

  // Use external active collections if provided, otherwise use internal state
  const activeCollections =
    externalActiveCollections || internalActiveCollections;

  // Test connection on component mount
  useEffect(() => {
    if (isOpen) {
      handleConnect();
      setSelectedCollection(null); // Reset selected collection when opening
    }
  }, [isOpen]);

  const handleConnect = async () => {
    try {
      const conn = await chromaDBManager.connect();
      setConnection(conn);

      if (conn.isConnected) {
        // Get collections if connected
        try {
          const cols = await chromaDBManager.getCollections();
          setCollections(cols);
        } catch (error) {
          console.error("Failed to fetch collections:", error);
        }
      }
    } catch (error) {
      console.error("Connection error:", error);
    }
  };

  const handleCollectionClick = (collection: Collection) => {
    setSelectedCollection(collection);
  };

  const handleCollectionToggle = (collectionName: string) => {
    if (onActiveCollectionsChange) {
      // External state management
      const newSet = new Set(activeCollections);
      if (newSet.has(collectionName)) {
        newSet.delete(collectionName);
      } else {
        newSet.add(collectionName);
      }
      onActiveCollectionsChange(newSet);
    } else {
      // Internal state management
      setInternalActiveCollections((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(collectionName)) {
          newSet.delete(collectionName);
        } else {
          newSet.add(collectionName);
        }
        return newSet;
      });
    }
  };

  const handleBackToCollections = () => {
    setSelectedCollection(null);
  };
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-white/30 dark:bg-gray-900/30'>
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden'>
        {/* Dialog Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700'>
          <div className='flex items-center gap-3'>
            <div
              className={`p-2 rounded-lg ${
                connection?.isConnected
                  ? "bg-green-100 dark:bg-green-900/30"
                  : "bg-gray-100 dark:bg-gray-700"
              }`}
            >
              <Database
                className={`w-5 h-5 ${
                  connection?.isConnected
                    ? "text-green-600 dark:text-green-400"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              />
            </div>
            <div>
              <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
                Context Window Management
              </h2>
              <div className='flex items-center gap-2'>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                  Manage your vector database and context data
                </p>
                {connection?.isConnected && (
                  <span className='text-xs text-green-600 dark:text-green-400 font-medium'>
                    • localhost:8000
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className='p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors'
            aria-label='Close dialog'
          >
            <X className='w-5 h-5 text-gray-500 dark:text-gray-400' />
          </button>
        </div>

        {/* Dialog Content */}
        <div className='p-6 overflow-y-auto max-h-[60vh]'>
          <div className='space-y-6'>
            {/* Show Collection Detail or Collections List */}
            {selectedCollection ? (
              <CollectionDetail
                collection={selectedCollection}
                onBack={handleBackToCollections}
              />
            ) : (
              <>
                {/* Active Collections Section */}
                {activeCollections.size > 0 && (
                  <div className='mb-6'>
                    <div className='flex items-center justify-between mb-4'>
                      <h3 className='text-lg font-medium text-gray-900 dark:text-white'>
                        Active in Context
                      </h3>
                      <span className='text-sm text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full'>
                        {activeCollections.size} active
                      </span>
                    </div>
                    <div className='space-y-2'>
                      {Array.from(activeCollections).map((collectionName) => (
                        <div
                          key={collectionName}
                          className='flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3'
                        >
                          <div className='flex items-center gap-2'>
                            <Database className='w-4 h-4 text-green-600 dark:text-green-400' />
                            <span className='text-sm font-medium text-green-800 dark:text-green-200'>
                              {collectionName}
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              handleCollectionToggle(collectionName)
                            }
                            className='text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200'
                            title='Remove from context'
                          >
                            <X className='w-4 h-4' />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Collections Section */}
                {connection?.isConnected && (
                  <div>
                    <div className='flex items-center justify-between mb-4'>
                      <h3 className='text-lg font-medium text-gray-900 dark:text-white'>
                        Collections
                      </h3>
                      <span className='text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full'>
                        {collections.length}{" "}
                        {collections.length === 1
                          ? "collection"
                          : "collections"}
                      </span>
                    </div>

                    {collections.length > 0 ? (
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        {collections.map((collection, index) => (
                          <div
                            key={collection.id || index}
                            className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 p-4 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200'
                          >
                            <div className='flex items-center justify-between'>
                              <div
                                className='flex items-center gap-3 flex-1 cursor-pointer'
                                onClick={() =>
                                  handleCollectionClick(collection)
                                }
                              >
                                <div className='w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center'>
                                  <Database className='w-4 h-4 text-blue-600 dark:text-blue-400' />
                                </div>
                                <h4 className='font-medium text-gray-900 dark:text-white text-sm'>
                                  {collection.name || `Collection ${index + 1}`}
                                </h4>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCollectionToggle(collection.name);
                                }}
                                className={`p-2 rounded-lg transition-colors ${
                                  activeCollections.has(collection.name)
                                    ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                                }`}
                                title={
                                  activeCollections.has(collection.name)
                                    ? "Remove from context"
                                    : "Add to context"
                                }
                              >
                                <Database className='w-4 h-4' />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className='text-center py-8'>
                        <Database className='w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3' />
                        <p className='text-gray-500 dark:text-gray-400 text-sm'>
                          No collections found
                        </p>
                        <p className='text-xs text-gray-400 dark:text-gray-500 mt-1'>
                          Collections will appear here once created
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Connection Status Message for Disconnected State */}
                {!connection?.isConnected && (
                  <div className='bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4'>
                    <div className='flex items-center gap-2 mb-2'>
                      <AlertCircle className='w-4 h-4 text-yellow-500' />
                      <h3 className='text-sm font-medium text-yellow-800 dark:text-yellow-200'>
                        Database Not Connected
                      </h3>
                    </div>
                    <p className='text-sm text-yellow-700 dark:text-yellow-300'>
                      ChromaDB connection is required to manage collections and
                      context data.
                    </p>
                  </div>
                )}

                {/* Error Display */}
                {connection?.error && (
                  <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4'>
                    <div className='flex items-center gap-2 mb-2'>
                      <AlertCircle className='w-4 h-4 text-red-500' />
                      <h3 className='text-sm font-medium text-red-800 dark:text-red-200'>
                        Connection Error
                      </h3>
                    </div>
                    <p className='text-sm text-red-700 dark:text-red-300'>
                      {connection.error}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Dialog Footer */}
        <div className='flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700'>
          <button
            onClick={onClose}
            className='px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors'
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContextWindowManager;

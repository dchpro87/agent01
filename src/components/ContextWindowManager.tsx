"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Database,
  AlertCircle,
  Plus,
  Trash2,
  Search,
  Filter,
} from "lucide-react";
import {
  chromaDBManager,
  ChromaDBConnection,
  Collection,
} from "@/lib/chromadb";
import { CHROMADB_DEFAULTS } from "@/constraints/chromadb-constraints";
import CollectionDetail from "./CollectionDetail";
import Message from "./Message";

interface ContextWindowManagerProps {
  isOpen: boolean;
  onClose: () => void;
  activeCollections?: Set<string>;
  onActiveCollectionsChange?: (collections: Set<string>) => void;
  chunksToRetrieve?: number;
  onChunksToRetrieveChange?: (chunks: number) => void;
}

const ContextWindowManager: React.FC<ContextWindowManagerProps> = ({
  isOpen,
  onClose,
  activeCollections: externalActiveCollections,
  onActiveCollectionsChange,
  chunksToRetrieve = CHROMADB_DEFAULTS.CHUNKS_TO_RETRIEVE,
  onChunksToRetrieveChange,
}) => {
  const [connection, setConnection] = useState<ChromaDBConnection | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] =
    useState<Collection | null>(null);
  const [internalActiveCollections, setInternalActiveCollections] = useState<
    Set<string>
  >(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [useOllamaEmbedding, setUseOllamaEmbedding] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<string | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  // Use external active collections if provided, otherwise use internal state
  const activeCollections =
    externalActiveCollections || internalActiveCollections;

  // Filter collections based on search and active filter
  const filteredCollections = collections.filter((collection) => {
    const matchesSearch = collection.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesActiveFilter = showActiveOnly
      ? activeCollections.has(collection.name)
      : true;
    return matchesSearch && matchesActiveFilter;
  });

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

  const handleCollectionUpdated = async () => {
    // Refresh collections list to update document counts
    try {
      const cols = await chromaDBManager.getCollections();
      setCollections(cols);
    } catch (error) {
      console.error("Failed to refresh collections:", error);
    }
  };

  const handleBackToCollections = () => {
    setSelectedCollection(null);
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;

    setIsCreating(true);
    try {
      // Convert collection name to lowercase with hyphens
      const formattedName = newCollectionName
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-");

      await chromaDBManager.createCollection(formattedName, useOllamaEmbedding);

      // Refresh collections list (this will include document counts)
      const cols = await chromaDBManager.getCollections();
      setCollections(cols);

      // Reset modal state
      setShowCreateModal(false);
      setNewCollectionName("");
      setUseOllamaEmbedding(true);
    } catch (error) {
      console.error("Failed to create collection:", error);
      // You might want to add error handling/display here
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancelCreate = () => {
    setShowCreateModal(false);
    setNewCollectionName("");
    setUseOllamaEmbedding(true);
  };

  const handleDeleteClick = (collectionName: string) => {
    setCollectionToDelete(collectionName);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!collectionToDelete) return;

    setIsDeleting(true);
    try {
      await chromaDBManager.deleteCollection(collectionToDelete);

      // Remove from active collections if it was active
      if (activeCollections.has(collectionToDelete)) {
        handleCollectionToggle(collectionToDelete);
      }

      // Refresh collections list (this will include document counts)
      const cols = await chromaDBManager.getCollections();
      setCollections(cols);

      // Reset modal state
      setShowDeleteModal(false);
      setCollectionToDelete(null);
    } catch (error) {
      console.error("Failed to delete collection:", error);
      // You might want to add error handling/display here
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setCollectionToDelete(null);
  };
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 bg-white dark:bg-gray-900'>
      {/* Header Bar */}
      <div className='flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'>
        <div className='flex items-center gap-4'>
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
              <h1 className='text-xl font-semibold text-gray-900 dark:text-white'>
                Context Window Management
              </h1>
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

          {/* Active Collections Summary */}
          {activeCollections.size > 0 && (
            <div className='flex items-center gap-4'>
              <div className='flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg'>
                <Database className='w-4 h-4 text-green-600 dark:text-green-400' />
                <span className='text-sm font-medium text-green-800 dark:text-green-200'>
                  {activeCollections.size} Active in Context
                </span>
              </div>

              {/* Chunks to Retrieve Slider */}
              <div className='flex items-center gap-3 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg'>
                <span className='text-sm font-medium text-blue-800 dark:text-blue-200 whitespace-nowrap'>
                  Chunks: {chunksToRetrieve}
                </span>
                <input
                  type='range'
                  min='1'
                  max='30'
                  value={chunksToRetrieve}
                  onChange={(e) =>
                    onChunksToRetrieveChange?.(parseInt(e.target.value))
                  }
                  className='w-20 h-2 bg-blue-200 dark:bg-blue-700 rounded-lg appearance-none cursor-pointer'
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                      ((chunksToRetrieve - 1) / 29) * 100
                    }%, #cbd5e1 ${
                      ((chunksToRetrieve - 1) / 29) * 100
                    }%, #cbd5e1 100%)`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors'
          aria-label='Close context manager'
        >
          Done
        </button>
      </div>

      {/* Main Content Area */}
      <div className='flex h-[calc(100vh-80px)]'>
        {/* Left Sidebar - Collections List */}
        <div className='w-80 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex flex-col'>
          {/* Search and Filter Bar */}
          <div className='p-4 border-b border-gray-200 dark:border-gray-700'>
            <div className='space-y-3'>
              <div className='relative'>
                <Search className='absolute left-3 top-2.5 w-4 h-4 text-gray-400' />
                <input
                  type='text'
                  placeholder='Search collections...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                />
              </div>

              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Filter className='w-4 h-4 text-gray-500' />
                  <label className='flex items-center'>
                    <input
                      type='checkbox'
                      checked={showActiveOnly}
                      onChange={(e) => setShowActiveOnly(e.target.checked)}
                      className='w-3 h-3 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600'
                    />
                    <span className='ml-2 text-xs text-gray-600 dark:text-gray-400'>
                      Active only
                    </span>
                  </label>
                </div>

                <button
                  onClick={() => setShowCreateModal(true)}
                  className='flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors'
                  title='Create new collection'
                >
                  <Plus className='w-3 h-3' />
                  New
                </button>
              </div>
            </div>
          </div>

          {/* Collections List */}
          <div className='flex-1 overflow-y-auto'>
            {connection?.isConnected ? (
              filteredCollections.length > 0 ? (
                <div className='p-2'>
                  {filteredCollections.map((collection, index) => (
                    <div
                      key={collection.id || index}
                      className={`p-3 mb-2 rounded-lg border transition-all duration-200 cursor-pointer ${
                        selectedCollection?.id === collection.id
                          ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700"
                          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                      onClick={() => handleCollectionClick(collection)}
                    >
                      <div className='flex items-center justify-between mb-2'>
                        <div className='flex items-center gap-2'>
                          <div
                            className={`w-6 h-6 rounded flex items-center justify-center ${
                              activeCollections.has(collection.name)
                                ? "bg-green-100 dark:bg-green-900/30"
                                : "bg-gray-100 dark:bg-gray-700"
                            }`}
                          >
                            <Database
                              className={`w-3 h-3 ${
                                activeCollections.has(collection.name)
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-gray-600 dark:text-gray-400"
                              }`}
                            />
                          </div>
                          <h4 className='font-medium text-sm text-gray-900 dark:text-white truncate'>
                            {collection.name}
                          </h4>
                        </div>
                      </div>

                      <div className='flex items-center justify-between'>
                        <span className='text-xs text-gray-500 dark:text-gray-400'>
                          {collection.documentCount !== undefined
                            ? `${collection.documentCount} document${
                                collection.documentCount !== 1 ? "s" : ""
                              }`
                            : "Loading..."}
                        </span>
                        <div className='flex items-center gap-1'>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCollectionToggle(collection.name);
                            }}
                            className={`p-1 rounded transition-colors ${
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
                            <Database className='w-3 h-3' />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(collection.name);
                            }}
                            className='p-1 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors'
                            title='Delete collection'
                          >
                            <Trash2 className='w-3 h-3' />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='p-6 text-center'>
                  <Database className='w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2' />
                  <p className='text-sm text-gray-500 dark:text-gray-400'>
                    {searchQuery || showActiveOnly
                      ? "No matching collections"
                      : "No collections found"}
                  </p>
                  <p className='text-xs text-gray-400 dark:text-gray-500 mt-1'>
                    {searchQuery || showActiveOnly
                      ? "Try adjusting your filters"
                      : "Create a collection to get started"}
                  </p>
                </div>
              )
            ) : (
              <div className='p-6'>
                <div className='bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4'>
                  <div className='flex items-center gap-2 mb-2'>
                    <AlertCircle className='w-4 h-4 text-yellow-500' />
                    <h3 className='text-sm font-medium text-yellow-800 dark:text-yellow-200'>
                      Database Not Connected
                    </h3>
                  </div>
                  <p className='text-sm text-yellow-700 dark:text-yellow-300'>
                    ChromaDB connection is required.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content - Collection Details */}
        <div className='flex-1 overflow-hidden'>
          {selectedCollection ? (
            <CollectionDetail
              collection={selectedCollection}
              onBack={handleBackToCollections}
              onCollectionUpdated={handleCollectionUpdated}
            />
          ) : (
            <div className='h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900'>
              <div className='text-center'>
                <Database className='w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4' />
                <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-2'>
                  Select a Collection
                </h3>
                <p className='text-gray-500 dark:text-gray-400 max-w-md'>
                  Choose a collection from the sidebar to view its documents,
                  upload new files, or manage its contents.
                </p>
                {connection?.isConnected && collections.length === 0 && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className='mt-4 flex items-center gap-2 mx-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors'
                  >
                    <Plus className='w-4 h-4' />
                    Create Your First Collection
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals remain the same but positioned over the full-screen layout */}
      {/* Create Collection Modal */}
      {showCreateModal && (
        <div className='absolute inset-0 bg-black/50 flex items-center justify-center p-4 z-10'>
          <div className='bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full'>
            <div className='p-6'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                  Create New Collection
                </h3>
                <button
                  onClick={handleCancelCreate}
                  className='p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded'
                  disabled={isCreating}
                >
                  <X className='w-5 h-5 text-gray-500' />
                </button>
              </div>

              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                    Collection Name
                  </label>
                  <input
                    type='text'
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    placeholder='Enter collection name'
                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    disabled={isCreating}
                    autoFocus
                  />
                </div>

                <div className='flex items-center'>
                  <input
                    type='checkbox'
                    id='useOllamaEmbedding'
                    checked={useOllamaEmbedding}
                    onChange={(e) => setUseOllamaEmbedding(e.target.checked)}
                    className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600'
                    disabled={isCreating}
                  />
                  <label
                    htmlFor='useOllamaEmbedding'
                    className='ml-2 text-sm text-gray-700 dark:text-gray-300'
                  >
                    Use Ollama embedding (nomic-embed-text)
                  </label>
                </div>

                <div className='flex justify-end gap-3 pt-4'>
                  <button
                    onClick={handleCancelCreate}
                    className='px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors'
                    disabled={isCreating}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateCollection}
                    className='px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed rounded-lg transition-colors'
                    disabled={isCreating || !newCollectionName.trim()}
                  >
                    {isCreating ? "Creating..." : "Create Collection"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Collection Confirmation Modal */}
      {showDeleteModal && (
        <div className='absolute inset-0 bg-black/50 flex items-center justify-center p-4 z-10'>
          <div className='bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full'>
            <div className='p-6'>
              <div className='flex items-center justify-between mb-4'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 bg-red-100 dark:bg-red-900/30 rounded-lg'>
                    <Trash2 className='w-5 h-5 text-red-600 dark:text-red-400' />
                  </div>
                  <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                    Delete Collection
                  </h3>
                </div>
                <button
                  onClick={handleCancelDelete}
                  className='p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded'
                  disabled={isDeleting}
                >
                  <X className='w-5 h-5 text-gray-500' />
                </button>
              </div>

              <div className='space-y-4'>
                <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4'>
                  <p className='text-sm text-red-800 dark:text-red-200 mb-2'>
                    Are you sure you want to permanently delete the collection{" "}
                    <span className='font-semibold'>
                      &ldquo;{collectionToDelete}&rdquo;
                    </span>
                    ?
                  </p>
                  <p className='text-xs text-red-700 dark:text-red-300'>
                    This action cannot be undone. All documents and embeddings
                    in this collection will be lost.
                  </p>
                </div>

                <div className='flex justify-end gap-3 pt-4'>
                  <button
                    onClick={handleCancelDelete}
                    className='px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors'
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    className='px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed rounded-lg transition-colors'
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete Collection"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display Overlay */}
      {connection?.error && (
        <div className='absolute bottom-4 right-4 max-w-md shadow-lg z-10'>
          <Message
            message={connection.error}
            type='error'
            isVisible={!!connection.error}
            onClose={() => {
              // Reset the connection error by updating local state
              if (connection) {
                const updatedConnection = { ...connection };
                delete updatedConnection.error;
                setConnection(updatedConnection);
              }
            }}
            autoHide={true}
            autoHideDelay={5000}
          />
        </div>
      )}
    </div>
  );
};

export default ContextWindowManager;

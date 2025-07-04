"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Database,
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  chromaDBManager,
  ChromaDBConnection,
  Collection,
} from "@/lib/chromadb";

interface ContextWindowManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ContextWindowManager: React.FC<ContextWindowManagerProps> = ({
  isOpen,
  onClose,
}) => {
  const [connection, setConnection] = useState<ChromaDBConnection | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [health, setHealth] = useState<{
    status: string;
    details?: unknown;
  } | null>(null);

  // Test connection on component mount
  useEffect(() => {
    if (isOpen) {
      handleConnect();
    }
  }, [isOpen]);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const conn = await chromaDBManager.connect();
      setConnection(conn);

      if (conn.isConnected) {
        // Get health status
        const healthStatus = await chromaDBManager.getHealth();
        setHealth(healthStatus);

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
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await chromaDBManager.disconnect();
    setConnection(null);
    setCollections([]);
    setHealth(null);
  };

  const getStatusIcon = () => {
    if (isConnecting) {
      return <RefreshCw className='w-4 h-4 text-blue-500 animate-spin' />;
    }
    if (connection?.isConnected) {
      return <CheckCircle className='w-4 h-4 text-green-500' />;
    }
    return <AlertCircle className='w-4 h-4 text-red-500' />;
  };

  const getStatusText = () => {
    if (isConnecting) return "Connecting...";
    if (connection?.isConnected) return "Connected";
    if (connection?.error) return `Error: ${connection.error}`;
    return "Disconnected";
  };
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-white/30 dark:bg-gray-900/30'>
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden'>
        {/* Dialog Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg'>
              <Database className='w-5 h-5 text-blue-600 dark:text-blue-400' />
            </div>
            <div>
              <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
                Context Window Management
              </h2>
              <p className='text-sm text-gray-500 dark:text-gray-400'>
                Manage your vector database and context data
              </p>
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
            {/* Connection Status Section */}
            <div className='bg-gray-50 dark:bg-gray-700 rounded-lg p-4'>
              <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-3'>
                ChromaDB Connection
              </h3>

              <div className='flex items-center gap-3 mb-4'>
                {getStatusIcon()}
                <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                  {getStatusText()}
                </span>
              </div>

              <div className='text-sm text-gray-600 dark:text-gray-400 mb-4'>
                <p>
                  <strong>Endpoint:</strong> http://localhost:8000
                </p>
                {health && (
                  <p>
                    <strong>Health:</strong> {health.status}
                  </p>
                )}
              </div>

              <div className='flex gap-2'>
                <button
                  onClick={handleConnect}
                  disabled={isConnecting || connection?.isConnected}
                  className='px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors'
                >
                  {isConnecting ? (
                    <>
                      <RefreshCw className='w-4 h-4 mr-2 animate-spin inline' />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Wifi className='w-4 h-4 mr-2 inline' />
                      Connect
                    </>
                  )}
                </button>

                {connection?.isConnected && (
                  <button
                    onClick={handleDisconnect}
                    className='px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-lg transition-colors'
                  >
                    <WifiOff className='w-4 h-4 mr-2 inline' />
                    Disconnect
                  </button>
                )}
              </div>
            </div>

            {/* Collections Section */}
            {connection?.isConnected && (
              <div className='bg-gray-50 dark:bg-gray-700 rounded-lg p-4'>
                <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-3'>
                  Collections
                </h3>

                {collections.length > 0 ? (
                  <div className='space-y-2'>
                    {collections.map((collection, index) => (
                      <div
                        key={index}
                        className='p-3 bg-white dark:bg-gray-600 rounded border border-gray-200 dark:border-gray-500'
                      >
                        <p className='font-medium text-gray-900 dark:text-white'>
                          {collection.name || `Collection ${index + 1}`}
                        </p>
                        <p className='text-sm text-gray-500 dark:text-gray-400'>
                          ID: {collection.id || "Unknown"}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className='text-gray-500 dark:text-gray-400 text-sm'>
                    No collections found
                  </p>
                )}
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

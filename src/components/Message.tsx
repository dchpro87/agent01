"use client";

import React, { useEffect, useRef } from "react";
import { AlertCircle, CheckCircle, Info, X, AlertTriangle } from "lucide-react";

interface MessageProps {
  message: string;
  type: "error" | "success" | "info" | "warning";
  isVisible: boolean;
  onClose: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
}

const Message: React.FC<MessageProps> = ({
  message,
  type,
  isVisible,
  onClose,
  autoHide = true,
  autoHideDelay = 5000,
}) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isVisible && autoHide) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        onClose();
      }, autoHideDelay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isVisible, autoHide, autoHideDelay, onClose]);

  const getIcon = () => {
    switch (type) {
      case "error":
        return (
          <AlertCircle className='w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0' />
        );
      case "success":
        return (
          <CheckCircle className='w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0' />
        );
      case "info":
        return (
          <Info className='w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0' />
        );
      case "warning":
        return (
          <AlertTriangle className='w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0' />
        );
      default:
        return (
          <Info className='w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0' />
        );
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case "error":
        return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
      case "success":
        return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
      case "info":
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800";
      case "warning":
        return "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800";
      default:
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800";
    }
  };

  const getTextColor = () => {
    switch (type) {
      case "error":
        return "text-red-600 dark:text-red-400";
      case "success":
        return "text-green-600 dark:text-green-400";
      case "info":
        return "text-blue-600 dark:text-blue-400";
      case "warning":
        return "text-amber-600 dark:text-amber-400";
      default:
        return "text-blue-600 dark:text-blue-400";
    }
  };

  const getHoverColor = () => {
    switch (type) {
      case "error":
        return "hover:bg-red-100 dark:hover:bg-red-800";
      case "success":
        return "hover:bg-green-100 dark:hover:bg-green-800";
      case "info":
        return "hover:bg-blue-100 dark:hover:bg-blue-800";
      case "warning":
        return "hover:bg-amber-100 dark:hover:bg-amber-800";
      default:
        return "hover:bg-blue-100 dark:hover:bg-blue-800";
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={`border rounded-lg p-3 flex items-center justify-between ${getBackgroundColor()}`}
    >
      <div className='flex items-center gap-2'>
        {getIcon()}
        <p className={`text-sm ${getTextColor()}`}>{message}</p>
      </div>
      <button
        onClick={onClose}
        className={`ml-4 p-1 rounded-full transition-colors ${getHoverColor()}`}
        aria-label='Close message'
      >
        <X className={`w-4 h-4 ${getTextColor()}`} />
      </button>
    </div>
  );
};

export default Message;

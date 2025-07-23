import { X } from "lucide-react";
import { getFileIcon, formatFileSize } from "@/utils";

interface AttachmentPreviewProps {
  files: File[];
  onRemove: () => void;
}

export default function AttachmentPreview({
  files,
  onRemove,
}: AttachmentPreviewProps) {
  return (
    <div className='border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3'>
      <div className='flex items-center justify-between mb-2'>
        <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
          {files.length} file{files.length !== 1 ? "s" : ""} attached
        </span>
        <button
          onClick={onRemove}
          className='text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          title='Remove all attachments'
        >
          <X className='w-4 h-4' />
        </button>
      </div>
      <div className='flex flex-wrap gap-2'>
        {files.map((file, index) => (
          <div
            key={index}
            className='flex items-center gap-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm'
          >
            {getFileIcon(file.type)}
            <span className='text-gray-700 dark:text-gray-300 truncate max-w-32'>
              {file.name}
            </span>
            <span className='text-gray-500 dark:text-gray-400 text-xs'>
              {formatFileSize(file.size)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

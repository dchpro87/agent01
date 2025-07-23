import { getFileIcon } from "@/utils";

interface MessageAttachmentsProps {
  attachments?: Array<{
    name?: string;
    contentType?: string;
    url: string;
  }>;
}

export default function MessageAttachments({
  attachments,
}: MessageAttachmentsProps) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className='mt-3 space-y-2'>
      {attachments.map((attachment, index) => {
        if (attachment.contentType?.startsWith("image/")) {
          return (
            <div
              key={index}
              className='border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden'
            >
              <div className='relative max-w-full max-h-96'>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={attachment.url}
                  alt={attachment.name || "Attached image"}
                  className='max-w-full h-auto max-h-96 object-contain'
                  style={{ width: "auto", height: "auto" }}
                />
              </div>
              {attachment.name && (
                <div className='px-3 py-2 bg-gray-50 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400'>
                  {attachment.name}
                </div>
              )}
            </div>
          );
        } else {
          return (
            <div
              key={index}
              className='flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg'
            >
              {getFileIcon(attachment.contentType || "")}
              <span className='text-sm text-gray-700 dark:text-gray-300'>
                {attachment.name || "Attached file"}
              </span>
              {attachment.contentType && (
                <span className='text-xs text-gray-500 dark:text-gray-400'>
                  ({attachment.contentType})
                </span>
              )}
            </div>
          );
        }
      })}
    </div>
  );
}

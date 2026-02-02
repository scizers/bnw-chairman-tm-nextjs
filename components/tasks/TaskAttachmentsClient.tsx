"use client";

import { useState } from "react";
import { Upload } from "antd";
import type { UploadFile, UploadRequestOption } from "antd/es/upload/interface";
import { tasksApi } from "@/lib/api";

interface TaskAttachmentsClientProps {
  taskId: string;
  initialAttachments?: string[];
}

export default function TaskAttachmentsClient({
  taskId,
  initialAttachments = []
}: TaskAttachmentsClientProps) {
  const [attachments, setAttachments] = useState<string[]>(initialAttachments);
  const [fileList, setFileList] = useState<UploadFile[]>(
    initialAttachments.map((link, index) => ({
      uid: `${index}-${link}`,
      name: link.split("/").pop() || `Attachment ${index + 1}`,
      status: "done",
      url: link
    }))
  );

  const handleUpload = async (options: UploadRequestOption) => {
    const { file, onError, onSuccess, onProgress } = options;
    const uploadFile = file as File;
    const temp: UploadFile = {
      uid: `${Date.now()}-${uploadFile.name}`,
      name: uploadFile.name,
      status: "uploading"
    };
    setFileList((prev) => [...prev, temp]);

    try {
      const result = await tasksApi.uploadAttachment(uploadFile, (percent) => {
        onProgress?.({ percent });
      });
      await tasksApi.addAttachments(taskId, [result.url]);
      const updated: UploadFile = {
        ...temp,
        status: "done",
        url: result.url
      };
      setFileList((prev) => [
        ...prev.filter((item) => item.uid !== temp.uid),
        updated
      ]);
      setAttachments((prev) => [...prev, result.url]);
      onSuccess?.(result, new XMLHttpRequest());
    } catch (err) {
      setFileList((prev) => prev.filter((item) => item.uid !== temp.uid));
      onError?.(err as Error);
    }
  };

  return (
    <div className="rounded-xl border border-border-subtle bg-surface-muted p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Attachments</p>
      {attachments.length ? null : (
        <p className="mt-3 text-xs text-text-muted">No attachments yet.</p>
      )}
      <div className="mt-4">
        <Upload
          listType="text"
          customRequest={handleUpload}
          fileList={fileList}
          onRemove={(file) => {
            setFileList((prev) => prev.filter((item) => item.uid !== file.uid));
            if (file.url) {
              setAttachments((prev) => prev.filter((link) => link !== file.url));
            }
          }}
          showUploadList={{ showRemoveIcon: true, showPreviewIcon: true }}
          onPreview={(file) => {
            if (file.url) {
              window.open(file.url, "_blank", "noopener,noreferrer");
            }
          }}
        >
          <button
            type="button"
            className="rounded-full border border-border-subtle px-4 py-2 text-xs text-text-primary"
          >
            Upload files
          </button>
        </Upload>
      </div>
    </div>
  );
}

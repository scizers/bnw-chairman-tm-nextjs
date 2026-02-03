export type MomAttachmentKind = "image" | "pdf" | "word" | "excel" | "other";

export interface MomAttachment {
  fileUrl: string;
  thumbnailUrl?: string;
  mimeType?: string;
  fileName?: string;
  fileKind?: MomAttachmentKind;
  uploadedAt?: string;
}

export interface Mom {
  id?: string;
  _id?: string;
  title: string;
  meetingDate: string;
  attendees: string[];
  rawNotes: string;
  attachments: MomAttachment[];
  aiSummary?: string;
  aiExtractedAt?: string;
  createdBy?: string;
  createdAt?: string;
}

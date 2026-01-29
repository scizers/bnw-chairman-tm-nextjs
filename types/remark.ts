export interface Remark {
  id?: string;
  _id?: string;
  text: string;
  createdAt?: string;
  createdBy?: string;
  author?: string;
  authorName?: string;
  type?: "text" | "audio";
}

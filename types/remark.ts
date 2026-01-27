export interface Remark {
  id?: string;
  text: string;
  createdAt?: string;
  createdBy?: string;
  type?: "text" | "audio";
}

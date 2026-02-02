import { clientApi } from "@/lib/api/client";
import type { Mom } from "@/types/mom";

export interface MomListMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  sortBy?: string;
  sortDir?: string;
}

export interface MomListResponse {
  data: Mom[];
  meta: MomListMeta;
}

export const momsApi = {
  list: async (params?: {
    q?: string;
    attendees?: string;
    meetingFrom?: string;
    meetingTo?: string;
    sortBy?: string;
    sortDir?: string;
  }) => {
    const { data } = await clientApi.get<Mom[]>("/moms", { params });
    return data;
  },
  listPaged: async (params: {
    q?: string;
    attendees?: string;
    meetingFrom?: string;
    meetingTo?: string;
    sortBy?: string;
    sortDir?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const { data } = await clientApi.get<MomListResponse>("/moms", { params });
    return data;
  },
  getById: async (momId: string) => {
    const { data } = await clientApi.get<Mom>(`/moms/${momId}`);
    return data;
  },
  create: async (payload: Partial<Mom>) => {
    const { data } = await clientApi.post<Mom>("/moms", payload);
    return data;
  },
  update: async (momId: string, payload: Partial<Mom>) => {
    const { data } = await clientApi.patch<Mom>(`/moms/${momId}`, payload);
    return data;
  },
  uploadAttachment: async (file: File, onProgress?: (percent: number) => void) => {
    const form = new FormData();
    form.append("file", file);
    const { data } = await clientApi.post<{ url: string; mimeType: string }>(
      "/uploads/moms",
      form,
      {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) => {
          if (!event.total) return;
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress?.(percent);
        }
      }
    );
    return data;
  },
  remove: async (momId: string) => {
    const { data } = await clientApi.delete<{ success: boolean }>(`/moms/${momId}`);
    return data;
  }
};

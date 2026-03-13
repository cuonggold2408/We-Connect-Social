import { api } from "@/shared/api/axios";
import axios from "axios";

interface FileMetadata {
  mimeType: string;
  fileSize: number;
}

interface PresignedUrlResponse {
  uploadUrl: string;
  objectUrl: string;
  key: string;
}

interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

export const uploadApi = {
  getPresignedUrls: async (
    files: FileMetadata[],
  ): Promise<PresignedUrlResponse[]> => {
    const { data } = await api.post<ApiResponse<PresignedUrlResponse[]>>(
      "/upload/presigned-urls",
      { files },
    );
    return data.data;
  },

  uploadFileToS3: async (
    url: string,
    file: File,
    onProgress?: (percent: number) => void,
  ): Promise<void> => {
    await axios.put(url, file, {
      headers: { "Content-Type": file.type },
      onUploadProgress: (e) => {
        if (e.total && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      },
    });
  },
};

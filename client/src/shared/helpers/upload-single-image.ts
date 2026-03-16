import { uploadApi } from "@/shared/api/upload.api";

export async function uploadSingleImage(file: File): Promise<string> {
  const [presigned] = await uploadApi.getPresignedUrls([
    { mimeType: file.type, fileSize: file.size },
  ]);
  await uploadApi.uploadFileToS3(presigned.uploadUrl, file);
  await uploadApi.confirmUploads([presigned.key]);
  return presigned.objectUrl;
}

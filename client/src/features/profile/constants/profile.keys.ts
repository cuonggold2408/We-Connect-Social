export const profileKeys = {
  all: ["profile"] as const,
  detail: (username: string) => [...profileKeys.all, username] as const,
  posts: (userId: string) => [...profileKeys.all, "posts", userId] as const,
  friends: (userId: string) => [...profileKeys.all, "friends", userId] as const,
  photos: (userId: string) => [...profileKeys.all, "photos", userId] as const,
  photosGallery: (userId: string) =>
    [...profileKeys.all, "photos-gallery", userId] as const,
};

import { api } from "@/shared/api/axios";
import type {
  FriendRequest,
  SentRequest,
  Friend,
  RelationshipStatusResponse,
  PaginatedResponse,
  Suggestion,
} from "@/features/friends/types/friendship.types";

interface ApiResponse<T = undefined> {
  statusCode: number;
  message: string;
  data?: T;
}

export const friendshipsApi = {
  sendRequest: (userId: string) => api.post(`/friendships/request/${userId}`),

  acceptRequest: (userId: string) => api.patch(`/friendships/accept/${userId}`),

  rejectRequest: (userId: string) => api.patch(`/friendships/reject/${userId}`),

  cancelRequest: (userId: string) =>
    api.delete(`/friendships/cancel/${userId}`),

  unfriend: (userId: string) => api.delete(`/friendships/unfriend/${userId}`),

  getReceivedRequests: (cursor?: string, limit = 20) =>
    api
      .get<
        ApiResponse<PaginatedResponse<FriendRequest>>
      >("/friendships/requests/received", { params: { cursor, limit } })
      .then((r) => r.data.data!),
  getSentRequests: (cursor?: string, limit = 20) =>
    api
      .get<
        ApiResponse<PaginatedResponse<SentRequest>>
      >("/friendships/requests/sent", { params: { cursor, limit } })
      .then((r) => r.data.data!),

  getPendingReceivedCount: () =>
    api
      .get("/friendships/requests/received/count")
      .then((r) => r.data.data as { count: number }),

  getFriends: (cursor?: string, limit = 20) =>
    api
      .get<
        ApiResponse<PaginatedResponse<Friend>>
      >("/friendships/friends", { params: { cursor, limit } })
      .then((r) => r.data.data!),

  getFriendCount: () =>
    api
      .get("/friendships/friends/count")
      .then((r) => r.data.data as { count: number }),

  getStatus: (userId: string) =>
    api
      .get<
        ApiResponse<RelationshipStatusResponse>
      >(`/friendships/status/${userId}`)
      .then((r) => r.data),

  getSuggestions: (limit = 20) =>
    api
      .get<ApiResponse<{ data: Suggestion[] }>>("/friendships/suggestions", {
        params: { limit },
      })
      .then((r) => r.data.data!.data),

  dismissSuggestion: (userId: string) =>
    api.post(`/friendships/suggestions/dismiss/${userId}`),

  getUserFriends: (userId: string, limit = 9) =>
    api
      .get<
        ApiResponse<PaginatedResponse<Friend>>
      >(`/friendships/user/${userId}/friends`, { params: { limit } })
      .then((r) => r.data.data!),
};

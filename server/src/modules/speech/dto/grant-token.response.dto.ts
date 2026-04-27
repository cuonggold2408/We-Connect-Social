export interface GrantTokenResponse {
  accessToken: string;
  expiresIn: number;
  remainingTokensToday: number;
  model: string;
  websocketUrl: string;
}

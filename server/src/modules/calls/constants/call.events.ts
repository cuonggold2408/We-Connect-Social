export const CALL_EVENTS = {
  CALL_INITIATE: 'call-initiate',
  CALL_ACCEPT: 'call-accept',
  CALL_REJECT: 'call-reject',
  CALL_END: 'call-end',
  WEBRTC_OFFER: 'webrtc-offer',
  WEBRTC_ANSWER: 'webrtc-answer',
  WEBRTC_ICE_CANDIDATE: 'webrtc-ice-candidate',

  INCOMING_CALL: 'incoming-call',
  CALL_INITIATED: 'call-initiated',
  CALL_ACCEPTED: 'call-accepted',
  CALL_REJECTED: 'call-rejected',
  CALL_ENDED: 'call-ended',
  CALL_TIMEOUT: 'call-timeout',
  CALL_BUSY: 'call-busy',
} as const;

export interface CallInitiatePayload {
  conversationId: string;
  calleeId: string;
  type: 'AUDIO' | 'VIDEO';
}

export interface WebRTCSignalPayload {
  callSessionId: string;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

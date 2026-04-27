const WORKLET_CODE = `
class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = [];
    this._samplesPerChunk = 0;
    this.port.onmessage = (e) => {
      if (e.data?.type === 'config') {
        this._samplesPerChunk = e.data.samplesPerChunk;
      }
    };
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;
    const channel = input[0];
    if (!channel) return true;

    for (let i = 0; i < channel.length; i++) {
      this._buffer.push(channel[i]);
    }

    while (this._buffer.length >= this._samplesPerChunk) {
      const chunk = this._buffer.splice(0, this._samplesPerChunk);
      const int16 = new Int16Array(chunk.length);
      for (let i = 0; i < chunk.length; i++) {
        const s = Math.max(-1, Math.min(1, chunk[i]));
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      this.port.postMessage(int16.buffer, [int16.buffer]);
    }

    return true;
  }
}

registerProcessor('pcm-processor', PCMProcessor);
`;

let cachedUrl: string | null = null;

export function getPcmWorkletUrl(): string {
  if (cachedUrl) return cachedUrl;
  const blob = new Blob([WORKLET_CODE], { type: "application/javascript" });
  cachedUrl = URL.createObjectURL(blob);
  return cachedUrl;
}

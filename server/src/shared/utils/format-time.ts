export function formatDurationVN(input: string): string {
  const regex = /(\d+)([smhdw])/g;

  const unitMap: Record<string, string> = {
    s: 'giây',
    m: 'phút',
    h: 'giờ',
    d: 'ngày',
    w: 'tuần',
  };

  const parts: string[] = [];
  let match;

  while ((match = regex.exec(input)) !== null) {
    const value = Number(match[1]);
    const unit = match[2];

    if (!unitMap[unit]) {
      throw new Error('Đơn vị không hợp lệ');
    }

    parts.push(`${value} ${unitMap[unit]}`);
  }

  if (parts.length === 0) {
    throw new Error('Chuỗi thời gian không hợp lệ');
  }

  return parts.join(' ');
}

export function parseExpiresInToMs(value: string): number {
  const match = value.match(/^(\d+)(s|m|h|d)$/);
  if (!match) throw new Error(`Invalid expires format: ${value}`);
  const num = parseInt(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60000,
    h: 3600000,
    d: 86400000,
  };
  return num * multipliers[unit];
}

export function formatMsToHMS(ms: number): string {
  if (ms < 0) {
    throw new Error('Thời gian không hợp lệ');
  }

  const totalSeconds = Math.floor(ms / 1000);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];

  if (hours > 0) parts.push(`${hours} giờ`);
  if (minutes > 0) parts.push(`${minutes} phút`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds} giây`);

  return parts.join(' ');
}

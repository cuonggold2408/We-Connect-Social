import { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import * as cookie from 'cookie';

export async function authenticateSocket(
  client: Socket,
  jwtService: JwtService,
  jwtSecret: string,
): Promise<string> {
  let token: string | undefined;

  const cookieHeader = client.handshake.headers.cookie;
  if (cookieHeader) {
    const cookies = cookie.parse(cookieHeader);
    token = cookies['access_token'];
  }

  if (!token) {
    token = client.handshake.headers.access_token as string;
  }

  if (!token) {
    throw new Error('Token is missing');
  }

  const payload = await jwtService.verifyAsync(token, {
    secret: jwtSecret,
  });

  return payload.sub as string;
}

export async function revalidateToken(
  client: Socket,
  jwtService: JwtService,
  jwtSecret: string,
): Promise<void> {
  try {
    await authenticateSocket(client, jwtService, jwtSecret);
  } catch {
    client.emit('auth-error', { message: 'Phiên đăng nhập đã hết hạn' });
    client.disconnect();
    throw new Error('Token expired');
  }
}

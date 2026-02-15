import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import type { Response } from 'express';
import type { ApiSuccessResponse } from '@shared/interfaces/api-response.interface';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiSuccessResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiSuccessResponse<T>> {
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((body) => {
        // Nếu service trả về { message: "..." } → lấy message, không có data
        // Nếu service trả về { message: "...", ...rest } → rest là data
        // Nếu service trả về object khác → toàn bộ là data
        if (body && typeof body === 'object' && 'message' in body) {
          const { message, ...data } = body as {
            message: string;
            [key: string]: unknown;
          };
          const result: ApiSuccessResponse<T> = {
            statusCode: response.statusCode,
            message: message,
          };

          if (Object.keys(data).length > 0) {
            result.data = data as T;
          }

          return result;
        }

        return {
          statusCode: response.statusCode,
          message: 'Success',
          data: body as T,
        };
      }),
    );
  }
}

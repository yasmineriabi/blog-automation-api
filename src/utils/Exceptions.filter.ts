import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(error: HttpException | Error, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status =
      error instanceof HttpException
        ? error.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string;
    if (error instanceof HttpException) {
      message = error.getResponse() as string;
    } else if (error instanceof Error) {
      message = error.message;
    } else {
      message = 'Internal server error';
    }

    response.status(status).json({
      statusCode: status,
      message: message,
    });
  }
}

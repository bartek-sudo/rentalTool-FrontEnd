export interface HttpResponse<T = any> {
  timeStamp: string;
  httpStatus: string;
  statusCode: number;
  reason: string;
  message: string;
  data?: T;
}

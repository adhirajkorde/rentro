export class ErrorResponse {
  constructor(statusCode, message) {
    this.statusCode = statusCode;
    this.message = message;
  }
}
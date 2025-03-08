class ResponseError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;

    // If status is 400, modify the response structure
    if (status === 400) {
      this.customResponse = {
        status: 102,
        message: message,
        data: null,
      };
    }
    // If status is 401, modify the response structure
    if (status === 401) {
      this.customResponse = {
        status: 103,
        message: message,
        data: null,
      };
    }
  }
}

export { ResponseError };

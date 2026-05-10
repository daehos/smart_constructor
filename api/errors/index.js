const HTTP_STATUS = Object.freeze({
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
});

export class BaseError extends Error {
  constructor(
    message = "Internal server error",
    statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    details = null,
  ) {
    super(message);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends BaseError {
  constructor({ message = "Bad request", details = null }) {
    super(message, HTTP_STATUS.BAD_REQUEST, details);
  }
}

export class NotFoundError extends BaseError {
  constructor({ message = "Resource not found", details = null }) {
    super(message, HTTP_STATUS.NOT_FOUND, details);
  }
}

export class ValidationError extends BaseError {
  constructor({ message = "Validation failed", details = null }) {
    super(message, HTTP_STATUS.UNPROCESSABLE_ENTITY, details);
  }
}

export class UnauthorizedError extends BaseError {
  constructor({ message = "Unauthorized", details = null }) {
    super(message, HTTP_STATUS.UNAUTHORIZED, details);
  }
}

export class ForbiddenError extends BaseError {
  constructor({ message = "Forbidden", details = null }) {
    super(message, HTTP_STATUS.FORBIDDEN, details);
  }
}

export class InternalServerError extends BaseError {
  constructor({ message = "Internal server error", details = null }) {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, details);
  }
}

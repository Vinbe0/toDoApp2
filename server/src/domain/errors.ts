/**
 * Errors that describe what went wrong in business terms.
 * The HTTP layer decides which status code each one maps to.
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends DomainError {}

export class NotFoundError extends DomainError {
  constructor(resource: string, id: string) {
    super(`${resource} with id "${id}" not found`);
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = "Unauthorized") {
    super(message);
  }
}

export class ConflictError extends DomainError {}

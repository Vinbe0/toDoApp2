import { ValidationError } from "./errors.js";

/** Value object: an email address that is valid by construction. */
export class Email {
  readonly address: string;

  constructor(address: string) {
    this.address = address;
    if (!this.address || !this.address.includes("@")) {
      throw new ValidationError("Invalid email address");
    }
  }
}

export interface UserProps {
  id: string;
  email: string;
  passwordHash: string;
}

export class User {
  id: string;
  email: Email;
  passwordHash: string;

  constructor({ id, email, passwordHash }: UserProps) {
    this.id = id;
    this.email = new Email(email);
    this.passwordHash = passwordHash;
  }
}

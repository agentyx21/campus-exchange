import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Custom URL validator that blocks private/internal IP addresses
 * to prevent SSRF (Server-Side Request Forgery) attacks.
 */
@ValidatorConstraint({ name: 'isSafeUrl', async: false })
export class IsSafeUrlConstraint implements ValidatorConstraintInterface {
  private readonly blockedPatterns = [
    /^https?:\/\/localhost/i,
    /^https?:\/\/127\./,
    /^https?:\/\/0\./,
    /^https?:\/\/10\./,
    /^https?:\/\/172\.(1[6-9]|2\d|3[01])\./,
    /^https?:\/\/192\.168\./,
    /^https?:\/\/169\.254\./,           // AWS metadata
    /^https?:\/\/\[::1\]/,              // IPv6 localhost
    /^https?:\/\/\[fc/i,               // IPv6 private
    /^https?:\/\/\[fd/i,               // IPv6 private
    /^https?:\/\/\[fe80:/i,            // IPv6 link-local
    /^https?:\/\/metadata\./i,          // Cloud metadata
    /^https?:\/\/internal\./i,
  ];

  validate(url: string): boolean {
    if (!url || typeof url !== 'string') return false;

    // Must be http or https
    if (!/^https?:\/\//i.test(url)) return false;

    // Block private/internal URLs
    for (const pattern of this.blockedPatterns) {
      if (pattern.test(url)) return false;
    }

    // Basic URL validity check
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  defaultMessage(): string {
    return 'URL must be a valid public HTTP/HTTPS URL';
  }
}

export function IsSafeUrl(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsSafeUrlConstraint,
    });
  };
}

/**
 * Accepts a public HTTP/HTTPS URL or a `data:image/jpeg|png;base64,...`
 * data URI. Data URIs are sniffed for PNG/JPEG magic bytes so the declared
 * MIME type can't be spoofed.
 */
@ValidatorConstraint({ name: 'isListingImage', async: false })
export class IsListingImageConstraint implements ValidatorConstraintInterface {
  // 4.2 MB cap ≈ 3 MB binary after base64, matching the client-side limit.
  private static readonly MAX_DATA_URI_LENGTH = 4_200_000;
  // ~80 chars ≈ 60 bytes — rejects trivially small payloads.
  private static readonly MIN_BASE64_LENGTH = 80;
  private static readonly DATA_URI_PATTERN =
    /^data:image\/(jpeg|png);base64,([A-Za-z0-9+/]+={0,2})$/;

  // PNG signature: 89 50 4E 47 0D 0A 1A 0A (8 bytes)
  private static readonly PNG_MAGIC = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);
  // JPEG SOI marker: FF D8 FF (3 bytes; 4th byte varies by sub-format)
  private static readonly JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff]);

  private readonly urlValidator = new IsSafeUrlConstraint();

  validate(value: string): boolean {
    if (!value || typeof value !== 'string') return false;

    if (value.startsWith('data:')) {
      if (value.length > IsListingImageConstraint.MAX_DATA_URI_LENGTH) {
        return false;
      }
      const match = IsListingImageConstraint.DATA_URI_PATTERN.exec(value);
      if (!match) return false;

      const [, mime, base64] = match;
      if (base64.length < IsListingImageConstraint.MIN_BASE64_LENGTH) {
        return false;
      }

      // Decode just enough leading base64 to check the magic bytes.
      // 12 base64 chars → 9 bytes, enough for PNG (8) and JPEG (3).
      let head: Buffer;
      try {
        head = Buffer.from(base64.slice(0, 12), 'base64');
      } catch {
        return false;
      }

      if (mime === 'png') {
        return head.length >= 8 && head.subarray(0, 8).equals(IsListingImageConstraint.PNG_MAGIC);
      }
      if (mime === 'jpeg') {
        return head.length >= 3 && head.subarray(0, 3).equals(IsListingImageConstraint.JPEG_MAGIC);
      }
      return false;
    }

    return this.urlValidator.validate(value);
  }

  defaultMessage(): string {
    return 'Image must be a public HTTP/HTTPS URL or a valid JPEG/PNG data URI (max 3 MB file)';
  }
}

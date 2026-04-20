import { PipeTransform, Injectable } from '@nestjs/common';
import sanitizeHtml = require('sanitize-html');

/**
 * Recursively strips all HTML tags from string fields in the request body.
 * Prevents stored XSS attacks by sanitizing user input before it reaches the database.
 */
@Injectable()
export class SanitizePipe implements PipeTransform {
  transform(value: any) {
    if (typeof value === 'string') {
      return this.sanitize(value);
    }
    if (typeof value === 'object' && value !== null) {
      return this.sanitizeObject(value);
    }
    return value;
  }

  private sanitize(text: string): string {
    return sanitizeHtml(text, {
      allowedTags: [],
      allowedAttributes: {},
    }).trim();
  }

  private sanitizeObject(obj: any): any {
    const result: any = {};
    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === 'string') {
        result[key] = this.sanitize(obj[key]);
      } else if (Array.isArray(obj[key])) {
        result[key] = obj[key].map((item: any) =>
          typeof item === 'string' ? this.sanitize(item) : item,
        );
      } else {
        result[key] = obj[key];
      }
    }
    return result;
  }
}

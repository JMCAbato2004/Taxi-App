// JWT utilities for token generation and validation
import { User, JWTPayload, AuthError, AuthErrorCode, ROLE_PERMISSIONS } from '../types';

export class JWTUtils {
  private readonly SECRET_KEY = 'taxi_app_secret_key_2024'; // In production, use environment variable
  private readonly REFRESH_SECRET = 'taxi_app_refresh_secret_2024';
  private readonly TOKEN_EXPIRY = 24 * 60 * 60; // 24 hours in seconds
  private readonly REFRESH_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds

  generateToken(user: User): string {
    const now = Math.floor(Date.now() / 1000);
    
    const payload: JWTPayload = {
      sub: user.id,
      email: user.email,
      role: user.rol,
      numeroTaxista: user.numeroTaxista,
      permissions: ROLE_PERMISSIONS[user.rol],
      iat: now,
      exp: now + this.TOKEN_EXPIRY
    };

    return this.createToken(payload, this.SECRET_KEY);
  }

  generateRefreshToken(user: User): string {
    const now = Math.floor(Date.now() / 1000);
    
    const payload = {
      sub: user.id,
      type: 'refresh',
      iat: now,
      exp: now + this.REFRESH_EXPIRY
    };

    return this.createToken(payload, this.REFRESH_SECRET);
  }

  verifyToken(token: string): JWTPayload {
    try {
      return this.parseToken(token, this.SECRET_KEY) as JWTPayload;
    } catch (error) {
      throw new AuthError(
        AuthErrorCode.INVALID_TOKEN,
        'Token inválido o expirado'
      );
    }
  }

  verifyRefreshToken(token: string): { sub: string; type: string; iat: number; exp: number } {
    try {
      return this.parseToken(token, this.REFRESH_SECRET) as { sub: string; type: string; iat: number; exp: number };
    } catch (error) {
      throw new AuthError(
        AuthErrorCode.INVALID_TOKEN,
        'Refresh token inválido o expirado'
      );
    }
  }

  isTokenExpired(token: string): boolean {
    try {
      const payload = this.parseToken(token, this.SECRET_KEY);
      return payload.exp <= Math.floor(Date.now() / 1000);
    } catch {
      return true;
    }
  }

  getTokenPayload(token: string): JWTPayload | null {
    try {
      return this.parseToken(token, this.SECRET_KEY) as JWTPayload;
    } catch {
      return null;
    }
  }

  // Simple JWT implementation (in production, use a proper JWT library)
  private createToken(payload: any, secret: string): string {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    
    const signature = this.createSignature(
      `${encodedHeader}.${encodedPayload}`,
      secret
    );

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  private parseToken(token: string, secret: string): any {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const [encodedHeader, encodedPayload, signature] = parts;
    
    // Verify signature
    const expectedSignature = this.createSignature(
      `${encodedHeader}.${encodedPayload}`,
      secret
    );

    if (signature !== expectedSignature) {
      throw new Error('Invalid token signature');
    }

    // Parse payload
    if (!encodedPayload) {
      throw new Error('Invalid token payload');
    }
    
    const payload = JSON.parse(this.base64UrlDecode(encodedPayload));
    
    // Check expiration
    if (payload.exp && payload.exp <= Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }

    return payload;
  }

  private createSignature(data: string, secret: string): string {
    // Simple HMAC-like signature (in production, use crypto.createHmac)
    // This is a simplified implementation for demo purposes
    let hash = 0;
    const combined = data + secret;
    
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return this.base64UrlEncode(hash.toString());
  }

  private base64UrlEncode(str: string): string {
    // Convert string to base64 and make it URL-safe
    const base64 = btoa(str);
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  private base64UrlDecode(str: string): string {
    // Convert URL-safe base64 back to regular base64 and decode
    let base64 = str
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    // Add padding if needed
    while (base64.length % 4) {
      base64 += '=';
    }
    
    return atob(base64);
  }
}
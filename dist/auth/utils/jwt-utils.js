// JWT utilities for token generation and validation
import { AuthError, AuthErrorCodes } from '../types';
export class JWTUtils {
    constructor() {
        this.SECRET_KEY = 'taxi_app_secret_key_2024'; // In production, use environment variable
        this.REFRESH_SECRET = 'taxi_app_refresh_secret_2024';
        this.TOKEN_EXPIRY = 24 * 60 * 60; // 24 hours in seconds
        this.REFRESH_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds
    }
    generateToken(user) {
        const now = Math.floor(Date.now() / 1000);
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.rol,
            numeroTaxista: user.numeroTaxista,
            permissions: user.permissions,
            iat: now,
            exp: now + this.TOKEN_EXPIRY
        };
        return this.createToken(payload, this.SECRET_KEY);
    }
    generateRefreshToken(user) {
        const now = Math.floor(Date.now() / 1000);
        const payload = {
            sub: user.id,
            type: 'refresh',
            iat: now,
            exp: now + this.REFRESH_EXPIRY
        };
        return this.createToken(payload, this.REFRESH_SECRET);
    }
    verifyToken(token) {
        try {
            return this.parseToken(token, this.SECRET_KEY);
        }
        catch (error) {
            throw new AuthError(AuthErrorCodes.INVALID_TOKEN, 'Token inválido o expirado');
        }
    }
    verifyRefreshToken(token) {
        try {
            return this.parseToken(token, this.REFRESH_SECRET);
        }
        catch (error) {
            throw new AuthError(AuthErrorCodes.INVALID_TOKEN, 'Refresh token inválido o expirado');
        }
    }
    isTokenExpired(token) {
        try {
            const payload = this.parseToken(token, this.SECRET_KEY);
            return payload.exp <= Math.floor(Date.now() / 1000);
        }
        catch {
            return true;
        }
    }
    getTokenPayload(token) {
        try {
            return this.parseToken(token, this.SECRET_KEY);
        }
        catch {
            return null;
        }
    }
    // Simple JWT implementation (in production, use a proper JWT library)
    createToken(payload, secret) {
        const header = {
            alg: 'HS256',
            typ: 'JWT'
        };
        const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
        const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
        const signature = this.createSignature(`${encodedHeader}.${encodedPayload}`, secret);
        return `${encodedHeader}.${encodedPayload}.${signature}`;
    }
    parseToken(token, secret) {
        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid token format');
        }
        const [encodedHeader, encodedPayload, signature] = parts;
        // Verify signature
        const expectedSignature = this.createSignature(`${encodedHeader}.${encodedPayload}`, secret);
        if (signature !== expectedSignature) {
            throw new Error('Invalid token signature');
        }
        // Parse payload
        const payload = JSON.parse(this.base64UrlDecode(encodedPayload));
        // Check expiration
        if (payload.exp && payload.exp <= Math.floor(Date.now() / 1000)) {
            throw new Error('Token expired');
        }
        return payload;
    }
    createSignature(data, secret) {
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
    base64UrlEncode(str) {
        // Convert string to base64 and make it URL-safe
        const base64 = btoa(str);
        return base64
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }
    base64UrlDecode(str) {
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
//# sourceMappingURL=jwt-utils.js.map
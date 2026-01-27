import { User, JWTPayload } from '../types';
export declare class JWTUtils {
    private readonly SECRET_KEY;
    private readonly REFRESH_SECRET;
    private readonly TOKEN_EXPIRY;
    private readonly REFRESH_EXPIRY;
    generateToken(user: User): string;
    generateRefreshToken(user: User): string;
    verifyToken(token: string): JWTPayload;
    verifyRefreshToken(token: string): {
        sub: string;
        type: string;
        iat: number;
        exp: number;
    };
    isTokenExpired(token: string): boolean;
    getTokenPayload(token: string): JWTPayload | null;
    private createToken;
    private parseToken;
    private createSignature;
    private base64UrlEncode;
    private base64UrlDecode;
}
//# sourceMappingURL=jwt-utils.d.ts.map
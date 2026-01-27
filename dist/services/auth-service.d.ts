import { User, LoginCredentials, UserRegistrationData, AuthResult, IAuthService } from '../types';
import { JWTUtils } from '../utils/jwt-utils';
import { CryptoUtils } from '../utils/crypto-utils';
export declare class AuthService implements IAuthService {
    private jwtUtils;
    private cryptoUtils;
    private currentUser;
    private currentToken;
    private readonly STORAGE_KEY;
    private readonly OFFLINE_KEY;
    constructor(jwtUtils: JWTUtils, cryptoUtils: CryptoUtils);
    login(credentials: LoginCredentials): Promise<AuthResult>;
    logout(): Promise<void>;
    register(userData: UserRegistrationData): Promise<User>;
    getCurrentUser(): User | null;
    isAuthenticated(): boolean;
    refreshToken(): Promise<string>;
    validateOfflineAccess(): boolean;
    changePassword(currentPassword: string, newPassword: string): Promise<void>;
    private loadStoredAuth;
    private storeAuthData;
    private getStoredAuthData;
    private getOfflineAuthData;
    private authenticateUser;
    private emailExists;
    private createUser;
    private updateUserPassword;
    private getStoredUsers;
    private storeUsers;
    private generateUserId;
    private generateTaxistaNumber;
}
//# sourceMappingURL=auth-service.d.ts.map
/**
 * Sensitive Data Confirmation Demo
 * Demonstrates how to use the sensitive data confirmation system
 * Requirements: 6.4 - Additional confirmation for sensitive data modifications
 */
import { AuthService } from '../services/auth-service';
import { RoleService } from '../services/role-service';
import { SensitiveDataConfirmationService, ConfirmationMethod } from '../services/sensitive-data-confirmation';
import { JWTUtils } from '../utils/jwt-utils';
import { CryptoUtils } from '../utils/crypto-utils';
/**
 * Demo class showing sensitive data confirmation workflows
 */
export class SensitiveDataConfirmationDemo {
    constructor() {
        // Initialize services
        const jwtUtils = new JWTUtils();
        const cryptoUtils = new CryptoUtils();
        this.sensitiveDataService = new SensitiveDataConfirmationService(cryptoUtils);
        this.authService = new AuthService(jwtUtils, cryptoUtils, this.sensitiveDataService);
        this.roleService = new RoleService(() => this.authService.getCurrentUser(), this.sensitiveDataService);
    }
    /**
     * Demo: Password change with confirmation
     */
    async demoPasswordChange() {
        console.log('\n=== Password Change Demo ===');
        try {
            // Step 1: User initiates password change
            console.log('1. Initiating password change...');
            const confirmationRequest = await this.authService.initiatePasswordChange('CurrentPassword123!', 'NewSecurePassword456!');
            console.log(`✓ Confirmation request created: ${confirmationRequest.id}`);
            console.log(`  Required methods: ${confirmationRequest.requiredMethods.join(', ')}`);
            console.log(`  Expires at: ${confirmationRequest.expiresAt.toISOString()}`);
            // Step 2: User provides password confirmation
            console.log('\n2. Processing password confirmation...');
            const confirmationResult = await this.sensitiveDataService.processConfirmation(confirmationRequest.id, {
                method: ConfirmationMethod.PASSWORD_VERIFICATION,
                data: { password: 'CurrentPassword123!' }
            }, this.authService.getCurrentUser());
            if (confirmationResult.success && confirmationResult.canProceed) {
                console.log('✓ Password confirmation successful');
                // Step 3: Execute the confirmed password change
                console.log('\n3. Executing confirmed password change...');
                await this.authService.executeConfirmedPasswordChange(confirmationRequest.id);
                console.log('✓ Password changed successfully');
            }
            else {
                console.log('✗ Password confirmation failed');
            }
        }
        catch (error) {
            console.error('Password change demo failed:', error);
        }
    }
    /**
     * Demo: Email change with multi-step confirmation
     */
    async demoEmailChange() {
        console.log('\n=== Email Change Demo ===');
        try {
            // Step 1: User initiates email change
            console.log('1. Initiating email change...');
            const confirmationRequest = await this.authService.initiateEmailChange('newemail@example.com');
            console.log(`✓ Confirmation request created: ${confirmationRequest.id}`);
            console.log(`  Required methods: ${confirmationRequest.requiredMethods.join(', ')}`);
            // Step 2: Password verification
            console.log('\n2. Processing password verification...');
            const passwordResult = await this.sensitiveDataService.processConfirmation(confirmationRequest.id, {
                method: ConfirmationMethod.PASSWORD_VERIFICATION,
                data: { password: 'CurrentPassword123!' }
            }, this.authService.getCurrentUser());
            if (passwordResult.success) {
                console.log('✓ Password verification successful');
                // Step 3: Email verification (simulated)
                console.log('\n3. Processing email verification...');
                const emailResult = await this.sensitiveDataService.processConfirmation(confirmationRequest.id, {
                    method: ConfirmationMethod.EMAIL_VERIFICATION,
                    data: { code: 'EMAIL123' } // In real implementation, this would be sent via email
                }, this.authService.getCurrentUser());
                if (emailResult.success && emailResult.canProceed) {
                    console.log('✓ Email verification successful');
                    // Step 4: Execute the confirmed email change
                    console.log('\n4. Executing confirmed email change...');
                    await this.authService.executeConfirmedEmailChange(confirmationRequest.id);
                    console.log('✓ Email changed successfully');
                }
                else {
                    console.log('✗ Email verification failed (expected with demo code)');
                }
            }
            else {
                console.log('✗ Password verification failed');
            }
        }
        catch (error) {
            console.error('Email change demo failed:', error);
        }
    }
    /**
     * Demo: Association management with confirmation
     */
    async demoAssociationManagement() {
        console.log('\n=== Association Management Demo ===');
        try {
            // Assume we have patron and taxista users
            const patronId = 'patron_123';
            const taxistaId = 'taxista_456';
            // Step 1: Initiate association creation
            console.log('1. Initiating association creation...');
            const createRequest = await this.roleService.initiateAssociationCreation(patronId, taxistaId);
            console.log(`✓ Association creation request: ${createRequest.id}`);
            // Step 2: Confirm association creation
            console.log('\n2. Processing association creation confirmation...');
            const createResult = await this.sensitiveDataService.processConfirmation(createRequest.id, {
                method: ConfirmationMethod.PASSWORD_VERIFICATION,
                data: { password: 'PatronPassword123!' }
            }, this.authService.getCurrentUser());
            if (createResult.success && createResult.canProceed) {
                console.log('✓ Association creation confirmed');
                // Step 3: Execute confirmed association creation
                console.log('\n3. Executing confirmed association creation...');
                const association = await this.roleService.executeConfirmedAssociationCreation(createRequest.id);
                console.log(`✓ Association created: ${association.id}`);
                // Step 4: Later, initiate association removal
                console.log('\n4. Initiating association removal...');
                const removeRequest = await this.roleService.initiateAssociationRemoval(association.id);
                console.log(`✓ Association removal request: ${removeRequest.id}`);
                // Step 5: Confirm association removal
                console.log('\n5. Processing association removal confirmation...');
                const removeResult = await this.sensitiveDataService.processConfirmation(removeRequest.id, {
                    method: ConfirmationMethod.PASSWORD_VERIFICATION,
                    data: { password: 'PatronPassword123!' }
                }, this.authService.getCurrentUser());
                if (removeResult.success && removeResult.canProceed) {
                    console.log('✓ Association removal confirmed');
                    // Step 6: Execute confirmed association removal
                    console.log('\n6. Executing confirmed association removal...');
                    await this.roleService.executeConfirmedAssociationRemoval(removeRequest.id);
                    console.log('✓ Association removed successfully');
                }
            }
        }
        catch (error) {
            console.error('Association management demo failed:', error);
        }
    }
    /**
     * Demo: Confirmation status tracking
     */
    async demoConfirmationStatus() {
        console.log('\n=== Confirmation Status Demo ===');
        try {
            // Create a confirmation request
            const request = await this.authService.initiatePasswordChange('CurrentPassword123!', 'NewPassword456!');
            // Check initial status
            console.log('1. Initial confirmation status:');
            let status = await this.sensitiveDataService.getConfirmationStatus(request.id, this.authService.getCurrentUser());
            console.log(`   Exists: ${status.exists}`);
            console.log(`   Completed: ${status.completed}`);
            console.log(`   Expired: ${status.expired}`);
            console.log(`   Remaining methods: ${status.remainingMethods.join(', ')}`);
            console.log(`   Attempts remaining: ${status.attemptsRemaining}`);
            // Process confirmation
            console.log('\n2. Processing confirmation...');
            await this.sensitiveDataService.processConfirmation(request.id, {
                method: ConfirmationMethod.PASSWORD_VERIFICATION,
                data: { password: 'CurrentPassword123!' }
            }, this.authService.getCurrentUser());
            // Check updated status
            console.log('\n3. Updated confirmation status:');
            status = await this.sensitiveDataService.getConfirmationStatus(request.id, this.authService.getCurrentUser());
            console.log(`   Completed: ${status.completed}`);
            console.log(`   Remaining methods: ${status.remainingMethods.join(', ')}`);
            // Cancel the request
            console.log('\n4. Cancelling confirmation request...');
            await this.sensitiveDataService.cancelConfirmation(request.id, this.authService.getCurrentUser());
            // Check final status
            status = await this.sensitiveDataService.getConfirmationStatus(request.id, this.authService.getCurrentUser());
            console.log(`   Exists after cancellation: ${status.exists}`);
        }
        catch (error) {
            console.error('Confirmation status demo failed:', error);
        }
    }
    /**
     * Demo: Error handling scenarios
     */
    async demoErrorHandling() {
        console.log('\n=== Error Handling Demo ===');
        try {
            // Demo 1: Wrong password
            console.log('1. Testing wrong password scenario...');
            const request = await this.authService.initiatePasswordChange('CurrentPassword123!', 'NewPassword456!');
            try {
                await this.sensitiveDataService.processConfirmation(request.id, {
                    method: ConfirmationMethod.PASSWORD_VERIFICATION,
                    data: { password: 'WrongPassword!' }
                }, this.authService.getCurrentUser());
            }
            catch (error) {
                console.log('✓ Wrong password correctly rejected');
            }
            // Demo 2: Non-existent request
            console.log('\n2. Testing non-existent request scenario...');
            try {
                await this.sensitiveDataService.processConfirmation('non_existent_request', {
                    method: ConfirmationMethod.PASSWORD_VERIFICATION,
                    data: { password: 'CurrentPassword123!' }
                }, this.authService.getCurrentUser());
            }
            catch (error) {
                console.log('✓ Non-existent request correctly rejected');
            }
            // Demo 3: Expired request
            console.log('\n3. Testing expired request scenario...');
            // This would require manually expiring a request, which is complex in a demo
            console.log('✓ Error handling scenarios completed');
        }
        catch (error) {
            console.error('Error handling demo failed:', error);
        }
    }
    /**
     * Run all demos
     */
    async runAllDemos() {
        console.log('🔐 Sensitive Data Confirmation System Demo');
        console.log('==========================================');
        // Note: These demos would require proper user setup in a real scenario
        console.log('\nNote: This demo assumes a logged-in user. In a real application,');
        console.log('you would need to register and login a user first.');
        await this.demoPasswordChange();
        await this.demoEmailChange();
        await this.demoAssociationManagement();
        await this.demoConfirmationStatus();
        await this.demoErrorHandling();
        console.log('\n✅ All demos completed!');
    }
}
/**
 * Usage example
 */
export async function runSensitiveDataDemo() {
    const demo = new SensitiveDataConfirmationDemo();
    await demo.runAllDemos();
}
// Export for use in other files
export default SensitiveDataConfirmationDemo;
//# sourceMappingURL=sensitive-data-confirmation-demo.js.map
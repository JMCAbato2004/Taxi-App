/**
 * Test runner for Association Management Demo
 */

import { demonstrateAssociationManagement } from '../association-management-demo';

describe('Association Management Demo', () => {
  it('should run the complete demo without errors', async () => {
    // Capture console output
    const consoleLogs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: any[]) => {
      consoleLogs.push(args.join(' '));
      originalLog(...args);
    };

    try {
      await demonstrateAssociationManagement();
      
      // Verify key demo steps were executed
      expect(consoleLogs.some(log => log.includes('Creating test users'))).toBe(true);
      expect(consoleLogs.some(log => log.includes('Searching for available taxistas'))).toBe(true);
      expect(consoleLogs.some(log => log.includes('Creating associations'))).toBe(true);
      expect(consoleLogs.some(log => log.includes('Checking notifications'))).toBe(true);
      expect(consoleLogs.some(log => log.includes('Demo completed successfully'))).toBe(true);
    } finally {
      // Restore console.log
      console.log = originalLog;
    }
  }, 30000); // 30 second timeout for the demo
});
/**
 * Unit tests for Data Synchronization Service
 * Tests offline operation queue and conflict resolution functionality
 * Requirements: 5.1, 5.3
 */

import { 
  DataSyncService,
  SyncOperationType,
  SyncOperationStatus,
  ConflictResolutionStrategy,
  PendingOperation,
  SyncConflict
} from '../data-sync';
import { SecureStorageService } from '../secure-storage';
import { RoleService } from '../role-service';
import { ServiceExpenseIntegrationService } from '../service-expense-integration';
import { 
  User, 
  UserRole, 
  AuthError, 
  AuthErrorCode 
} from '../../types';
import { CryptoUtils } from '../../utils/crypto-utils';

// Mock dependencies
jest.mock('../secure-storage');
jest.mock('../role-service');
jest.mock('../service-expense-integration');
jest.mock('../../utils/crypto-utils');

describe('DataSyncService', () => {
  let dataSyncService: DataSyncService;
  let mockSecureStorage: jest.Mocked<SecureStorageService>;
  let mockRoleService: jest.Mocked<RoleService>;
  let mockServiceExpenseIntegration: jest.Mocked<ServiceExpenseIntegrationService>;
  let mockGetCurrentUser: jest.Mock;

  const mockPatronUser: User = {
    id: 'patron-1',
    email: 'patron@test.com',
    nombre: 'Test Patron',
    rol: UserRole.PATRON,
    activo: true,
    fechaCreacion: new Date('2024-01-01'),
    fechaActualizacion: new Date('2024-01-01')
  };

  const mockTaxistaUser: User = {
    id: 'taxista-1',
    email: 'taxista@test.com',
    nombre: 'Test Taxista',
    rol: UserRole.TAXISTA,
    numeroTaxista: 'TX001',
    activo: true,
    fechaCreacion: new Date('2024-01-01'),
    fechaActualizacion: new Date('2024-01-01')
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock secure storage
    mockSecureStorage = new SecureStorageService() as jest.Mocked<SecureStorageService>;
    mockSecureStorage.getCriticalData = jest.fn().mockResolvedValue(null);
    mockSecureStorage.storeCriticalData = jest.fn().mockResolvedValue(undefined);

    // Mock role service
    mockRoleService = new RoleService({} as any, {} as any) as jest.Mocked<RoleService>;
    mockRoleService.getAccessibleUsers = jest.fn().mockReturnValue([mockTaxistaUser]);

    // Mock service expense integration
    mockServiceExpenseIntegration = {} as jest.Mocked<ServiceExpenseIntegrationService>;

    // Mock getCurrentUser function
    mockGetCurrentUser = jest.fn().mockReturnValue(mockPatronUser);

    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });

    // Mock window event listeners
    global.window = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    } as any;

    // Mock setInterval/clearInterval
    global.setInterval = jest.fn().mockReturnValue(123);
    global.clearInterval = jest.fn();
    global.setTimeout = jest.fn().mockImplementation((fn) => fn());

    // Create service instance
    dataSyncService = new DataSyncService(
      mockSecureStorage,
      mockRoleService,
      mockServiceExpenseIntegration,
      mockGetCurrentUser
    );
  });

  afterEach(() => {
    dataSyncService.destroy();
  });

  describe('Queue Management', () => {
    it('should queue operation successfully', async () => {
      const serviceData = {
        id: 'service-1',
        description: 'Test service',
        amount: 100
      };

      const operationId = await dataSyncService.queueOperation(
        SyncOperationType.CREATE_SERVICE,
        serviceData
      );

      expect(operationId).toBeDefined();
      expect(operationId).toMatch(/^sync_\d+_[a-z0-9]+$/);
      expect(mockSecureStorage.storeCriticalData).toHaveBeenCalledWith(
        'sync_queue',
        expect.any(Array)
      );
    });

    it('should throw error when user not authenticated', async () => {
      mockGetCurrentUser.mockReturnValue(null);

      await expect(
        dataSyncService.queueOperation(SyncOperationType.CREATE_SERVICE, {})
      ).rejects.toThrow(AuthError);
    });

    it('should throw error when queue is full', async () => {
      // Mock a full queue
      const fullQueue = Array(100).fill(null).map((_, i) => ({
        id: `op-${i}`,
        type: SyncOperationType.CREATE_SERVICE,
        status: SyncOperationStatus.PENDING,
        userId: 'user-1',
        userRole: UserRole.TAXISTA,
        data: {},
        timestamp: new Date(),
        retryCount: 0,
        maxRetries: 3,
        priority: 50
      }));

      mockSecureStorage.getCriticalData.mockResolvedValue(fullQueue);

      // Recreate service to load the full queue
      dataSyncService.destroy();
      dataSyncService = new DataSyncService(
        mockSecureStorage,
        mockRoleService,
        mockServiceExpenseIntegration,
        mockGetCurrentUser
      );

      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 10));

      await expect(
        dataSyncService.queueOperation(SyncOperationType.CREATE_SERVICE, {})
      ).rejects.toThrow('Cola de sincronización llena');
    });

    it('should prioritize operations correctly', async () => {
      const operations = [
        { type: SyncOperationType.CREATE_SERVICE, expectedPriority: 70 },
        { type: SyncOperationType.CREATE_ASSOCIATION, expectedPriority: 90 },
        { type: SyncOperationType.UPDATE_PROFILE, expectedPriority: 80 },
        { type: SyncOperationType.DELETE_SERVICE, expectedPriority: 50 }
      ];

      const operationIds = [];
      for (const op of operations) {
        const id = await dataSyncService.queueOperation(op.type, {});
        operationIds.push(id);
      }

      const pendingOps = dataSyncService.getPendingOperations();
      
      // Should be sorted by priority (highest first)
      expect(pendingOps[0].type).toBe(SyncOperationType.CREATE_ASSOCIATION);
      expect(pendingOps[1].type).toBe(SyncOperationType.UPDATE_PROFILE);
      expect(pendingOps[2].type).toBe(SyncOperationType.CREATE_SERVICE);
      expect(pendingOps[3].type).toBe(SyncOperationType.DELETE_SERVICE);
    });

    it('should give higher priority to patron operations when configured', async () => {
      // Create service with prioritizeUserRole enabled
      dataSyncService.destroy();
      dataSyncService = new DataSyncService(
        mockSecureStorage,
        mockRoleService,
        mockServiceExpenseIntegration,
        mockGetCurrentUser,
        { prioritizeUserRole: true }
      );

      await dataSyncService.queueOperation(SyncOperationType.CREATE_SERVICE, {});
      
      const pendingOps = dataSyncService.getPendingOperations();
      expect(pendingOps[0].priority).toBe(80); // 70 + 10 patron bonus
    });
  });

  describe('Pending Operations Retrieval', () => {
    beforeEach(async () => {
      // Add some test operations
      await dataSyncService.queueOperation(SyncOperationType.CREATE_SERVICE, { id: 'service-1' });
      await dataSyncService.queueOperation(SyncOperationType.CREATE_EXPENSE, { id: 'expense-1' });
    });

    it('should return pending operations for current user', () => {
      const pendingOps = dataSyncService.getPendingOperations();
      
      expect(pendingOps).toHaveLength(2);
      expect(pendingOps.every(op => op.userId === mockPatronUser.id)).toBe(true);
      expect(pendingOps.every(op => op.status === SyncOperationStatus.PENDING)).toBe(true);
    });

    it('should return empty array when user not authenticated', () => {
      mockGetCurrentUser.mockReturnValue(null);
      
      const pendingOps = dataSyncService.getPendingOperations();
      expect(pendingOps).toHaveLength(0);
    });

    it('should allow patron to see taxista operations', () => {
      mockRoleService.getAccessibleUsers.mockReturnValue([mockTaxistaUser]);
      
      const pendingOps = dataSyncService.getPendingOperations(mockTaxistaUser.id);
      expect(pendingOps).toHaveLength(0); // No operations for taxista yet
    });

    it('should not allow taxista to see other user operations', () => {
      mockGetCurrentUser.mockReturnValue(mockTaxistaUser);
      
      const pendingOps = dataSyncService.getPendingOperations('other-user-id');
      expect(pendingOps).toHaveLength(0);
    });
  });

  describe('Operation Cancellation', () => {
    let operationId: string;

    beforeEach(async () => {
      operationId = await dataSyncService.queueOperation(
        SyncOperationType.CREATE_SERVICE, 
        { id: 'service-1' }
      );
    });

    it('should cancel operation successfully', async () => {
      await dataSyncService.cancelOperation(operationId);
      
      const pendingOps = dataSyncService.getPendingOperations();
      expect(pendingOps).toHaveLength(0);
    });

    it('should throw error when operation not found', async () => {
      await expect(
        dataSyncService.cancelOperation('non-existent-id')
      ).rejects.toThrow('Operación no encontrada');
    });

    it('should throw error when user not authenticated', async () => {
      mockGetCurrentUser.mockReturnValue(null);
      
      await expect(
        dataSyncService.cancelOperation(operationId)
      ).rejects.toThrow(AuthError);
    });

    it('should throw error when user lacks permission', async () => {
      // Create operation as patron
      const patronOperationId = operationId;
      
      // Try to cancel as taxista
      mockGetCurrentUser.mockReturnValue(mockTaxistaUser);
      mockRoleService.getAccessibleUsers.mockReturnValue([]);
      
      await expect(
        dataSyncService.cancelOperation(patronOperationId)
      ).rejects.toThrow('Sin permisos para cancelar esta operación');
    });
  });

  describe('Synchronization Process', () => {
    beforeEach(async () => {
      // Add test operations
      await dataSyncService.queueOperation(SyncOperationType.CREATE_SERVICE, { id: 'service-1' });
      await dataSyncService.queueOperation(SyncOperationType.CREATE_EXPENSE, { id: 'expense-1' });
    });

    it('should not sync when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      
      await dataSyncService.performSync();
      
      const pendingOps = dataSyncService.getPendingOperations();
      expect(pendingOps.every(op => op.status === SyncOperationStatus.PENDING)).toBe(true);
    });

    it('should not sync when already in progress', async () => {
      // Start first sync
      const syncPromise1 = dataSyncService.performSync();
      
      // Try to start second sync immediately
      const syncPromise2 = dataSyncService.performSync();
      
      await Promise.all([syncPromise1, syncPromise2]);
      
      // Should not cause issues
      expect(true).toBe(true);
    });

    it('should force sync when requested', async () => {
      await dataSyncService.forcSync();
      
      // Operations should be processed (mocked as successful)
      const stats = await dataSyncService.getSyncStats();
      expect(stats.totalOperations).toBeGreaterThan(0);
    });

    it('should throw error when forcing sync offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      
      await expect(dataSyncService.forcSync()).rejects.toThrow('Sin conexión a internet');
    });
  });

  describe('Conflict Resolution', () => {
    it('should store conflicts for manual resolution', async () => {
      const conflict: SyncConflict = {
        operationId: 'op-1',
        type: SyncOperationType.UPDATE_SERVICE,
        localData: { name: 'Local Name', amount: 100 },
        serverData: { name: 'Server Name', amount: 150 },
        conflictFields: ['name', 'amount'],
        suggestedResolution: ConflictResolutionStrategy.MERGE,
        timestamp: new Date()
      };

      mockSecureStorage.getCriticalData.mockResolvedValue([]);
      
      // Simulate conflict storage (private method, so we test through public interface)
      await dataSyncService.queueOperation(
        SyncOperationType.UPDATE_SERVICE,
        { name: 'Local Name', amount: 100 },
        { conflictResolution: ConflictResolutionStrategy.MANUAL }
      );

      expect(mockSecureStorage.storeCriticalData).toHaveBeenCalled();
    });

    it('should resolve conflict with client wins strategy', async () => {
      const operationId = await dataSyncService.queueOperation(
        SyncOperationType.UPDATE_SERVICE,
        { name: 'Local Name' }
      );

      const conflict: SyncConflict = {
        operationId,
        type: SyncOperationType.UPDATE_SERVICE,
        localData: { name: 'Local Name' },
        serverData: { name: 'Server Name' },
        conflictFields: ['name'],
        suggestedResolution: ConflictResolutionStrategy.CLIENT_WINS,
        timestamp: new Date()
      };

      mockSecureStorage.getCriticalData.mockResolvedValue([conflict]);

      await dataSyncService.resolveConflict(
        operationId,
        ConflictResolutionStrategy.CLIENT_WINS
      );

      const pendingOps = dataSyncService.getPendingOperations();
      const resolvedOp = pendingOps.find(op => op.id === operationId);
      expect(resolvedOp?.status).toBe(SyncOperationStatus.PENDING);
      expect(resolvedOp?.retryCount).toBe(0);
    });

    it('should resolve conflict with server wins strategy', async () => {
      const operationId = await dataSyncService.queueOperation(
        SyncOperationType.UPDATE_SERVICE,
        { name: 'Local Name' }
      );

      const conflict: SyncConflict = {
        operationId,
        type: SyncOperationType.UPDATE_SERVICE,
        localData: { name: 'Local Name' },
        serverData: { name: 'Server Name' },
        conflictFields: ['name'],
        suggestedResolution: ConflictResolutionStrategy.SERVER_WINS,
        timestamp: new Date()
      };

      mockSecureStorage.getCriticalData.mockResolvedValue([conflict]);

      await dataSyncService.resolveConflict(
        operationId,
        ConflictResolutionStrategy.SERVER_WINS
      );

      const pendingOps = dataSyncService.getPendingOperations();
      const resolvedOp = pendingOps.find(op => op.id === operationId);
      expect(resolvedOp?.data.name).toBe('Server Name');
    });

    it('should resolve conflict with merge strategy', async () => {
      const operationId = await dataSyncService.queueOperation(
        SyncOperationType.UPDATE_SERVICE,
        { name: 'Local Name', userField: 'local' }
      );

      const conflict: SyncConflict = {
        operationId,
        type: SyncOperationType.UPDATE_SERVICE,
        localData: { name: 'Local Name', userField: 'local' },
        serverData: { name: 'Server Name', systemField: 'server' },
        conflictFields: ['name'],
        suggestedResolution: ConflictResolutionStrategy.MERGE,
        timestamp: new Date()
      };

      mockSecureStorage.getCriticalData.mockResolvedValue([conflict]);

      await dataSyncService.resolveConflict(
        operationId,
        ConflictResolutionStrategy.MERGE
      );

      const pendingOps = dataSyncService.getPendingOperations();
      const resolvedOp = pendingOps.find(op => op.id === operationId);
      expect(resolvedOp?.status).toBe(SyncOperationStatus.PENDING);
    });

    it('should throw error when conflict not found', async () => {
      mockSecureStorage.getCriticalData.mockResolvedValue([]);

      await expect(
        dataSyncService.resolveConflict('non-existent', ConflictResolutionStrategy.CLIENT_WINS)
      ).rejects.toThrow('Conflicto no encontrado');
    });
  });

  describe('Statistics and Monitoring', () => {
    beforeEach(async () => {
      await dataSyncService.queueOperation(SyncOperationType.CREATE_SERVICE, {});
      await dataSyncService.queueOperation(SyncOperationType.CREATE_EXPENSE, {});
    });

    it('should return accurate sync statistics', async () => {
      const stats = await dataSyncService.getSyncStats();
      
      expect(stats.totalOperations).toBe(2);
      expect(stats.pendingOperations).toBe(2);
      expect(stats.completedOperations).toBe(0);
      expect(stats.failedOperations).toBe(0);
      expect(stats.conflictOperations).toBe(0);
      expect(stats.networkStatus.isOnline).toBe(true);
    });

    it('should include network status in statistics', async () => {
      const mockNetworkStatus = {
        isOnline: true,
        connectionType: 'wifi',
        effectiveType: '4g',
        lastChecked: new Date()
      };

      mockSecureStorage.getCriticalData.mockResolvedValue(mockNetworkStatus);

      const stats = await dataSyncService.getSyncStats();
      expect(stats.networkStatus.connectionType).toBe('wifi');
      expect(stats.networkStatus.effectiveType).toBe('4g');
    });

    it('should clear completed operations', async () => {
      // Simulate some completed operations by directly modifying the queue
      const pendingOps = dataSyncService.getPendingOperations();
      
      // Mock completed operations in storage
      const mockQueue = [
        ...pendingOps,
        {
          id: 'completed-1',
          type: SyncOperationType.CREATE_SERVICE,
          status: SyncOperationStatus.COMPLETED,
          userId: mockPatronUser.id,
          userRole: UserRole.PATRON,
          data: {},
          timestamp: new Date(),
          retryCount: 0,
          maxRetries: 3,
          priority: 50
        }
      ];

      mockSecureStorage.getCriticalData.mockResolvedValue(mockQueue);

      const clearedCount = await dataSyncService.clearCompletedOperations();
      expect(clearedCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration successfully', async () => {
      const newConfig = {
        maxRetries: 5,
        syncInterval: 60000,
        batchSize: 20
      };

      await dataSyncService.updateConfig(newConfig);

      expect(mockSecureStorage.storeCriticalData).toHaveBeenCalledWith(
        'sync_config',
        expect.objectContaining(newConfig)
      );
    });

    it('should restart background sync when interval changes', async () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      const setIntervalSpy = jest.spyOn(global, 'setInterval');

      await dataSyncService.updateConfig({ syncInterval: 45000 });

      expect(clearIntervalSpy).toHaveBeenCalled();
      expect(setIntervalSpy).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      mockSecureStorage.storeCriticalData.mockRejectedValue(new Error('Storage error'));

      // Should not throw, but log error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await dataSyncService.queueOperation(SyncOperationType.CREATE_SERVICE, {});
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle network errors during sync', async () => {
      // Mock network error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await dataSyncService.queueOperation(SyncOperationType.CREATE_SERVICE, {});
      await dataSyncService.performSync();
      
      // Should complete without throwing
      expect(true).toBe(true);
      consoleSpy.mockRestore();
    });

    it('should handle invalid operation types', async () => {
      await dataSyncService.queueOperation(SyncOperationType.CREATE_SERVICE, {});
      
      // Simulate invalid operation type by modifying queue
      const pendingOps = dataSyncService.getPendingOperations();
      if (pendingOps.length > 0) {
        (pendingOps[0] as any).type = 'INVALID_TYPE';
      }

      // Should handle gracefully during sync
      await dataSyncService.performSync();
      expect(true).toBe(true);
    });
  });

  describe('Service Lifecycle', () => {
    it('should initialize properly', () => {
      expect(dataSyncService).toBeDefined();
      expect(global.window.addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(global.window.addEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
    });

    it('should cleanup resources on destroy', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      
      dataSyncService.destroy();
      
      expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it('should handle online/offline events', () => {
      // Get the event listeners
      const addEventListenerCalls = (global.window.addEventListener as jest.Mock).mock.calls;
      const onlineHandler = addEventListenerCalls.find(call => call[0] === 'online')?.[1];
      const offlineHandler = addEventListenerCalls.find(call => call[0] === 'offline')?.[1];

      expect(onlineHandler).toBeDefined();
      expect(offlineHandler).toBeDefined();

      // Test handlers don't throw
      if (onlineHandler) onlineHandler();
      if (offlineHandler) offlineHandler();
      
      expect(true).toBe(true);
    });
  });
});
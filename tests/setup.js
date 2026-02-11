// Test setup configuration
import 'jest-environment-jsdom';
// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});
// Mock crypto for testing
Object.defineProperty(global, 'crypto', {
    value: {
        getRandomValues: jest.fn((arr) => {
            for (let i = 0; i < arr.length; i++) {
                arr[i] = Math.floor(Math.random() * 256);
            }
            return arr;
        }),
        subtle: {
            digest: jest.fn(async (algorithm, data) => {
                // Simple mock hash
                const view = new Uint8Array(data);
                let hash = 0;
                for (let i = 0; i < view.length; i++) {
                    hash = ((hash << 5) - hash + view[i]) & 0xffffffff;
                }
                const buffer = new ArrayBuffer(32);
                const hashView = new Uint8Array(buffer);
                for (let i = 0; i < 32; i++) {
                    hashView[i] = (hash >> (i % 4 * 8)) & 0xff;
                }
                return buffer;
            })
        }
    }
});
// Mock btoa and atob for Node.js environment
if (typeof btoa === 'undefined') {
    global.btoa = (str) => Buffer.from(str, 'binary').toString('base64');
}
if (typeof atob === 'undefined') {
    global.atob = (str) => Buffer.from(str, 'base64').toString('binary');
}
// Reset mocks before each test
beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
});
// Custom matchers
expect.extend({
    toBeValidJWT(received) {
        const parts = received.split('.');
        const isValid = parts.length === 3 &&
            parts.every(part => part.length > 0);
        return {
            message: () => `expected ${received} to be a valid JWT token`,
            pass: isValid,
        };
    },
    toHaveValidUserStructure(received) {
        const requiredFields = ['id', 'email', 'nombre', 'rol', 'activo', 'permissions'];
        const hasAllFields = requiredFields.every(field => received.hasOwnProperty(field));
        return {
            message: () => `expected user object to have all required fields: ${requiredFields.join(', ')}`,
            pass: hasAllFields,
        };
    }
});
//# sourceMappingURL=setup.js.map
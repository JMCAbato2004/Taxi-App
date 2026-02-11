import 'jest-environment-jsdom';
declare global {
    namespace jest {
        interface Matchers<R> {
            toBeValidJWT(): R;
            toHaveValidUserStructure(): R;
        }
    }
}
//# sourceMappingURL=setup.d.ts.map
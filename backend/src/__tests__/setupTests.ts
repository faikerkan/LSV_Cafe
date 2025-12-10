import { PrismaClient } from '@prisma/client';

// Mock Prisma Client for testing
jest.mock('../lib/prisma', () => ({
    __esModule: true,
    default: {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
        event: {
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
    },
}));

// Setup and teardown
beforeAll(() => {
    // Set test environment variables
    process.env.JWT_SECRET = 'test_jwt_secret';
    process.env.NODE_ENV = 'test';
});

afterEach(() => {
    // Clear all mocks after each test
    jest.clearAllMocks();
});

afterAll(() => {
    // Cleanup
    jest.restoreAllMocks();
});

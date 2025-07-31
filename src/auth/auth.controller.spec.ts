import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Decimal } from '@prisma/client/runtime/library';

describe('AuthController - Endpoint Functionality', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    getProfile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register - Register Endpoint', () => {
    it('should successfully register a new user', async () => {
      // Arrange
      const registerDto = {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'password123',
      };

      const expectedResponse = {
        access_token: 'jwt-token',
        user: {
          id: '1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
        },
      };

      authService.register.mockResolvedValue(expectedResponse);

      // Act
      const result = await controller.register(registerDto);

      // Assert
      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('POST /auth/login - Login Endpoint', () => {
    it('should successfully login with valid credentials', async () => {
      // Arrange
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const expectedResponse = {
        access_token: 'jwt-token',
        user: {
          id: '1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
        },
      };

      authService.login.mockResolvedValue(expectedResponse);

      // Act
      const result = await controller.login(loginDto);

      // Assert
      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('GET /auth/profile - Profile Endpoint', () => {
    it('should return user profile when authenticated', async () => {
      // Arrange
      const mockRequest = {
        user: { id: '1', email: 'test@example.com' }
      };

      const expectedProfile = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        accounts: [
          {
            id: 'account1',
            accountNumber: 'ACC-001',
            accountType: 'CHECKING',
            balance: new Decimal(1000.00), // ← Fixed: Use Decimal constructor
            isActive: true,
          }
        ]
      };

      authService.getProfile.mockResolvedValue(expectedProfile);

      // Act
      const result = await controller.getProfile(mockRequest);

      // Assert
      expect(authService.getProfile).toHaveBeenCalledWith('1');
      expect(result).toEqual(expectedProfile);
    });
  });
});
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');
const mockedBcrypt = jest.mocked(bcrypt);

// Create a proper mock type for PrismaService
type MockPrismaService = {
  user: {
    findUnique: jest.Mock;
    create: jest.Mock;
  };
};

describe('AuthService - Error Handling (Fixed)', () => {
  let service: AuthService;
  let prismaService: MockPrismaService;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const mockPrismaService: MockPrismaService = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    const mockJwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService) as MockPrismaService;
    jwtService = module.get(JwtService) as jest.Mocked<JwtService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('409 Conflict Errors', () => {
    it('should throw ConflictException when registering with existing email', async () => {
      // Arrange
      const registerDto = {
        email: 'existing@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'password123',
      };

      const existingUser = {
        id: '1',
        email: 'existing@example.com',
        firstName: 'Existing',
        lastName: 'User',
        password: 'hashedPassword',
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.user.findUnique.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(
        new ConflictException('User with this email already exists')
      );

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });
  });

  describe('401 Unauthorized Errors', () => {
    it('should throw UnauthorizedException when login with non-existent user', async () => {
      // Arrange
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      prismaService.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid email or password')
      );

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
    });

    it('should throw UnauthorizedException when login with wrong password', async () => {
      // Arrange
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'correctHashedPassword',
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never); // Cast to never to satisfy TS

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid email or password')
      );

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password
      );
      expect(jwtService.sign).not.toHaveBeenCalled();
    });
  });

  describe('Database Connection Errors', () => {
    it('should handle database connection errors during registration', async () => {
      // Arrange
      const registerDto = {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'password123',
      };

      prismaService.user.findUnique.mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should handle database errors during login', async () => {
      // Arrange
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      prismaService.user.findUnique.mockRejectedValue(
        new Error('Database timeout')
      );

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow('Database timeout');
    });
  });

  describe('Successful Operations', () => {
    it('should successfully register when user does not exist', async () => {
      // Arrange
      const registerDto = {
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
        password: 'password123',
      };

      const createdUser = {
        id: '2',
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
      };

      prismaService.user.findUnique.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue('hashedPassword' as never);
      prismaService.user.create.mockResolvedValue(createdUser);
      jwtService.sign.mockReturnValue('jwt-token');

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(result).toEqual({
        access_token: 'jwt-token',
        user: createdUser,
      });
    });

    it('should successfully login with valid credentials', async () => {
      // Arrange
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'hashedPassword',
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      jwtService.sign.mockReturnValue('jwt-token');

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(result).toEqual({
        access_token: 'jwt-token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
        },
      });
    });
  });
});
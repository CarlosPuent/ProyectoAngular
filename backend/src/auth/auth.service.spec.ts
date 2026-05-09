import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

const userRole  = { id: 'role-2', name: 'USER', description: '', users: [], createdAt: new Date(), updatedAt: new Date() };
const adminRole = { id: 'role-1', name: 'ADMIN', description: '', users: [], createdAt: new Date(), updatedAt: new Date() };

const mockUser: User = {
  id: 'user-uuid-1', email: 'alice@example.com', passwordHash: '$2a$12$hashedpassword',
  firstName: 'Alice', lastName: 'Smith', isActive: true, roles: [userRole],
  createdAt: new Date(), updatedAt: new Date(),
};

const inactiveUser: User = { ...mockUser, isActive: false };

// bcryptjs has overloaded signatures which confuse jest.spyOn's type inference.
function mockBcryptCompare(result: boolean): void {
  (jest.spyOn(bcrypt, 'compare') as unknown as jest.Mock).mockResolvedValue(result);
}

describe('AuthService', () => {
  let service: AuthService;

  const mockUsersService = { findByEmail: jest.fn(), create: jest.fn() };
  const mockJwtService   = { sign: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockJwtService.sign.mockReturnValue('mock-jwt-token');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService,   useValue: mockJwtService },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => { expect(service).toBeDefined(); });

  describe('login()', () => {
    const loginDto = { email: 'alice@example.com', password: 'secret123' };

    it('should return a valid AuthResponse on successful login', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockBcryptCompare(true);
      const result = await service.login(loginDto);
      expect(result.access_token).toBe('mock-jwt-token');
      expect(result.token_type).toBe('Bearer');
      expect(result.expires_in).toBe(3600);
    });

    it('should include user data in the response', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockBcryptCompare(true);
      const result = await service.login(loginDto);
      expect(result.user.email).toBe('alice@example.com');
      expect(result.user.roles).toEqual(['USER']);
      expect((result.user as any).passwordHash).toBeUndefined();
    });

    it('should sign JWT with correct payload', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockBcryptCompare(true);
      await service.login(loginDto);
      expect(mockJwtService.sign).toHaveBeenCalledWith({ sub: mockUser.id, email: mockUser.email, roles: ['USER'] });
    });

    it('should call bcrypt.compare with the raw password and the stored hash', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      const compareSpy = jest.spyOn(bcrypt, 'compare') as unknown as jest.Mock;
      compareSpy.mockResolvedValue(true);
      await service.login(loginDto);
      expect(compareSpy).toHaveBeenCalledWith('secret123', mockUser.passwordHash);
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockBcryptCompare(false);
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when account is disabled', async () => {
      mockUsersService.findByEmail.mockResolvedValue(inactiveUser);
      mockBcryptCompare(true);
      await expect(service.login(loginDto)).rejects.toThrow('Account is disabled');
    });

    it('should handle a user with null roles gracefully', async () => {
      const userNullRoles: User = { ...mockUser, roles: null as any };
      mockUsersService.findByEmail.mockResolvedValue(userNullRoles);
      mockBcryptCompare(true);
      const result = await service.login(loginDto);
      expect(result.user.roles).toEqual([]);
    });
  });

  describe('register()', () => {
    const registerDto = { email: 'bob@example.com', password: 'password123', firstName: 'Bob', lastName: 'Jones' };

    it('should return a valid AuthResponse after successful registration', async () => {
      const newUser: User = { ...mockUser, id: 'user-uuid-3', email: registerDto.email, roles: [userRole] };
      mockUsersService.create.mockResolvedValue(newUser);
      const result = await service.register(registerDto);
      expect(result.access_token).toBe('mock-jwt-token');
    });

    it('should delegate user creation to usersService.create()', async () => {
      mockUsersService.create.mockResolvedValue({ ...mockUser, email: registerDto.email });
      await service.register(registerDto);
      expect(mockUsersService.create).toHaveBeenCalledWith(registerDto);
    });

    it('should propagate errors thrown by usersService.create()', async () => {
      mockUsersService.create.mockRejectedValue(
        new (require('@nestjs/common').ConflictException)('Email already registered'),
      );
      await expect(service.register(registerDto)).rejects.toThrow('Email already registered');
    });
  });
});

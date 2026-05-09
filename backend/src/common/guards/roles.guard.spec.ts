import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';

function makeContext(user: any): ExecutionContext {
  return {
    getHandler: jest.fn().mockReturnValue(() => {}),
    getClass:   jest.fn().mockReturnValue(class {}),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({ user }),
    }),
  } as unknown as ExecutionContext;
}

const adminRoleObj = { id: '1', name: 'ADMIN' };
const userRoleObj  = { id: '2', name: 'USER'  };
const adminUser    = { id: 'u1', roles: [adminRoleObj] };
const regularUser  = { id: 'u2', roles: [userRoleObj] };
const noRolesUser  = { id: 'u3', roles: [] };

describe('RolesGuard', () => {
  let guard: RolesGuard;
  const mockReflector = { getAllAndOverride: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [RolesGuard, { provide: Reflector, useValue: mockReflector }],
    }).compile();
    guard = module.get<RolesGuard>(RolesGuard);
  });

  it('should be defined', () => { expect(guard).toBeDefined(); });

  describe('when no roles metadata is set', () => {
    it('should return true — route is publicly accessible', () => {
      mockReflector.getAllAndOverride.mockReturnValue(undefined);
      expect(guard.canActivate(makeContext(regularUser))).toBe(true);
    });

    it('should query the Reflector with the ROLES_KEY', () => {
      mockReflector.getAllAndOverride.mockReturnValue(undefined);
      const ctx = makeContext(regularUser);
      guard.canActivate(ctx);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [ctx.getHandler(), ctx.getClass()]);
    });
  });

  describe('when a single role is required', () => {
    it('should return true when user has the required role', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['ADMIN']);
      expect(guard.canActivate(makeContext(adminUser))).toBe(true);
    });

    it('should return false when user does not have the required role', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['ADMIN']);
      expect(guard.canActivate(makeContext(regularUser))).toBe(false);
    });

    it('should return false when user has no roles', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['ADMIN']);
      expect(guard.canActivate(makeContext(noRolesUser))).toBe(false);
    });

    it('should return false when user is undefined in the request', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['ADMIN']);
      expect(guard.canActivate(makeContext(undefined))).toBe(false);
    });
  });

  describe('when multiple roles are required (OR logic)', () => {
    it('should return true when user has at least one of the required roles', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['ADMIN', 'MODERATOR']);
      expect(guard.canActivate(makeContext(adminUser))).toBe(true);
    });

    it('should return false when user has none of the required roles', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['ADMIN', 'MODERATOR']);
      expect(guard.canActivate(makeContext(regularUser))).toBe(false);
    });
  });

  describe('when user has multiple roles', () => {
    it('should return true when any of the user roles matches', () => {
      const multiRoleUser = { id: 'u5', roles: [adminRoleObj, userRoleObj] };
      mockReflector.getAllAndOverride.mockReturnValue(['USER']);
      expect(guard.canActivate(makeContext(multiRoleUser))).toBe(true);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/entities/role.entity';

const JWT_SECRET = 'integration-test-secret';
const ADMIN_ROLE: Role = { id: 'role-admin', name: 'ADMIN', description: '', users: [], createdAt: new Date(), updatedAt: new Date() };
const USER_ROLE: Role  = { id: 'role-user',  name: 'USER',  description: '', users: [], createdAt: new Date(), updatedAt: new Date() };

const usersStore: User[] = [];
let idCounter = 0;

const mockUserRepo = {
  findOne: jest.fn(),
  count:   jest.fn(),
  create:  jest.fn(),
  save:    jest.fn(),
  find:    jest.fn(),
};

const mockRoleRepo = { findOne: jest.fn() };

function configureMocks() {
  mockUserRepo.findOne.mockImplementation(async (opts: any) => {
    const { where } = opts;
    if (where.email) return usersStore.find((u) => u.email === where.email) ?? null;
    if (where.id)    return usersStore.find((u) => u.id    === where.id)    ?? null;
    return null;
  });
  mockUserRepo.count.mockImplementation(async () => usersStore.length);
  mockUserRepo.create.mockImplementation((data: any) => ({ id: `user-${++idCounter}`, isActive: true, ...data }));
  mockUserRepo.save.mockImplementation(async (user: any) => {
    const idx = usersStore.findIndex((u) => u.id === user.id || u.email === user.email);
    if (idx >= 0) usersStore[idx] = user; else usersStore.push(user);
    return user;
  });
  mockRoleRepo.findOne.mockImplementation(async (opts: any) => {
    if (opts.where.name === 'ADMIN') return ADMIN_ROLE;
    if (opts.where.name === 'USER')  return USER_ROLE;
    return null;
  });
}

describe('Auth Integration — /api/auth', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.JWT_SECRET = JWT_SECRET;
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
          imports: [ConfigModule], inject: [ConfigService],
          useFactory: (cfg: ConfigService) => ({ secret: cfg.get<string>('JWT_SECRET'), signOptions: { expiresIn: 3600 } }),
        }),
      ],
      controllers: [AuthController],
      providers: [
        AuthService, UsersService, JwtStrategy,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(Role), useValue: mockRoleRepo },
      ],
    }).compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterAll(async () => { await app.close(); });

  beforeEach(() => {
    usersStore.splice(0, usersStore.length);
    idCounter = 0;
    jest.clearAllMocks();
    configureMocks();
  });

  describe('POST /api/auth/register', () => {
    const validPayload = { email: 'alice@example.com', password: 'securePass1', firstName: 'Alice', lastName: 'Test' };

    it('should return 201 with JWT token and user data on success', async () => {
      const res = await request(app.getHttpServer()).post('/api/auth/register').send(validPayload);
      expect(res.status).toBe(201);
      expect(res.body.access_token).toBeDefined();
      expect(res.body.token_type).toBe('Bearer');
      expect(res.body.expires_in).toBe(3600);
    });

    it('should include user data in the response body', async () => {
      const res = await request(app.getHttpServer()).post('/api/auth/register').send(validPayload);
      expect(res.body.user.email).toBe('alice@example.com');
      expect(res.body.user.passwordHash).toBeUndefined();
    });

    it('should return 400 when password is missing', async () => {
      const res = await request(app.getHttpServer()).post('/api/auth/register').send({ email: 'user@test.com' });
      expect(res.status).toBe(400);
    });

    it('should return 400 when email is invalid', async () => {
      const res = await request(app.getHttpServer()).post('/api/auth/register').send({ email: 'not-an-email', password: 'pass123' });
      expect(res.status).toBe(400);
    });

    it('should return 400 when unknown fields are sent', async () => {
      const res = await request(app.getHttpServer()).post('/api/auth/register').send({ ...validPayload, unknownField: 'hacked' });
      expect(res.status).toBe(400);
    });

    it('should return 409 when email is already registered', async () => {
      await request(app.getHttpServer()).post('/api/auth/register').send(validPayload);
      const res = await request(app.getHttpServer()).post('/api/auth/register').send(validPayload);
      expect(res.status).toBe(409);
    });
  });

  describe('POST /api/auth/login', () => {
    const credentials = { email: 'bob@example.com', password: 'bobPass99' };

    async function registerUser(payload = credentials) {
      return request(app.getHttpServer()).post('/api/auth/register').send({ ...payload, firstName: 'Bob', lastName: 'Test' });
    }

    it('should return 200 with JWT token on valid credentials', async () => {
      await registerUser();
      const res = await request(app.getHttpServer()).post('/api/auth/login').send(credentials);
      expect(res.status).toBe(200);
      expect(res.body.access_token).toBeDefined();
    });

    it('should include user data in the login response', async () => {
      await registerUser();
      const res = await request(app.getHttpServer()).post('/api/auth/login').send(credentials);
      expect(res.body.user.email).toBe('bob@example.com');
    });

    it('should return 401 when the user email does not exist', async () => {
      const res = await request(app.getHttpServer()).post('/api/auth/login').send({ email: 'nobody@test.com', password: 'anything' });
      expect(res.status).toBe(401);
    });

    it('should return 401 when the password is wrong', async () => {
      await registerUser();
      const res = await request(app.getHttpServer()).post('/api/auth/login').send({ email: credentials.email, password: 'WRONG-PASSWORD' });
      expect(res.status).toBe(401);
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(app.getHttpServer()).post('/api/auth/login').send({ email: 'user@test.com' });
      expect(res.status).toBe(400);
    });

    it('should return 401 when account is disabled', async () => {
      await registerUser();
      const user = usersStore[0];
      user.isActive = false;
      const res = await request(app.getHttpServer()).post('/api/auth/login').send(credentials);
      expect(res.status).toBe(401);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/entities/role.entity';

const JWT_SECRET = 'categories-integration-test-secret';

const TEST_USER: User = {
  id: 'fixed-user-id', email: 'admin@test.com', passwordHash: '$2a$12$fake',
  firstName: 'Admin', lastName: 'Test', isActive: true,
  roles: [{ id: 'r1', name: 'ADMIN', description: '', users: [], createdAt: new Date(), updatedAt: new Date() }],
  createdAt: new Date(), updatedAt: new Date(),
};

const usersStore: User[] = [TEST_USER];
const categoriesStore: Category[] = [];
let catIdCounter = 0;

const mockUserRepo = { findOne: jest.fn(), count: jest.fn(), create: jest.fn(), save: jest.fn(), find: jest.fn() };
const mockRoleRepo = { findOne: jest.fn() };
const mockCategoryRepo = { find: jest.fn(), findOne: jest.fn(), create: jest.fn(), save: jest.fn(), update: jest.fn(), delete: jest.fn() };

function configureMocks() {
  mockUserRepo.findOne.mockImplementation(async (opts: any) => {
    const { where } = opts;
    if (where.email) return usersStore.find((u) => u.email === where.email) ?? null;
    if (where.id)    return usersStore.find((u) => u.id    === where.id)    ?? null;
    return null;
  });
  mockUserRepo.count.mockImplementation(async () => usersStore.length);
  mockRoleRepo.findOne.mockReturnValue(Promise.resolve(null));

  mockCategoryRepo.find.mockImplementation(async (opts?: any) => {
    if (opts?.where?.name?._value) {
      const term: string = opts.where.name._value.replace(/%/g, '').toLowerCase();
      return categoriesStore.filter((c) => c.name.toLowerCase().includes(term));
    }
    return [...categoriesStore];
  });

  mockCategoryRepo.findOne.mockImplementation(async (opts: any) => {
    const { where } = opts;
    if (where.id)   return categoriesStore.find((c) => c.id   === where.id)   ?? null;
    if (where.slug) return categoriesStore.find((c) => c.slug === where.slug) ?? null;
    if (where.name?._value) {
      const term = where.name._value.toLowerCase();
      return categoriesStore.find((c) => c.name.toLowerCase() === term) ?? null;
    }
    return null;
  });

  mockCategoryRepo.create.mockImplementation((data: any) => ({ id: `cat-${++catIdCounter}`, createdAt: new Date(), updatedAt: new Date(), products: [], ...data }));
  mockCategoryRepo.save.mockImplementation(async (cat: Category) => {
    const idx = categoriesStore.findIndex((c) => c.id === cat.id);
    if (idx >= 0) categoriesStore[idx] = cat; else categoriesStore.push(cat);
    return cat;
  });
  mockCategoryRepo.update.mockImplementation(async (id: string, data: any) => {
    const idx = categoriesStore.findIndex((c) => c.id === id);
    if (idx >= 0) categoriesStore[idx] = { ...categoriesStore[idx], ...data };
    return { affected: idx >= 0 ? 1 : 0 };
  });
  mockCategoryRepo.delete.mockImplementation(async (id: string) => {
    const idx = categoriesStore.findIndex((c) => c.id === id);
    if (idx >= 0) categoriesStore.splice(idx, 1);
    return { affected: 1 };
  });
}

describe('Categories Integration — /api/categories', () => {
  let app: INestApplication;
  let validToken: string;

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
      controllers: [CategoriesController],
      providers: [
        CategoriesService, UsersService, JwtStrategy,
        { provide: getRepositoryToken(User),     useValue: mockUserRepo     },
        { provide: getRepositoryToken(Role),     useValue: mockRoleRepo     },
        { provide: getRepositoryToken(Category), useValue: mockCategoryRepo },
      ],
    }).compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();

    const jwtService = module.get<JwtService>(JwtService);
    validToken = jwtService.sign({ sub: TEST_USER.id, email: TEST_USER.email, roles: ['ADMIN'] });
  });

  afterAll(async () => { await app.close(); });

  beforeEach(() => {
    categoriesStore.splice(0, categoriesStore.length);
    catIdCounter = 0;
    jest.clearAllMocks();
    configureMocks();
  });

  describe('GET /api/categories', () => {
    it('should return 200 with an empty array when no categories exist', async () => {
      const res = await request(app.getHttpServer()).get('/api/categories');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should return 200 with all categories', async () => {
      categoriesStore.push({ id: 'cat-seed', name: 'Electronics', slug: 'electronics', description: 'Devices', products: [], createdAt: new Date(), updatedAt: new Date() });
      const res = await request(app.getHttpServer()).get('/api/categories');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it('should be accessible without authentication', async () => {
      const res = await request(app.getHttpServer()).get('/api/categories');
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/categories/:id', () => {
    it('should return 404 when the category does not exist', async () => {
      const res = await request(app.getHttpServer()).get('/api/categories/non-existent-id');
      expect(res.status).toBe(404);
    });

    it('should return 200 and the category when found', async () => {
      const cat: Category = { id: 'cat-found', name: 'Books', slug: 'books', description: '', products: [], createdAt: new Date(), updatedAt: new Date() };
      categoriesStore.push(cat);
      const res = await request(app.getHttpServer()).get('/api/categories/cat-found');
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Books');
    });
  });

  describe('POST /api/categories', () => {
    const validDto = { name: 'New Category', slug: 'new-category', description: 'Test' };

    it('should return 401 when Authorization header is missing', async () => {
      const res = await request(app.getHttpServer()).post('/api/categories').send(validDto);
      expect(res.status).toBe(401);
    });

    it('should return 201 and the created category with a valid JWT', async () => {
      const res = await request(app.getHttpServer()).post('/api/categories').set('Authorization', `Bearer ${validToken}`).send(validDto);
      expect(res.status).toBe(201);
      expect(res.body.name).toBe('New Category');
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(app.getHttpServer()).post('/api/categories').set('Authorization', `Bearer ${validToken}`).send({ name: 'No Slug' });
      expect(res.status).toBe(400);
    });

    it('should return 409 when slug already exists', async () => {
      categoriesStore.push({ id: 'existing', name: 'Existing', slug: 'new-category', description: '', products: [], createdAt: new Date(), updatedAt: new Date() });
      const res = await request(app.getHttpServer()).post('/api/categories').set('Authorization', `Bearer ${validToken}`).send(validDto);
      expect(res.status).toBe(409);
    });
  });

  describe('PATCH /api/categories/:id', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app.getHttpServer()).patch('/api/categories/any-id').send({ description: 'Updated' });
      expect(res.status).toBe(401);
    });

    it('should return 404 when the category does not exist', async () => {
      const res = await request(app.getHttpServer()).patch('/api/categories/non-existent').set('Authorization', `Bearer ${validToken}`).send({ description: 'Updated' });
      expect(res.status).toBe(404);
    });

    it('should return 200 and the updated category', async () => {
      const existing: Category = { id: 'cat-to-update', name: 'Old Name', slug: 'old-slug', description: 'Old', products: [], createdAt: new Date(), updatedAt: new Date() };
      categoriesStore.push(existing);
      const res = await request(app.getHttpServer()).patch('/api/categories/cat-to-update').set('Authorization', `Bearer ${validToken}`).send({ description: 'New description' });
      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /api/categories/:id', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app.getHttpServer()).delete('/api/categories/any-id');
      expect(res.status).toBe(401);
    });

    it('should return 404 when the category does not exist', async () => {
      const res = await request(app.getHttpServer()).delete('/api/categories/non-existent').set('Authorization', `Bearer ${validToken}`);
      expect(res.status).toBe(404);
    });

    it('should return 200 and a success message', async () => {
      categoriesStore.push({ id: 'cat-del', name: 'To Delete', slug: 'to-delete', description: '', products: [], createdAt: new Date(), updatedAt: new Date() });
      const res = await request(app.getHttpServer()).delete('/api/categories/cat-del').set('Authorization', `Bearer ${validToken}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toContain('deleted');
    });
  });
});

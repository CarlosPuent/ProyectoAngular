import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ILike } from 'typeorm';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';

const mockCategory: Category = {
  id: 'cat-uuid-1', name: 'Electronics', slug: 'electronics',
  description: 'Electronic devices', products: [],
  createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01'),
};

const createDto = { name: 'Books', slug: 'books', description: 'Literature' };

describe('CategoriesService', () => {
  let service: CategoriesService;

  const mockRepo = {
    find: jest.fn(), findOne: jest.fn(), create: jest.fn(),
    save: jest.fn(), update: jest.fn(), delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: getRepositoryToken(Category), useValue: mockRepo },
      ],
    }).compile();
    service = module.get<CategoriesService>(CategoriesService);
  });

  it('should be defined', () => { expect(service).toBeDefined(); });

  describe('findAll()', () => {
    it('should return all categories when no filter is given', async () => {
      mockRepo.find.mockResolvedValue([mockCategory]);
      const result = await service.findAll();
      expect(mockRepo.find).toHaveBeenCalledWith({ order: { name: 'ASC' } });
      expect(result).toEqual([mockCategory]);
    });

    it('should filter by name using ILike when search is provided', async () => {
      mockRepo.find.mockResolvedValue([mockCategory]);
      await service.findAll({ search: 'elec' });
      expect(mockRepo.find).toHaveBeenCalledWith({ where: { name: ILike('%elec%') }, order: { name: 'ASC' } });
    });

    it('should ignore a whitespace-only search term', async () => {
      mockRepo.find.mockResolvedValue([mockCategory]);
      await service.findAll({ search: '   ' });
      expect(mockRepo.find).toHaveBeenCalledWith({ order: { name: 'ASC' } });
    });
  });

  describe('findOne()', () => {
    it('should return the category when found', async () => {
      mockRepo.findOne.mockResolvedValue(mockCategory);
      const result = await service.findOne('cat-uuid-1');
      expect(result).toEqual(mockCategory);
    });

    it('should throw NotFoundException when category does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when id is empty', async () => {
      await expect(service.findOne('')).rejects.toThrow(BadRequestException);
    });
  });

  describe('findBySlug()', () => {
    it('should return the category when slug is found', async () => {
      mockRepo.findOne.mockResolvedValue(mockCategory);
      const result = await service.findBySlug('electronics');
      expect(result).toEqual(mockCategory);
    });

    it('should throw NotFoundException when slug does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.findBySlug('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create()', () => {
    it('should create and return the new category', async () => {
      const newCat = { ...mockCategory, name: 'Books', slug: 'books' };
      mockRepo.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      mockRepo.create.mockReturnValue(newCat);
      mockRepo.save.mockResolvedValue(newCat);
      const result = await service.create(createDto);
      expect(mockRepo.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(newCat);
    });

    it('should throw ConflictException when slug already exists', async () => {
      mockRepo.findOne.mockResolvedValueOnce(mockCategory);
      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when name already exists', async () => {
      mockRepo.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(mockCategory);
      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('update()', () => {
    it('should update and return the category when only description changes', async () => {
      const updated = { ...mockCategory, description: 'Updated' };
      mockRepo.findOne.mockResolvedValueOnce(mockCategory).mockResolvedValueOnce(updated);
      mockRepo.update.mockResolvedValue({ affected: 1 });
      const result = await service.update('cat-uuid-1', { description: 'Updated' });
      expect(mockRepo.update).toHaveBeenCalledWith('cat-uuid-1', { description: 'Updated' });
      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException when category does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.update('non-existent', { name: 'New' })).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when new slug already belongs to another category', async () => {
      mockRepo.findOne.mockResolvedValueOnce(mockCategory).mockResolvedValueOnce(mockCategory);
      await expect(service.update('cat-uuid-1', { slug: 'new-slug' })).rejects.toThrow(ConflictException);
    });
  });

  describe('remove()', () => {
    it('should delete the category and return a success message', async () => {
      mockRepo.findOne.mockResolvedValue(mockCategory);
      mockRepo.delete.mockResolvedValue({ affected: 1 });
      const result = await service.remove('cat-uuid-1');
      expect(mockRepo.delete).toHaveBeenCalledWith('cat-uuid-1');
      expect(result).toEqual({ message: 'Category "Electronics" deleted successfully' });
    });

    it('should throw NotFoundException when category does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});

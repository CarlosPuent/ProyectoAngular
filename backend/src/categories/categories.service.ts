import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';

export interface CategoriesFilter {
  search?: string;
}

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category) private repo: Repository<Category>,
  ) {}

  async findAll(filter: CategoriesFilter = {}): Promise<Category[]> {
    if (filter.search?.trim()) {
      return this.repo.find({
        where: { name: ILike(`%${filter.search.trim()}%`) },
        order: { name: 'ASC' },
      });
    }
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Category> {
    if (!id) throw new BadRequestException('Category ID is required');
    const category = await this.repo.findOne({ where: { id } });
    if (!category) throw new NotFoundException(`Category with ID ${id} not found`);
    return category;
  }

  async findBySlug(slug: string): Promise<Category> {
    const category = await this.repo.findOne({ where: { slug } });
    if (!category) throw new NotFoundException(`Category with slug "${slug}" not found`);
    return category;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const slugExists = await this.repo.findOne({ where: { slug: dto.slug } });
    if (slugExists) throw new ConflictException(`Slug "${dto.slug}" already exists`);

    const nameExists = await this.repo.findOne({ where: { name: ILike(dto.name) } });
    if (nameExists) throw new ConflictException(`Category "${dto.name}" already exists`);

    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: Partial<CreateCategoryDto>): Promise<Category> {
    const category = await this.findOne(id);

    // Verificar slug duplicado si se está cambiando
    if (dto.slug && dto.slug !== category.slug) {
      const slugExists = await this.repo.findOne({ where: { slug: dto.slug } });
      if (slugExists) throw new ConflictException(`Slug "${dto.slug}" already exists`);
    }

    // Verificar nombre duplicado si se está cambiando
    if (dto.name && dto.name.toLowerCase() !== category.name.toLowerCase()) {
      const nameExists = await this.repo.findOne({ where: { name: ILike(dto.name) } });
      if (nameExists) throw new ConflictException(`Category "${dto.name}" already exists`);
    }

    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    const category = await this.findOne(id);
    await this.repo.delete(id);
    return { message: `Category "${category.name}" deleted successfully` };
  }
}
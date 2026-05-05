import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Category } from '../categories/entities/category.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';

export interface ProductsFilter {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface PaginatedProducts {
  data: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private productsRepo: Repository<Product>,
    @InjectRepository(Category) private categoriesRepo: Repository<Category>,
  ) {}

  async findAll(filter: ProductsFilter): Promise<PaginatedProducts> {
    const page = Math.max(1, filter.page ?? 1);
    const limit = Math.min(100, Math.max(1, filter.limit ?? 10));
    const skip = (page - 1) * limit;

    // Validar rango de precios
    if (filter.minPrice !== undefined && filter.maxPrice !== undefined) {
      if (filter.minPrice > filter.maxPrice) {
        throw new BadRequestException('minPrice cannot be greater than maxPrice');
      }
    }

    const query = this.productsRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.categories', 'category')
      .where('product.isActive = :isActive', { isActive: true });

    // Búsqueda por nombre o descripción
    if (filter.search?.trim()) {
      query.andWhere(
        '(LOWER(product.name) LIKE LOWER(:search) OR LOWER(product.description) LIKE LOWER(:search))',
        { search: `%${filter.search.trim()}%` },
      );
    }

    // Filtro por categoría
    if (filter.categoryId) {
      query.andWhere('category.id = :categoryId', { categoryId: filter.categoryId });
    }

    // Filtro por precio mínimo
    if (filter.minPrice !== undefined) {
      query.andWhere('product.price >= :minPrice', { minPrice: filter.minPrice });
    }

    // Filtro por precio máximo
    if (filter.maxPrice !== undefined) {
      query.andWhere('product.price <= :maxPrice', { maxPrice: filter.maxPrice });
    }

    const [data, total] = await query
      .orderBy('product.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  async findOne(id: string): Promise<Product> {
    if (!id) throw new BadRequestException('Product ID is required');
    const product = await this.productsRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException(`Product with ID ${id} not found`);
    return product;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    // Validar que las categorías existan
    const categories = dto.categoryIds?.length
      ? await this.categoriesRepo.findBy({ id: In(dto.categoryIds) })
      : [];

    if (dto.categoryIds?.length && categories.length !== dto.categoryIds.length) {
      throw new BadRequestException('One or more category IDs are invalid');
    }

    const product = this.productsRepo.create({
      name: dto.name,
      description: dto.description,
      price: dto.price,
      stock: dto.stock,
      categories,
    });

    return this.productsRepo.save(product);
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);

    if (dto.categoryIds !== undefined) {
      const categories = dto.categoryIds.length
        ? await this.categoriesRepo.findBy({ id: In(dto.categoryIds) })
        : [];

      if (dto.categoryIds.length && categories.length !== dto.categoryIds.length) {
        throw new BadRequestException('One or more category IDs are invalid');
      }

      product.categories = categories;
    }

    if (dto.name !== undefined) product.name = dto.name;
    if (dto.description !== undefined) product.description = dto.description;
    if (dto.price !== undefined) product.price = dto.price;
    if (dto.stock !== undefined) product.stock = dto.stock;

    return this.productsRepo.save(product);
  }

  async remove(id: string): Promise<{ message: string }> {
    const product = await this.findOne(id);
    product.isActive = false;
    await this.productsRepo.save(product);
    return { message: `Product "${product.name}" has been deactivated` };
  }
}
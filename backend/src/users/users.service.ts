import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(Role) private rolesRepo: Repository<Role>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    // 1. Verificar email duplicado
    const exists = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email already registered');

    // 2. Hash de la contraseña
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // 3. El primer usuario registrado recibe ADMIN, los demás USER
    const userCount = await this.usersRepo.count();
    const roleName = userCount === 0 ? 'ADMIN' : 'USER';
    const role = await this.rolesRepo.findOne({ where: { name: roleName } });

    // 4. Crear y persistir el usuario
    const user = this.usersRepo.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      roles: role ? [role] : [],
    });

    return this.usersRepo.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findAll(): Promise<User[]> {
    return this.usersRepo.find();
  }

  async assignRole(userId: string, roleName: string): Promise<User> {
    const user = await this.findById(userId);
    const role = await this.rolesRepo.findOne({ where: { name: roleName } });
    if (!role) throw new NotFoundException(`Role ${roleName} not found`);

    const alreadyHasRole = user.roles.some((r) => r.name === roleName);
    if (alreadyHasRole) throw new ConflictException(`User already has role ${roleName}`);

    user.roles = [...user.roles, role];
    return this.usersRepo.save(user);
  }

  async updateProfile(id: string, dto: UpdateProfileDto): Promise<User> {
  const user = await this.findById(id);

  if (dto.password) {
    user.passwordHash = await bcrypt.hash(dto.password, 12);
  }

  if (dto.firstName) user.firstName = dto.firstName;
  if (dto.lastName) user.lastName = dto.lastName;

  return this.usersRepo.save(user);
}

  async removeRole(userId: string, roleName: string): Promise<User> {
    const user = await this.findById(userId);
    user.roles = user.roles.filter((r) => r.name !== roleName);
    return this.usersRepo.save(user);
  }
}
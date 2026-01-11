import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepo.find();
  }

  async findOne(id: number): Promise<User | null> {
    return this.userRepo.findOneBy({ id });
  }

  // SIGN-UP
  //  async signUp(data: CreateUserDto): Promise<User> {
  //   // Check for existing user
  //   const existing = await this.userRepo.findOne({
  //     where: [{ email: data.email }, { phone_number: data.phone_number }],
  //   });
  //   if (existing) {
  //     throw new ConflictException('Email or phone number already registered');
  //   }

  //   // Hash password manually (redundant if you use @BeforeInsert)
  //   const hashedPassword = await bcrypt.hash(data.password, 10);

  //   const user = this.userRepo.create({
  //     ...data,
  //     password: hashedPassword,
  //   });

  //   return await this.userRepo.save(user);
  //  }

  async signUp(data: CreateUserDto): Promise<User> {
    const existing = await this.userRepo.findOne({
      where: [{ email: data.email }, { phone_number: data.phone_number }],
    });
    if (existing)
      throw new ConflictException('Email or phone number already registered');

    const user = this.userRepo.create(data);
    return await this.userRepo.save(user);
  }

  // ======================

  async findByEmail(email: string) {
    return this.userRepo.findOne({ where: { email } });
  }

  async create(data: Partial<User>): Promise<User> {
    const user = this.userRepo.create(data);
    return await this.userRepo.save(user);
  }

  async update(id: number, data: Partial<User>): Promise<User> {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    Object.assign(user, data);
    return await this.userRepo.save(user);
  }

  async remove(id: number): Promise<void> {
    const result = await this.userRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }
}

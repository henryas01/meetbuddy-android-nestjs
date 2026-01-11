import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /users
  @Get()
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  // GET /users/:id
  @Get(':id')
  async findOne(@Param('id') id: number): Promise<User> {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  // POST /users
  // @Post()
  // async create(@Body() userData: Partial<User>): Promise<User> {
  //   return this.usersService.create(userData);
  // }

  @Post('signup')
  async signUp(@Body() data: CreateUserDto): Promise<User> {
    return this.usersService.signUp(data);
  }

  // PUT /users/:id
  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() userData: Partial<User>,
  ): Promise<User> {
    return this.usersService.update(id, userData);
  }

  // DELETE /users/:id
  @Delete(':id')
  async remove(@Param('id') id: number): Promise<{ message: string }> {
    await this.usersService.remove(id);
    return { message: `User with ID ${id} deleted successfully` };
  }
}

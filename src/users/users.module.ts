import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), // 👈 registers User entity with TypeORM
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // 👈 export if you need UsersService elsewhere
})
export class UsersModule {}

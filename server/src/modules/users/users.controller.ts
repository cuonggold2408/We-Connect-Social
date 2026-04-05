import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UsersService } from '@/modules/users/users.service';
import { CreateUserDto } from '@/modules/users/dto/request/create-user.dto';
import { UpdateProfileDto } from '@/modules/users/dto/request/update-profile.dto';
import { UpdateAvatarDto } from '@/modules/users/dto/request/update-avatar.dto';
import { UserResponseDto } from '@/modules/users/dto/response/user.dto';
import { CurrentUser } from '@/shared/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  async findAll(): Promise<UserResponseDto[]> {
    return this.usersService.findAll();
  }

  @Get('me')
  async findMe(@CurrentUser('id') userId: string): Promise<UserResponseDto> {
    return this.usersService.findOne(userId);
  }

  @Patch('me')
  @Throttle({
    short: { ttl: 60000, limit: 5 },
    medium: { ttl: 60000, limit: 5 },
    long: { ttl: 60000, limit: 5 },
  })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Patch('me/avatar')
  @Throttle({
    short: { ttl: 60000, limit: 3 },
    medium: { ttl: 60000, limit: 3 },
    long: { ttl: 60000, limit: 3 },
  })
  async updateAvatar(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateAvatarDto,
  ) {
    return this.usersService.updateAvatar(userId, dto.imageUrl);
  }

  @Patch('me/cover')
  @Throttle({
    short: { ttl: 60000, limit: 3 },
    medium: { ttl: 60000, limit: 3 },
    long: { ttl: 60000, limit: 3 },
  })
  async updateCover(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateAvatarDto,
  ) {
    return this.usersService.updateCover(userId, dto.imageUrl);
  }

  @Get('profile/:username')
  async getProfile(
    @CurrentUser('id') currentUserId: string,
    @Param('username') username: string,
  ) {
    return this.usersService.getProfile(username, currentUserId);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }
}

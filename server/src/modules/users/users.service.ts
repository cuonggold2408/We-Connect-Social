import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from '@/modules/users/users.repository';
import { CreateUserDto } from '@/modules/users/dto/request/create-user.dto';
import { UserResponseDto } from '@/modules/users/dto/response/user.dto';
import { FriendshipsService } from '@/modules/friendships/friendships.service';
import { FriendshipsRepository } from '@/modules/friendships/friendships.repository';
import { UserProfileDto } from '@/modules/users/dto/response/user-profile.dto';
import { UpdateProfileDto } from '@/modules/users/dto/request/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    private usersRepository: UsersRepository,
    private friendshipsService: FriendshipsService,
    private friendshipsRepository: FriendshipsRepository,
  ) {}

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  }

  private async comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    // Check if email already exists
    const existingEmail = await this.usersRepository.findByEmail(dto.email);
    if (existingEmail) {
      throw new ConflictException('Email đã được sử dụng');
    }

    // Check if username already exists
    const existingUsername = await this.usersRepository.findByUsername(
      dto.username,
    );
    if (existingUsername) {
      throw new ConflictException('Username đã được sử dụng');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(dto.password);

    // Create user
    const user = await this.usersRepository.create({
      username: dto.username,
      email: dto.email,
      password: hashedPassword,
    });

    return new UserResponseDto(user);
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User không tồn tại');
    }
    return new UserResponseDto(user);
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.usersRepository.findAll({});
    return users.map((user) => new UserResponseDto(user));
  }

  async getProfile(
    targetUsername: string,
    currentUserId: string,
  ): Promise<UserProfileDto> {
    const user = await this.usersRepository.findByUsername(targetUsername);
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }
    const [friendCount, relationshipResult, mutualFriendCount] =
      await Promise.all([
        this.friendshipsRepository.countFriends(user.id),
        this.friendshipsService.getRelationshipStatus(currentUserId, user.id),
        currentUserId !== user.id
          ? this.friendshipsRepository.countMutualFriends(
              currentUserId,
              user.id,
            )
          : Promise.resolve(0),
      ]);
    return new UserProfileDto({
      ...user,
      fullName: user.fullname,
      friendCount,
      mutualFriendCount,
      relationshipStatus: relationshipResult.status,
    });
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    const updateData: Record<string, unknown> = {};
    if (dto.fullname !== undefined) updateData.fullname = dto.fullname;
    if (dto.bio !== undefined) updateData.bio = dto.bio;
    if (dto.gender !== undefined) updateData.gender = dto.gender;
    if (dto.address !== undefined) updateData.address = dto.address;
    if (dto.birthday !== undefined) {
      updateData.birthday = new Date(dto.birthday);
    }
    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('Không có dữ liệu cần cập nhật');
    }
    const user = await this.usersRepository.updateProfile(userId, updateData);
    return new UserResponseDto(user);
  }

  async updateAvatar(
    userId: string,
    imageUrl: string,
  ): Promise<{ avatarUrl: string }> {
    const user = await this.usersRepository.updateAvatar(userId, imageUrl);
    return { avatarUrl: user.avatarUrl! };
  }

  async updateCover(
    userId: string,
    imageUrl: string,
  ): Promise<{ coverUrl: string }> {
    const user = await this.usersRepository.updateCover(userId, imageUrl);
    return { coverUrl: user.coverUrl! };
  }
}

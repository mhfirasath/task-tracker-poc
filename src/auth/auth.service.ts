import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Admin } from './admin.entity.js';
import { LoginDto } from './dto/login.dto.js';
import type { JwtPayload } from './jwt.strategy.js';
import { Role } from './role.js';
import { User } from './user.entity.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.verifyCredentials(this.userRepository, loginDto);
    return this.signToken({ sub: user.id, username: user.username, role: Role.USER });
  }

  async adminLogin(loginDto: LoginDto) {
    return this.signToken(await this.validateAdmin(loginDto));
  }

  // Shared by admin JWT login and HTTP Basic auth on admin routes.
  async validateAdmin(loginDto: LoginDto): Promise<JwtPayload> {
    const admin = await this.verifyCredentials(this.adminRepository, loginDto);
    return { sub: admin.id, username: admin.username, role: Role.ADMIN };
  }

  private async verifyCredentials<T extends User | Admin>(
    repository: Repository<T>,
    loginDto: LoginDto,
  ) {
    const account = await repository
      .createQueryBuilder('account')
      .addSelect('account.password')
      .where('account.username = :username', { username: loginDto.username })
      .getOne();

    if (!account || !(await bcrypt.compare(loginDto.password, account.password))) {
      throw new UnauthorizedException('Invalid username or password');
    }

    return account;
  }

  private signToken(payload: JwtPayload) {
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}

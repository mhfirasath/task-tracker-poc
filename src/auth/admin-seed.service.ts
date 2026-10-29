import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Admin } from './admin.entity.js';

// Seeds the default admin on startup. Idempotent: an existing admin with the
// same username is left untouched, so a changed password is never reset.
@Injectable()
export class AdminSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
  ) {}

  async onApplicationBootstrap() {
    const username = process.env.ADMIN_USERNAME ?? 'admin';
    const password = process.env.ADMIN_PASSWORD ?? 'admin$123';

    if (await this.adminRepository.exists({ where: { username } })) {
      return;
    }

    await this.adminRepository.save(
      this.adminRepository.create({
        username,
        password: await bcrypt.hash(password, 12),
      }),
    );
    this.logger.log(`Seeded admin account "${username}"`);
  }
}

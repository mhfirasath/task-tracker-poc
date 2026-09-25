import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 100 })
  username: string;

  @Column({ length: 255, select: false })
  password: string;

  @Column({ default: 'USER', length: 50 })
  role: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

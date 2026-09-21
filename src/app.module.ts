import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { TasksModule } from './tasks/tasks.module.js';
import { TypeOrmModule } from '@nestjs/typeorm';

console.log('DB_HOST=', process.env.DB_HOST);
console.log('DB_PORT=', process.env.DB_PORT);
console.log('DB_USERNAME=', process.env.DB_USERNAME);
console.log('DB_NAME=', process.env.DB_NAME);

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: '/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}'
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USERNAME ?? 'postgres',
      password: process.env.DB_PASSWORD ?? 'postgres',
      database: process.env.DB_NAME ?? 'task_tracker',
      autoLoadEntities: true,
      synchronize: true,
    }),
    TasksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

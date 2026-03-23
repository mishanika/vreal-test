import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "./modules/auth/auth.module";
import { FilesModule } from "./modules/files/files.module";
import { SharesModule } from "./modules/shares/shares.module";
import { EventsModule } from "./modules/events/events.module";
import { User } from "./entities/user.entity";
import { FileNode } from "./entities/file-node.entity";
import { Permission } from "./entities/permission.entity";
import { Share } from "./entities/share.entity";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432"),
      username: process.env.DB_USER || "vreal",
      password: process.env.DB_PASSWORD || "vreal_secret",
      database: process.env.DB_NAME || "vreal",
      entities: [User, FileNode, Permission, Share],
      synchronize: false,
      migrations: ["dist/migrations/*.js"],
      logging: false,
    }),
    AuthModule,
    FilesModule,
    SharesModule,
    EventsModule,
  ],
})
export class AppModule {}

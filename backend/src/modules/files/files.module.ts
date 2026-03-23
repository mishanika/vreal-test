import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FilesController } from "./files.controller";
import { FileNode } from "../../entities/file-node.entity";
import { User } from "../../entities/user.entity";
import { Permission } from "../../entities/permission.entity";
import { AuthModule } from "../auth/auth.module";
import { EventsModule } from "../events/events.module";
import { CompressionService } from "./compression.service";
import { StorageService } from "./storage.service";

@Module({
  imports: [TypeOrmModule.forFeature([FileNode, User, Permission]), AuthModule, EventsModule],
  controllers: [FilesController],
  providers: [CompressionService, StorageService],
})
export class FilesModule {}

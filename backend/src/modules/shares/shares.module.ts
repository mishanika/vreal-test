import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SharesController } from "./shares.controller";
import { Share } from "../../entities/share.entity";
import { FileNode } from "../../entities/file-node.entity";
import { User } from "../../entities/user.entity";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [TypeOrmModule.forFeature([Share, FileNode, User]), AuthModule],
  controllers: [SharesController],
})
export class SharesModule {}

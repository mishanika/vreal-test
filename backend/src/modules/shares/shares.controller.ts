import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  NotFoundException,
  ForbiddenException,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { v4 as uuidv4 } from "uuid";

import { Share } from "../../entities/share.entity";
import { FileNode } from "../../entities/file-node.entity";
import { User } from "../../entities/user.entity";
import { AuthGuard } from "../auth/auth.guard";
import { Public } from "../auth/public.decorator";
import { CreateShareDto } from "./dto/create-share.dto";

@ApiTags("Shares")
@Controller("shares")
export class SharesController {
  constructor(
    @InjectRepository(Share) private shareRepo: Repository<Share>,
    @InjectRepository(FileNode) private fileNodeRepo: Repository<FileNode>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a public share link for a file/folder" })
  async createShare(@Body() dto: CreateShareDto, @Req() req: any) {
    const user: User = req.user;
    const node = await this.fileNodeRepo.findOne({ where: { id: dto.fileNodeId } });
    if (!node) throw new NotFoundException("File not found");
    if (node.ownerId !== user.id) throw new ForbiddenException("Only owner can share");

    const token = uuidv4();
    const share = this.shareRepo.create({
      fileNodeId: dto.fileNodeId,
      email: dto.email || null,
      permission: "read",
      token,
    });

    const saved = await this.shareRepo.save(share);
    return { ...saved, publicUrl: `/shared/${token}` };
  }

  @Get("file/:fileNodeId")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "List all shares for a file/folder" })
  async listShares(@Param("fileNodeId") fileNodeId: string, @Req() req: any) {
    const user: User = req.user;
    const node = await this.fileNodeRepo.findOne({ where: { id: fileNodeId } });
    if (!node) throw new NotFoundException("File not found");
    if (node.ownerId !== user.id) throw new ForbiddenException("Only owner can view shares");

    return this.shareRepo.find({ where: { fileNodeId } });
  }

  @Delete(":shareId")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Revoke a share link" })
  async revokeShare(@Param("shareId") shareId: string, @Req() req: any) {
    const user: User = req.user;
    const share = await this.shareRepo.findOne({
      where: { id: shareId },
      relations: ["fileNode"],
    });
    if (!share) throw new NotFoundException("Share not found");
    if (share.fileNode.ownerId !== user.id) throw new ForbiddenException("Only owner can revoke shares");

    await this.shareRepo.delete(shareId);
  }

  @Public()
  @Get("public/:token")
  @ApiOperation({ summary: "Access a shared file/folder via public token" })
  async getByToken(@Param("token") token: string) {
    const share = await this.shareRepo.findOne({
      where: { token },
      relations: ["fileNode"],
    });
    if (!share) throw new NotFoundException("Share link not found or expired");

    const node = share.fileNode;
    const result: any = { ...node, sharePermission: share.permission };

    if (node.type === "folder") {
      const children = await this.fileNodeRepo.find({ where: { parentId: node.id } });
      result.children = children;
    }

    return result;
  }
}

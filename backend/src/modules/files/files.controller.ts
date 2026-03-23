import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody } from "@nestjs/swagger";
import { memoryStorage } from "multer";
import { extname } from "path";
import { v4 as uuidv4 } from "uuid";

import { FileNode } from "../../entities/file-node.entity";
import { User } from "../../entities/user.entity";
import { Permission, PermissionLevel } from "../../entities/permission.entity";
import { AuthGuard } from "../auth/auth.guard";
import { EventsGateway } from "../events/events.gateway";
import { CompressionService } from "./compression.service";
import { StorageService } from "./storage.service";
import { CreateFolderDto } from "./dto/create-folder.dto";
import { UpdateFileDto } from "./dto/update-file.dto";
import { ReorderDto } from "./dto/reorder.dto";
import { GrantPermissionDto } from "./dto/grant-permission.dto";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

@ApiTags("Files")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("files")
export class FilesController {
  constructor(
    @InjectRepository(FileNode) private fileNodeRepo: Repository<FileNode>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Permission) private permRepo: Repository<Permission>,
    private readonly eventsGateway: EventsGateway,
    private readonly compressionService: CompressionService,
    private readonly storageService: StorageService,
  ) {}

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private async canAccess(nodeId: string, userId: string, requiredLevel: PermissionLevel = "read"): Promise<boolean> {
    const node = await this.fileNodeRepo.findOne({ where: { id: nodeId } });
    if (!node) return false;
    if (node.ownerId === userId) return true;
    if (requiredLevel === "read" && node.isPublic) return true;

    const perm = await this.permRepo.findOne({
      where: { fileNodeId: nodeId, userId },
    });
    if (!perm) return false;

    const levels: Record<PermissionLevel, number> = { read: 1, write: 2, admin: 3 };
    return levels[perm.level] >= levels[requiredLevel];
  }

  private async getNextOrder(parentId: string | null, ownerId: string): Promise<number> {
    const query = this.fileNodeRepo
      .createQueryBuilder("fn")
      .select("MAX(fn.order)", "maxOrder")
      .where("fn.ownerId = :ownerId", { ownerId });

    if (parentId) {
      query.andWhere("fn.parentId = :parentId", { parentId });
    } else {
      query.andWhere("fn.parentId IS NULL");
    }

    const result = await query.getRawOne();
    return (result?.maxOrder ?? -1) + 1;
  }

  private async cloneNodeRecursive(sourceId: string, newParentId: string | null, ownerId: string): Promise<FileNode> {
    const source = await this.fileNodeRepo.findOne({ where: { id: sourceId } });
    if (!source) throw new NotFoundException("Source node not found");

    let newFilePath: string | null = null;
    if (source.type === "file" && source.filePath) {
      const ext = extname(source.filePath);
      newFilePath = `${Date.now()}-${uuidv4()}${ext}`;
      await this.storageService.copy(source.filePath, newFilePath);
    }

    const clone = this.fileNodeRepo.create({
      name: `${source.name} (copy)`,
      type: source.type,
      parentId: newParentId,
      ownerId,
      isPublic: source.isPublic,
      mimeType: source.mimeType,
      size: source.size,
      filePath: newFilePath,
      order: await this.getNextOrder(newParentId, ownerId),
    });
    const savedClone = await this.fileNodeRepo.save(clone);

    if (source.type === "folder") {
      const children = await this.fileNodeRepo.find({ where: { parentId: sourceId } });
      for (const child of children) {
        await this.cloneNodeRecursive(child.id, savedClone.id, ownerId);
      }
    }

    return savedClone;
  }

  private async deleteRecursive(id: string): Promise<void> {
    const node = await this.fileNodeRepo.findOne({ where: { id } });
    if (!node) return;

    const children = await this.fileNodeRepo.find({ where: { parentId: id } });
    for (const child of children) {
      await this.deleteRecursive(child.id);
    }

    if (node.filePath) {
      await this.storageService.delete(node.filePath);
    }

    await this.fileNodeRepo.delete(id);
  }

  // ─── List files in a folder ───────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: "List files/folders (root if no parentId)" })
  async listFiles(@Query("parentId") parentId: string, @Req() req: any) {
    const user: User = req.user;

    if (parentId) {
      // Check the user can access this folder before showing its contents
      const hasAccess = await this.canAccess(parentId, user.id, "read");
      if (!hasAccess) throw new ForbiddenException("Access denied");

      // Return ALL items in this folder regardless of who owns them
      return this.fileNodeRepo
        .createQueryBuilder("fn")
        .where("fn.parentId = :parentId", { parentId })
        .orderBy("fn.order", "ASC")
        .addOrderBy("fn.name", "ASC")
        .getMany();
    }

    // Root level ─────────────────────────────────────────────────────────────
    // 1. Own root items
    const ownFiles = await this.fileNodeRepo
      .createQueryBuilder("fn")
      .where("fn.ownerId = :userId", { userId: user.id })
      .andWhere("fn.parentId IS NULL")
      .orderBy("fn.order", "ASC")
      .addOrderBy("fn.name", "ASC")
      .getMany();

    // 2. Other users' public root items
    const publicFiles = await this.fileNodeRepo
      .createQueryBuilder("fn")
      .where("fn.isPublic = true")
      .andWhere("fn.ownerId != :userId", { userId: user.id })
      .andWhere("fn.parentId IS NULL")
      .orderBy("fn.name", "ASC")
      .getMany();

    // 3. Root items explicitly shared with this user
    const sharedPerms = await this.permRepo.find({
      where: { userId: user.id },
      relations: ["fileNode"],
    });
    const sharedNodes = sharedPerms
      .map((p) => p.fileNode)
      .filter((n) => n && n.parentId === null && n.ownerId !== user.id);

    const merged = [...ownFiles];
    for (const n of [...publicFiles, ...sharedNodes]) {
      if (!merged.find((m) => m.id === n.id)) merged.push(n);
    }
    return merged;
  }

  // ─── Search ────────────────────────────────────────────────────────────────

  @Get("search")
  @ApiOperation({ summary: "Search files and folders by name" })
  async search(@Query("q") q: string, @Req() req: any) {
    if (!q || q.trim().length === 0) return [];
    const user: User = req.user;

    return this.fileNodeRepo
      .createQueryBuilder("fn")
      .where("fn.ownerId = :userId", { userId: user.id })
      .andWhere("LOWER(fn.name) LIKE :q", { q: `%${q.toLowerCase()}%` })
      .orderBy("fn.name", "ASC")
      .getMany();
  }

  // ─── Create folder ────────────────────────────────────────────────────────

  @Post("folder")
  @ApiOperation({ summary: "Create a new folder" })
  async createFolder(@Body() dto: CreateFolderDto, @Req() req: any) {
    const user: User = req.user;

    if (dto.parentId) {
      const access = await this.canAccess(dto.parentId, user.id, "write");
      if (!access) throw new ForbiddenException("No write access to parent folder");
    }

    const folder = this.fileNodeRepo.create({
      name: dto.name,
      type: "folder",
      parentId: dto.parentId || null,
      ownerId: user.id,
      isPublic: false,
      order: await this.getNextOrder(dto.parentId || null, user.id),
    });

    const saved = await this.fileNodeRepo.save(folder);
    this.eventsGateway.emit("file:created", saved);
    return saved;
  }

  // ─── Upload file ──────────────────────────────────────────────────────────

  @Post("upload")
  @ApiOperation({ summary: "Upload an image file (JPEG, PNG, WebP)" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: { type: "string", format: "binary" },
        parentId: { type: "string" },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      fileFilter: (req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException("Only JPEG, PNG, and WebP images are allowed"), false);
        }
      },
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Body("parentId") parentId: string, @Req() req: any) {
    if (!file) throw new BadRequestException("No file provided");
    const user: User = req.user;

    if (parentId) {
      const access = await this.canAccess(parentId, user.id, "write");
      if (!access) throw new ForbiddenException("No write access to parent folder");
    }

    const ext = extname(file.originalname).toLowerCase() || ".bin";
    const key = `${Date.now()}-${uuidv4()}${ext}`;
    await this.storageService.upload(key, file.buffer, file.mimetype);

    const fileNode = this.fileNodeRepo.create({
      name: file.originalname,
      type: "file",
      parentId: parentId || null,
      ownerId: user.id,
      isPublic: false,
      mimeType: file.mimetype,
      size: file.size,
      filePath: key,
      order: await this.getNextOrder(parentId || null, user.id),
      compressionStatus: "pending",
    });

    const saved = await this.fileNodeRepo.save(fileNode);
    this.eventsGateway.emit("file:created", saved);
    setImmediate(() => this.compressionService.compressImage(saved, this.fileNodeRepo, this.eventsGateway));
    return saved;
  }

  // ─── Reorder (must be declared before @Patch(":id")) ─────────────────────

  @Patch("reorder")
  @ApiOperation({ summary: "Update order of multiple files/folders" })
  async reorder(@Body() dto: ReorderDto, @Req() req: any) {
    const user: User = req.user;
    for (const item of dto.items) {
      const node = await this.fileNodeRepo.findOne({ where: { id: item.id } });
      if (node && node.ownerId === user.id) {
        node.order = item.order;
        await this.fileNodeRepo.save(node);
      }
    }
    this.eventsGateway.emit("file:reordered", { items: dto.items });
    return { success: true };
  }

  // ─── Update (rename / toggle visibility) ─────────────────────────────────

  @Patch(":id")
  @ApiOperation({ summary: "Rename or update file/folder properties" })
  async updateFile(@Param("id") id: string, @Body() dto: UpdateFileDto, @Req() req: any) {
    const user: User = req.user;
    const node = await this.fileNodeRepo.findOne({ where: { id } });
    if (!node) throw new NotFoundException("File not found");

    const access = await this.canAccess(id, user.id, "write");
    if (!access) throw new ForbiddenException("No write access");

    if (dto.name !== undefined) node.name = dto.name;
    if (dto.isPublic !== undefined) node.isPublic = dto.isPublic;

    const saved = await this.fileNodeRepo.save(node);
    this.eventsGateway.emit("file:updated", saved);
    return saved;
  }

  // ─── Delete ────────────────────────────────────────────────────────────────

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a file or folder (recursive)" })
  async deleteFile(@Param("id") id: string, @Req() req: any) {
    const user: User = req.user;
    const node = await this.fileNodeRepo.findOne({ where: { id } });
    if (!node) throw new NotFoundException("File not found");
    if (node.ownerId !== user.id) throw new ForbiddenException("Only owner can delete");

    await this.deleteRecursive(id);
    this.eventsGateway.emit("file:deleted", { id });
  }

  // ─── Clone ────────────────────────────────────────────────────────────────

  @Post(":id/clone")
  @ApiOperation({ summary: "Clone a file or folder" })
  async cloneFile(@Param("id") id: string, @Req() req: any) {
    const user: User = req.user;
    const node = await this.fileNodeRepo.findOne({ where: { id } });
    if (!node) throw new NotFoundException("File not found");

    const access = await this.canAccess(id, user.id, "read");
    if (!access) throw new ForbiddenException("Access denied");

    const cloned = await this.cloneNodeRecursive(id, node.parentId, user.id);
    this.eventsGateway.emit("file:created", cloned);
    return cloned;
  }

  // ─── Get file details ─────────────────────────────────────────────────────

  @Get(":id")
  @ApiOperation({ summary: "Get file or folder by id" })
  async getFile(@Param("id") id: string, @Req() req: any) {
    const user: User = req.user;
    const node = await this.fileNodeRepo.findOne({ where: { id } });
    if (!node) throw new NotFoundException("File not found");

    const access = await this.canAccess(id, user.id, "read");
    if (!access) throw new ForbiddenException("Access denied");

    return node;
  }

  // ─── Permissions ──────────────────────────────────────────────────────────

  @Get(":id/permissions")
  @ApiOperation({ summary: "List permissions for a file/folder" })
  async listPermissions(@Param("id") id: string, @Req() req: any) {
    const user: User = req.user;
    const node = await this.fileNodeRepo.findOne({ where: { id } });
    if (!node) throw new NotFoundException("File not found");
    if (node.ownerId !== user.id) throw new ForbiddenException("Only owner can manage permissions");

    return this.permRepo.find({ where: { fileNodeId: id }, relations: ["user"] });
  }

  @Post(":id/permissions")
  @ApiOperation({ summary: "Grant permission to a user by email" })
  async grantPermission(@Param("id") id: string, @Body() dto: GrantPermissionDto, @Req() req: any) {
    const user: User = req.user;
    const node = await this.fileNodeRepo.findOne({ where: { id } });
    if (!node) throw new NotFoundException("File not found");
    if (node.ownerId !== user.id) throw new ForbiddenException("Only owner can grant permissions");

    const targetUser = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!targetUser) throw new NotFoundException(`No user with email ${dto.email}`);
    if (targetUser.id === user.id) throw new BadRequestException("Cannot grant permission to yourself");

    let perm = await this.permRepo.findOne({
      where: { fileNodeId: id, userId: targetUser.id },
    });

    if (perm) {
      perm.level = dto.level;
    } else {
      perm = this.permRepo.create({
        fileNodeId: id,
        userId: targetUser.id,
        level: dto.level,
      });
    }

    const saved = await this.permRepo.save(perm);
    // Notify all clients so the recipient sees the shared item immediately
    this.eventsGateway.emit("file:updated", node);
    return saved;
  }

  @Delete(":id/permissions/:permId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Revoke a permission" })
  async revokePermission(@Param("id") id: string, @Param("permId") permId: string, @Req() req: any) {
    const user: User = req.user;
    const node = await this.fileNodeRepo.findOne({ where: { id } });
    if (!node) throw new NotFoundException("File not found");
    if (node.ownerId !== user.id) throw new ForbiddenException("Only owner can revoke permissions");

    await this.permRepo.delete(permId);
  }
}

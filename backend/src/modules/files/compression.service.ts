import { Injectable, Logger } from "@nestjs/common";
import { Repository } from "typeorm";
import { parse } from "path";
import sharp from "sharp";
import { FileNode } from "../../entities/file-node.entity";
import { EventsGateway } from "../events/events.gateway";
import { StorageService } from "./storage.service";

@Injectable()
export class CompressionService {
  private readonly logger = new Logger(CompressionService.name);

  constructor(private readonly storageService: StorageService) {}

  async compressImage(fileNode: FileNode, repo: Repository<FileNode>, gateway: EventsGateway): Promise<void> {
    const { name } = parse(fileNode.filePath!);
    const newKey = `${name}-min.webp`;

    try {
      const originalBuffer = await this.storageService.download(fileNode.filePath!);
      const compressed = await sharp(originalBuffer)
        .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      await this.storageService.upload(newKey, compressed, "image/webp");
      await this.storageService.delete(fileNode.filePath!);

      fileNode.compressionStatus = "done";
      fileNode.filePath = newKey;
      fileNode.mimeType = "image/webp";
      const saved = await repo.save(fileNode);
      gateway.emit("file:compressed", saved);
    } catch (err) {
      this.logger.error(`Compression failed for node ${fileNode.id}: ${err}`);
      fileNode.compressionStatus = "error";
      const saved = await repo.save(fileNode);
      gateway.emit("file:compressed", saved);
    }
  }
}

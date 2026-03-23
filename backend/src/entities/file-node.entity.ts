import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { User } from "./user.entity";
import { Permission } from "./permission.entity";
import { Share } from "./share.entity";

export type FileNodeType = "file" | "folder";

@Entity("file_nodes")
export class FileNode {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ type: "varchar", default: "folder" })
  type: FileNodeType;

  @Column({ nullable: true, type: "varchar" })
  parentId: string | null;

  @ManyToOne(() => FileNode, (node) => node.children, {
    nullable: true,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "parentId" })
  parent: FileNode;

  @OneToMany(() => FileNode, (node) => node.parent)
  children: FileNode[];

  @Column()
  ownerId: string;

  @ManyToOne(() => User, (user) => user.files, { onDelete: "CASCADE" })
  @JoinColumn({ name: "ownerId" })
  owner: User;

  @Column({ default: false })
  isPublic: boolean;

  @Column({ nullable: true, type: "varchar" })
  mimeType: string | null;

  @Column({ nullable: true, type: "integer" })
  size: number | null;

  @Column({ nullable: true, type: "varchar" })
  filePath: string | null;

  @Column({ default: 0 })
  order: number;

  @Column({ type: "varchar", default: "none" })
  compressionStatus: "none" | "pending" | "done" | "error";

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Permission, (perm) => perm.fileNode)
  permissions: Permission[];

  @OneToMany(() => Share, (share) => share.fileNode)
  shares: Share[];
}

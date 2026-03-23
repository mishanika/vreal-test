import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Unique } from "typeorm";
import { User } from "./user.entity";
import { FileNode } from "./file-node.entity";

export type PermissionLevel = "read" | "write" | "admin";

@Entity("permissions")
@Unique(["fileNodeId", "userId"])
export class Permission {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  fileNodeId: string;

  @ManyToOne(() => FileNode, (node) => node.permissions, { onDelete: "CASCADE" })
  @JoinColumn({ name: "fileNodeId" })
  fileNode: FileNode;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.permissions, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @Column({ type: "varchar", default: "read" })
  level: PermissionLevel;

  @CreateDateColumn()
  createdAt: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { FileNode } from "./file-node.entity";

export type SharePermission = "read" | "write";

@Entity("shares")
export class Share {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  fileNodeId: string;

  @ManyToOne(() => FileNode, (node) => node.shares, { onDelete: "CASCADE" })
  @JoinColumn({ name: "fileNodeId" })
  fileNode: FileNode;

  @Column({ nullable: true, type: "varchar" })
  email: string | null;

  @Column({ type: "varchar", default: "read" })
  permission: SharePermission;

  @Column({ unique: true })
  token: string;

  @CreateDateColumn()
  createdAt: Date;
}

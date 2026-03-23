import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from "typeorm";
import { FileNode } from "./file-node.entity";
import { Permission } from "./permission.entity";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column()
  passwordHash: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => FileNode, (file) => file.owner)
  files: FileNode[];

  @OneToMany(() => Permission, (perm) => perm.user)
  permissions: Permission[];
}

import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entities/user.entity";
import { FileNode } from "./entities/file-node.entity";
import { Permission } from "./entities/permission.entity";
import { Share } from "./entities/share.entity";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USER || "vreal",
  password: process.env.DB_PASSWORD || "vreal_secret",
  database: process.env.DB_NAME || "vreal",
  entities: [User, FileNode, Permission, Share],
  migrations: ["src/migrations/*.ts"],
  synchronize: false,
  logging: false,
});

import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1742000000000 implements MigrationInterface {
  name = "InitialSchema1742000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id"           UUID              NOT NULL DEFAULT uuid_generate_v4(),
        "email"        CHARACTER VARYING NOT NULL,
        "name"         CHARACTER VARYING NOT NULL,
        "passwordHash" CHARACTER VARYING NOT NULL,
        "createdAt"    TIMESTAMP         NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email"   UNIQUE ("email"),
        CONSTRAINT "PK_users"        PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "file_nodes" (
        "id"                UUID                       NOT NULL DEFAULT uuid_generate_v4(),
        "name"              CHARACTER VARYING          NOT NULL,
        "type"              CHARACTER VARYING          NOT NULL DEFAULT 'folder',
        "parentId"          UUID,
        "ownerId"           UUID                       NOT NULL,
        "isPublic"          BOOLEAN                    NOT NULL DEFAULT false,
        "mimeType"          CHARACTER VARYING,
        "size"              INTEGER,
        "filePath"          CHARACTER VARYING,
        "order"             INTEGER                    NOT NULL DEFAULT 0,
        "compressionStatus" CHARACTER VARYING          NOT NULL DEFAULT 'none',
        "createdAt"         TIMESTAMP                  NOT NULL DEFAULT now(),
        "updatedAt"         TIMESTAMP                  NOT NULL DEFAULT now(),
        CONSTRAINT "PK_file_nodes" PRIMARY KEY ("id"),
        CONSTRAINT "FK_file_nodes_parent"
          FOREIGN KEY ("parentId") REFERENCES "file_nodes"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_file_nodes_owner"
          FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "permissions" (
        "id"         UUID              NOT NULL DEFAULT uuid_generate_v4(),
        "fileNodeId" UUID              NOT NULL,
        "userId"     UUID              NOT NULL,
        "level"      CHARACTER VARYING NOT NULL DEFAULT 'read',
        "createdAt"  TIMESTAMP         NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_permissions_node_user" UNIQUE ("fileNodeId", "userId"),
        CONSTRAINT "PK_permissions"            PRIMARY KEY ("id"),
        CONSTRAINT "FK_permissions_node"
          FOREIGN KEY ("fileNodeId") REFERENCES "file_nodes"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_permissions_user"
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "shares" (
        "id"         UUID              NOT NULL DEFAULT uuid_generate_v4(),
        "fileNodeId" UUID              NOT NULL,
        "email"      CHARACTER VARYING,
        "permission" CHARACTER VARYING NOT NULL DEFAULT 'read',
        "token"      CHARACTER VARYING NOT NULL,
        "createdAt"  TIMESTAMP         NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_shares_token" UNIQUE ("token"),
        CONSTRAINT "PK_shares"       PRIMARY KEY ("id"),
        CONSTRAINT "FK_shares_node"
          FOREIGN KEY ("fileNodeId") REFERENCES "file_nodes"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "shares"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "permissions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "file_nodes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}

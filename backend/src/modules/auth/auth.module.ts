import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { User } from "../../entities/user.entity";
import { AuthController } from "./auth.controller";
import { AuthGuard, JWT_SECRET } from "./auth.guard";

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.register({ secret: JWT_SECRET, signOptions: { expiresIn: "7d" } }),
  ],
  controllers: [AuthController],
  providers: [AuthGuard],
  exports: [AuthGuard, JwtModule],
})
export class AuthModule {}

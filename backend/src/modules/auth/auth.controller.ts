import { Controller, Post, Body, UnauthorizedException, ConflictException, Get, Req, UseGuards } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from "@nestjs/swagger";
import * as bcrypt from "bcryptjs";
import { User } from "../../entities/user.entity";
import { AuthGuard, JWT_SECRET, BYPASS_TOKEN } from "./auth.guard";
import { Public } from "./public.decorator";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  @Public()
  @Post("register")
  @ApiOperation({ summary: "Register a new user" })
  async register(@Body() dto: RegisterDto) {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException("Email already in use");

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({
      email: dto.email,
      name: dto.name,
      passwordHash,
    });
    const saved = await this.userRepo.save(user);

    const token = await this.jwtService.signAsync(
      { sub: saved.id, email: saved.email },
      { secret: JWT_SECRET, expiresIn: "7d" },
    );

    return {
      access_token: token,
      user: { id: saved.id, email: saved.email, name: saved.name },
    };
  }

  @Public()
  @Post("bypass")
  @ApiOperation({ summary: "Login with the hardcoded demo bypass token" })
  @ApiBody({ schema: { properties: { token: { type: "string" } }, required: ["token"] } })
  async bypassLogin(@Body("token") token: string) {
    if (token !== BYPASS_TOKEN) throw new UnauthorizedException("Invalid bypass token");

    let user = await this.userRepo.findOne({ where: { email: "bypass@demo.local" } });
    if (!user) {
      user = this.userRepo.create({
        email: "bypass@demo.local",
        name: "Demo Admin",
        passwordHash: await bcrypt.hash("bypass", 8),
      });
      user = await this.userRepo.save(user);
    }

    // Return the bypass token itself as access_token — the guard already accepts it directly.
    return {
      access_token: BYPASS_TOKEN,
      user: { id: user.id, email: user.email, name: user.name },
    };
  }

  @Public()
  @Post("login")
  @ApiOperation({ summary: "Login with email and password" })
  async login(@Body() dto: LoginDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException("Invalid credentials");

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException("Invalid credentials");

    const token = await this.jwtService.signAsync(
      { sub: user.id, email: user.email },
      { secret: JWT_SECRET, expiresIn: "7d" },
    );

    return {
      access_token: token,
      user: { id: user.id, email: user.email, name: user.name },
    };
  }

  @Get("me")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current authenticated user" })
  async getMe(@Req() req: any) {
    const user: User = req.user;
    return { id: user.id, email: user.email, name: user.name };
  }
}

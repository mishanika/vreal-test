import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { IoAdapter } from "@nestjs/platform-socket.io";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useWebSocketAdapter(new IoAdapter(app));

  app.enableCors({
    origin: ["http://localhost:5173", "http://localhost:4173", "http://localhost"],
    credentials: true,
  });

  app.setGlobalPrefix("api");

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle("VReal File Storage API")
    .setDescription(
      "RESTful API for a file storage service with folder hierarchy, permissions, and sharing.\n\n" +
        "**Hardcoded bypass token**: Use `Bearer vreal-demo-bypass-2026` as the Authorization header to bypass authentication for demo purposes.",
    )
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  await app.listen(6001);
  console.log("Backend running at http://localhost:6001");
  console.log("Swagger docs at  http://localhost:6001/api/docs");
  console.log("Bypass token:    vreal-demo-bypass-2026");
}
bootstrap();

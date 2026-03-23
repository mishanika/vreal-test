import { Injectable } from "@nestjs/common";
import { WebSocketGateway, WebSocketServer, OnGatewayConnection } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { JwtService } from "@nestjs/jwt";
import { BYPASS_TOKEN } from "../auth/auth.guard";

@Injectable()
@WebSocketGateway({ cors: { origin: "*" } })
export class EventsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(private readonly jwtService: JwtService) {}

  handleConnection(client: Socket): void {
    try {
      const token = client.handshake.auth?.token as string | undefined;
      if (!token) {
        client.disconnect();
        return;
      }
      // Allow the hardcoded demo bypass token
      if (token === BYPASS_TOKEN) return;
      this.jwtService.verify(token);
    } catch {
      client.disconnect();
    }
  }

  emit(event: string, data: unknown): void {
    this.server.emit(event, data);
  }
}

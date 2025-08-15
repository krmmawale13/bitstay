import { Body, Controller, Get, Post, Res, Req, UnauthorizedException } from "@nestjs/common";
import { Response, Request } from "express";
import { AuthService } from "./auth.service";
import { UsersService } from "../users/users.service";

@Controller("auth")
export class AuthController {
  constructor(private auth: AuthService, private users: UsersService) {}

  @Post("login")
  async login(@Body() dto: { email: string; password: string }, @Res() res: Response) {
    const { email, password } = dto;
    const user = await this.auth.validateUser(email, password); // throws if invalid
    const token = await this.auth.signJwt({ sub: user.id });
    res.cookie("access_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false, // set true in production (HTTPS)
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });
    return res.json({ ok: true });
  }

  @Get("me")
  async me(@Req() req: Request) {
    const userId = await this.auth.getUserIdFromRequest(req);
    if (!userId) throw new UnauthorizedException();
    return this.users.findPublicById(userId); // returns {id,email,name,role,avatarUrl}
  }

  @Post("logout")
  async logout(@Res() res: Response) {
    res.clearCookie("access_token", { path: "/" });
    return res.json({ ok: true });
  }
}

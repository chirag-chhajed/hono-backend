import type { AppRouteHandler } from "@/lib/types.js";
import type { LoginRoute } from "@/routes/auth/auth.routes.js";
import * as HttpStatusCodes from "@/lib/http-status-code.js";
import { UserEntity } from "@/db/entities/user.js";

export const login: AppRouteHandler<LoginRoute> = async (c) => {
  const { name, email, idToken } = c.req.valid('json')
  
  try {
    // Verify the user's credentials
    // In a real app, you would validate the idToken here
    
    // Check if user exists, if not create a new one
    let user = await UserEntity.query.byEmail({ email }).go();
    
    if (!user.data.length) {
      // Create new user
      const newUser = await UserEntity.create({
        name,
        email,
      }).go();

      c.var.logger.info(newUser);
      newUser.data.

      user = { data: [newUser] };
    }
    
    // Generate a token (in a real app, you'd use JWT or similar)
    const token = `mock_token_${Date.now()}`;
    
    return c.json({
      success: true,
      user: {
        id: user.data[0].userId,
        name: user.data[0].name,
        email: user.data[0].email,
      },
      token,
    }, HttpStatusCodes.OK);
    
  } catch (error) {
    c.var.logger.error(error);
    
    return c.json({
      success: false,
      message: "Authentication failed",
    }, HttpStatusCodes.UNAUTHORIZED);
  }
}; 
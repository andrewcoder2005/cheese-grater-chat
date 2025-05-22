import { createUser, checkUserExist, validateUser } from "../models/user.ts";
import { bcrypt } from "../deps.ts";
import { Context } from "../deps.ts";

export async function register(data: {
  username: string;
  email: string;
  password: string;
}) {
  let { username, email, password } = data;

  if (!username || !email || !password) {
    return { success: false, message: "All fields are required." };
  }

  email = email.toLowerCase().trim();

  if (password.length < 6) {
    return {
      success: false,
      message: "Password must be at least 6 characters long.",
    };
  }

  const existingUser = await checkUserExist(email);
  if (existingUser) {
    return { success: false, message: "Email already registered." };
  }

  const hashedPassword = await bcrypt.hash(password);

  const user = await createUser({ username, email, password: hashedPassword });

  if (user) {
    return { success: true, user };
  } else {
    return { success: false, message: "Failed to register user." };
  }
}

export async function login(data: { email: string; password: string }) {
  console.log("Login attempt for:", data.email);

  // validateUser to both check user and password match
  const user = await validateUser(data.email, data.password);
  console.log("Validated user:", user);

  if (!user) {
    return { success: false, message: "Invalid email or password." };
  }

  return {
    success: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      grater_points: user.grater_points,
    },
  };
}

export async function registerController(ctx: Context) {
  try {
    const body = ctx.request.body({ type: "json" });
    const data = await body.value;
    const result = await register(data);
    if (result.success && result.user) {
      ctx.response.status = 201;
      ctx.response.body = {
        message: "User registered successfully",
        user: {
          username: result.user.username,
          email: result.user.email,
        },
      };
    } else {
      ctx.response.status = 400;
      ctx.response.body = { error: result.message };
    }
  } catch (_error) {
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal Server Error" };
  }
}

export async function loginController(ctx: Context) {
  try {
    const body = ctx.request.body({ type: "json" });
    const data = await body.value;
    if (!data) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Missing or invalid JSON body" };
      return;
    }
    const result = await login(data);
    if (result.success && result.user) {
      ctx.response.status = 200;
      ctx.response.body = {
        message: "Login successful",
        user: {
          username: result.user.username,
          id: result.user.id,
          email: result.user.email,
          grater_points: result.user.grater_points,
        },
      };
    } else {
      ctx.response.status = 400;
      ctx.response.body = { error: result.message };
    }
  } catch (_error) {
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal Server Error" };
  }
}

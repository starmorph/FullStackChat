// If you see process.env linter errors, ensure you have @types/node installed and 'node' in your tsconfig types.
// import type { Request } from 'express'; // Uncomment if using express
import { Auth, HTTPException } from "@langchain/langgraph-sdk/auth";
import { User } from "@supabase/supabase-js";
import { getSupabaseClient } from "./lib/auth/supabase-client.js";

const supabase = getSupabaseClient();

const STUDIO_USER_ID = "langgraph-studio-user";

export const auth = new Auth()
  .authenticate(async (request: Request) => {
    console.log("[auth] Incoming request", request.url);
    // Parse Authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      throw new HTTPException(401, { message: "Authorization header missing" });
    }
    let token: string | undefined;
    try {
      const [scheme, value] = authHeader.split(" ");
      if (scheme.toLowerCase() !== "bearer") throw new Error();
      token = value;
    } catch {
      throw new HTTPException(401, {
        message: "Invalid authorization header format",
      });
    }
    if (!supabase) {
      throw new HTTPException(500, {
        message: "Supabase client not initialized",
      });
    }
    // Validate JWT with Supabase
    let user: User | null = null;
    try {
      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data?.user) {
        throw new Error(error?.message || "User not found");
      }
      user = data.user;
      if (!user) {
        throw new HTTPException(401, { message: "User not found" });
      }
    } catch (e: any) {
      throw new HTTPException(401, {
        message: `Authentication error: ${e.message}`,
      });
    }
    return {
      identity: user.id,
      permissions: [
        "threads:create",
        "threads:create_run",
        "threads:read",
        "threads:delete",
        "threads:update",
        "threads:search",
        "assistants:create",
        "assistants:read",
        "assistants:delete",
        "assistants:update",
        "assistants:search",
        "store:access",
      ],
    };
  })
  // THREADS: create
  .on("threads:create", ({ value, user }) => {
    if (user.identity === STUDIO_USER_ID) {
      return;
    }

    value.metadata ??= {};
    value.metadata.owner = user.identity;
    return { owner: user.identity };
  })
  // THREADS: create_run
  .on("threads:create_run", ({ value, user }) => {
    if (user.identity === STUDIO_USER_ID) {
      return;
    }

    value.metadata ??= {};
    value.metadata.owner = user.identity;
    return { owner: user.identity };
  })
  // THREADS: read, update, delete, search
  .on("threads:read", ({ user }) => {
    if (user.identity === STUDIO_USER_ID) {
      return;
    }

    return { owner: user.identity };
  })
  .on("threads:update", ({ user, permissions }) => {
    if (user.identity === STUDIO_USER_ID) {
      return;
    }

    return { owner: user.identity };
  })
  .on("threads:delete", ({ user, permissions }) => {
    if (user.identity === STUDIO_USER_ID) {
      return;
    }

    return { owner: user.identity };
  })
  .on("threads:search", ({ user, permissions }) => {
    if (user.identity === STUDIO_USER_ID) {
      return;
    }

    return { owner: user.identity };
  })
  // ASSISTANTS: create
  .on("assistants:create", ({ value, user }) => {
    if (user.identity === STUDIO_USER_ID) {
      return;
    }

    value.metadata ??= {};
    value.metadata.owner = user.identity;
    return { owner: user.identity };
  })
  // ASSISTANTS: read, update, delete, search
  .on("assistants:read", ({ user }) => {
    if (user.identity === STUDIO_USER_ID) {
      return;
    }

    return { owner: user.identity };
  })
  .on("assistants:update", ({ user }) => {
    if (user.identity === STUDIO_USER_ID) {
      return;
    }

    return { owner: user.identity };
  })
  .on("assistants:delete", ({ user }) => {
    if (user.identity === STUDIO_USER_ID) {
      return;
    }
    return { owner: user.identity };
  })
  .on("assistants:search", ({ user, value }) => {
    if (user.identity === STUDIO_USER_ID) {
      return;
    }
    return { owner: user.identity };
  })
  // STORE: permission-based access
  .on("store", ({ user }) => {
    return { owner: user.identity };
  });

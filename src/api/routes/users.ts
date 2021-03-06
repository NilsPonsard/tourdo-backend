import { Router } from "https://deno.land/x/oak@v10.1.0/mod.ts";
import { SendJSONResponse, ParseBodyJSON } from "../utils.ts";
import { Prefix } from "../utils.ts";
import {
    CreateUser,
    GetUserByUsername,
    GetUserAuthByUsername,
    GetUser,
    UpdateUser,
    GetParticipationInTeams,
    GetUserAuthByID,
    DeleteUser,
    GetUsers,
    User,
    SearchUsers,
    GetUsersCount,
} from "../../database/entities/user.ts";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.3.0/mod.ts";

import {
    CreateToken,
    DeleteToken,
    GetTokensWithAccessToken,
} from "../../database/entities/token.ts";
import { NewTokenPair } from "../../jwt/tokens.ts";
import { GetUserWithAccessToken } from "../../jwt/user.ts";
import { getQuery } from "https://deno.land/x/oak@v10.1.0/helpers.ts";
import { DecodeJWT } from "../../jwt/signature.ts";


/**
 * 
 * This router handles all requests to the /users endpoint.
 * 
 */
const router = new Router({ prefix: `${Prefix}/users` });

router.post("/register", async (ctx) => {
    const body = await ParseBodyJSON<{ password: string; username: string }>(ctx);

    const username = body.username.trim();

    if (body.password.length < 8) SendJSONResponse(ctx, { message: "Password too short" }, 400);
    if (username.length < 3) SendJSONResponse(ctx, { message: "Username too short" }, 400);

    try {
        const used = await GetUserByUsername(ctx.app.state.pool, username);
        if (used) {
            return SendJSONResponse(ctx, { message: "User already exists" }, 409);
        }
        const user = await CreateUser(
            ctx.app.state.pool,
            username,
            await bcrypt.hash(body.password)
        );
        console.log(user);
        return SendJSONResponse(ctx, user, 201);
    } catch (err) {
        console.log("err :", err);
        return SendJSONResponse(ctx, { message: "Database error" }, 400);
    }
});

router.post("/logout", async (ctx) => {
    const token = ctx.request.headers.get("authorization");

    const user = await GetUserWithAccessToken(ctx.app.state.pool, token);
    if (!user || token == undefined) return SendJSONResponse(ctx, { message: "Unauthorized" }, 401);

    const decoded = await DecodeJWT(token);

    const accessToken = await GetTokensWithAccessToken(ctx.app.state.pool, decoded.token);

    if (!accessToken) return SendJSONResponse(ctx, { message: "Not found" }, 404);

    try {
        await DeleteToken(ctx.app.state.pool, accessToken.id);
    } catch (e) {
        console.log(e);
        return SendJSONResponse(ctx, { message: "Database error" }, 500);
    }
    return SendJSONResponse(ctx, { message: "Logged out" }, 200);
});

router.post("/login", async (ctx) => {
    const body = await ParseBodyJSON<{ password: string; username: string }>(ctx);

    const username = body.username.trim();

    // check login

    const user = await GetUserAuthByUsername(ctx.app.state.pool, username);

    console.log(user);

    if (!user || !(await bcrypt.compare(body.password, user.password))) {
        return SendJSONResponse(ctx, { message: "Wrong username/Password" }, 401);
    }

    // generate token

    const tokens = await NewTokenPair(user.id);

    // store jwt hash in database

    await CreateToken(
        ctx.app.state.pool,
        user.id,
        tokens.accessToken,
        new Date(tokens.accessExpiration),
        tokens.refreshToken,
        new Date(tokens.refreshExpiration)
    );

    // return jwt
    return SendJSONResponse(ctx, {
        access_token: tokens.accessJWT,
        refresh_token: tokens.refreshJWT,
    });
});

router.get("/me", async (ctx) => {
    const user = await GetUserWithAccessToken(
        ctx.app.state.pool,
        ctx.request.headers.get("authorization")
    );

    if (!user) return SendJSONResponse(ctx, { message: "Unauthorized" }, 401);

    return SendJSONResponse(ctx, user);
});

/**
 * @api {patch} /users/me change password
 */
router.patch("/me", async (ctx) => {
    const user = await GetUserWithAccessToken(
        ctx.app.state.pool,
        ctx.request.headers.get("authorization")
    );

    if (!user) return SendJSONResponse(ctx, { message: "Unauthorized" }, 401);

    const body = await ParseBodyJSON<{
        old_password: string;
        new_password: string;
    }>(ctx);

    if (body.new_password == body.old_password)
        return SendJSONResponse(ctx, { message: "New password is the same" }, 400);

    const userAuth = await GetUserAuthByUsername(ctx.app.state.pool, user.username);

    if (!(await bcrypt.compare(body.old_password, userAuth.password)))
        return SendJSONResponse(ctx, { message: "Wrong password" }, 400);

    try {
        await UpdateUser(
            ctx.app.state.pool,
            user.id,
            await bcrypt.hash(body.new_password),
            user.admin
        );
    } catch (e) {
        console.error(e);
        return SendJSONResponse(ctx, { message: "Database error" }, 500);
    }

    return SendJSONResponse(ctx, { message: "Password changed" });
});

router.get("/:id/teams", async (ctx) => {
    const userId = parseInt(ctx.params.id, 10);

    if (isNaN(userId)) return SendJSONResponse(ctx, { message: "Invalid user id" }, 400);

    const teams = await GetParticipationInTeams(ctx.app.state.pool, userId);

    return SendJSONResponse(ctx, teams);
});

router.get("/:id", async (ctx) => {
    const userId = parseInt(ctx.params.id, 10);

    if (isNaN(userId)) return SendJSONResponse(ctx, { message: "Invalid user id" }, 400);

    const user = await GetUser(ctx.app.state.pool, userId);

    if (!user) return SendJSONResponse(ctx, { message: "Not found" }, 404);

    return SendJSONResponse(ctx, user);
});

router.patch("/:id", async (ctx) => {
    // check auth

    const user = await GetUserWithAccessToken(
        ctx.app.state.pool,
        ctx.request.headers.get("authorization")
    );
    if (!user) return SendJSONResponse(ctx, { message: "Unauthorized" }, 401);
    if (!user.admin) return SendJSONResponse(ctx, { message: "Forbidden : not admin" }, 403);

    // get new info

    const body = await ParseBodyJSON<{ passowrd?: string; admin?: boolean }>(ctx);

    // get old info

    const targetedUser = await GetUserAuthByID(ctx.app.state.pool, parseInt(ctx.params.id, 10));
    if (!targetedUser) return SendJSONResponse(ctx, { message: "Not found" }, 404);

    // check data to update

    let newPassword = targetedUser.password;
    let newAdmin = targetedUser.admin;

    if (body.admin !== undefined) newAdmin = body.admin;
    if (newPassword !== undefined) newPassword = await bcrypt.hash(newPassword);

    // update user

    try {
        await UpdateUser(ctx.app.state.pool, targetedUser.id, newPassword, newAdmin);
    } catch (e) {
        console.log(e);

        return SendJSONResponse(ctx, { message: "Database error" }, 500);
    }
    return SendJSONResponse(ctx, { message: "User updated" });
});

router.delete("/:id", async (ctx) => {
    const user = await GetUserWithAccessToken(
        ctx.app.state.pool,
        ctx.request.headers.get("authorization")
    );
    if (!user) return SendJSONResponse(ctx, { message: "Unauthorized" }, 401);
    if (!user.admin || user.id == parseInt(ctx.params.id))
        return SendJSONResponse(ctx, { message: "Forbidden : not admin or current user" }, 403);

    const targetedUser = await GetUserAuthByID(ctx.app.state.pool, parseInt(ctx.params.id, 10));
    if (!targetedUser) return SendJSONResponse(ctx, { message: "Not found" }, 404);

    try {
        await DeleteUser(ctx.app.state.pool, targetedUser.id);
    } catch (e) {
        console.log(e);
        return SendJSONResponse(ctx, { message: "Database error" }, 500);
    }
    return SendJSONResponse(ctx, { message: "User deleted" });
});

router.get("/", async (ctx) => {
    const queryParams = getQuery(ctx);

    let limit = parseInt(queryParams.limit, 10);
    if (isNaN(limit) || limit > 200) limit = 200; // max 200 users

    let offset = parseInt(queryParams.offset, 10);
    if (isNaN(offset)) offset = 0;

    const search = queryParams.search;

    let users: User[] = [];
    if (search == undefined || search == "") {
        users = await GetUsers(ctx.app.state.pool, limit, offset);
    } else {
        users = await SearchUsers(ctx.app.state.pool, search, limit, offset);
    }

    let total = -1;
    try {
        total = await GetUsersCount(ctx.app.state.pool);
    } catch (e) {
        console.log(e);
    }
    console.log(users, total);

    return SendJSONResponse(ctx, { users, total });
});

export { router as Users };

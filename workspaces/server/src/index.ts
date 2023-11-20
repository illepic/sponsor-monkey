import axios from "axios";
import z from "zod";
import selfSigned from "openssl-self-signed-certificate";
import * as jose from "jose";

import { getGoogleUser } from "./utils";

// import { Database } from "bun:sqlite";
// const schema = z.optional(z.object({ message: z.string() }));
// const db = new Database(":memory:");
// const sqlQuery = db.query('select "hello asdfdfd" as message;');

const client_id = Bun.env.GOOGLE_OAUTH_CLIENT_ID;
if (!client_id) throw new Error("GOOGLE_OAUTH_CLIENT_ID is not set");

const client_secret = Bun.env.GOOGLE_OAUTH_CLIENT_SECRET;
if (!client_secret) throw new Error("GOOGLE_OAUTH_CLIENT_SECRET is not set");

const redirect_uri = Bun.env.GOOGLE_OAUTH_REDIRECT_URI;
if (!redirect_uri) throw new Error("GOOGLE_OAUTH_REDIRECT_URI is not set");

// Shape of the response from Google's token endpoint
const GoogleOauthReturnSchema = z.object({
  id_token: z.string(),
  access_token: z.string(),
  expires_in: z.number(),
  refresh_token: z.string(),
  scope: z.string(),
  token_type: z.literal("Bearer"),
});
const getGoogleOauthTokens = async ({ code }: { code: string }) => {
  if (!code) throw new Error("Code missing from Google oauth request");

  const url = "https://oauth2.googleapis.com/token";
  const values = {
    code,
    client_id,
    client_secret,
    redirect_uri,
    grant_type: "authorization_code",
  };

  try {
    const res = await axios.post<z.infer<typeof GoogleOauthReturnSchema>>(
      url,
      values,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );

    // console.log(res.data);

    return GoogleOauthReturnSchema.parse(res.data);
  } catch (e) {
    if (e instanceof Error) {
      console.error(e.message, "Failed to fetch Google oauth tokens");
    }
  }
};

const googleOauthHandler = async (req: Request) => {
  const url = new URL(req.url);

  // Get the code from the query string
  const code = url.searchParams.get("code");
  if (!code) throw new Error("Code missing from Google oauth callback");

  // Get the id and access token with with the code
  const { id_token, access_token } = await getGoogleOauthTokens({ code });
  // console.log({ id_token, access_token });

  // Get the user with the tokens
  // Noting here we have user info in the id_token. But we can also use the
  // access_token to get user info from the Google API
  const googleUserFromJwt = jose.decodeJwt(id_token);
  console.log({ googleUserFromJwt });
  // Now same, but from Google API
  const googleUserFromApi = await getGoogleUser({ id_token, access_token });
  console.log({ googleUserFromApi });

  // Upsert user and create session

  // Make db call here, TBD, but use "email_validated" to ensure it's not fake

  // Create a session

  // Create access and refresh tokens
  // Set cookies
  // Redirect back to client

  const res = new Response(null, { status: 302 });
  res.headers.set("Location", "/testing");
  res.headers.set(
    "Set-Cookie",
    "cats=meow; path=/; Secure; SameSite=Strict; HttpOnly;",
  );

  return res;

  // return new Response(null, {
  //   status: 302,
  //   headers: {
  //     Location: "/testing",

  //     // "Set-Cookie": [
  //       //   `access_token=${access_token}; HttpOnly; Secure; SameSite=Strict`,
  //       //   `refresh_token=${access_token}; HttpOnly; Secure; SameSite=Strict`,
  //     // ],
  //   },
  // });
};

const server = Bun.serve({
  port: 3000,
  cert: selfSigned.cert,
  key: selfSigned.key,
  async fetch(req) {
    // Testing SQLite
    // const q = await sqlQuery.get();
    // const results = schema.parse(q);
    // if (results) {
    // return new Response(results.message);
    // return new Response(Bun.env.GOOGLE_OAUTH_REDIRECT_URI);
    // }

    // Only support GET for now
    if (req.method !== "GET")
      return new Response("Method not allowed", { status: 405 });

    const url = new URL(req.url);

    if (/^\/api\/sessions\/oauth\/google$/.test(url.pathname)) {
      console.log(url.pathname);
      console.log(url.searchParams.get("code"));

      return await googleOauthHandler(req);

      // return new Response("Matched /api/sessions/oauth/google", {
      //   status: 200,
      // });
    }

    // Otherwise return 404
    return new Response("I'm a teapot", { status: 418 });
  },
});

console.log(`Listening on https://localhost:${server.port} ...`);

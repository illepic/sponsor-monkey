export const getGoogleOauthUrl = () => {
  const redirect_uri = import.meta.env.VITE_GOOGLE_OAUTH_REDIRECT_URI;
  const client_id = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID;

  if (!redirect_uri) {
    throw new Error("GOOGLE_OAUTH_REDIRECT_URI is not set");
  }
  if (!client_id) {
    throw new Error("GOOGLE_OAUTH_CLIENT_ID is not set");
  }

  const params = new URLSearchParams({
    redirect_uri,
    client_id,
    access_type: "offline",
    response_type: "code",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/youtube.readonly",
    ].join(" "),
  }).toString();

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = params;

  return url.toString();
};

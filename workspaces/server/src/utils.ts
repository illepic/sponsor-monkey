import axios from "axios";
import z from "zod";

const GoogleUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  picture: z.string(),
  locale: z.string(),
  given_name: z.string(),
  family_name: z.string(),
  verified_email: z.boolean(),
});

export const getGoogleUser = async ({
  id_token,
  access_token,
}: {
  id_token: string;
  access_token: string;
}) => {
  try {
    const res = await axios.get<z.infer<typeof GoogleUserSchema>>(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`,
      {
        headers: {
          Authorization: `Bearer ${id_token}`,
        },
      },
    );
    return res.data;
  } catch (e) {
    if (e instanceof Error) {
      console.error(e.message, "Failed to fetch Google user info");
    }
  }
};

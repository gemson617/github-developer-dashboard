
import GitHubProvider from "next-auth/providers/github";

export const authOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,

      profile(profile) {
        return {
          id: String(profile.id),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
          username: profile.login,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, account, profile }) {
      // Runs when the user signs in with GitHub.
      if (account) {
        token.accessToken = account.access_token;
      }

      if (profile) {
        token.username = profile.login;
      }

      return token;
    },

    async session({ session, token }) {
      // Expose profile information to the frontend.
      if (session.user) {
        session.user.username =
          token.username || token.name || null;
      }

      // Do NOT expose token.accessToken here.
      return session;
    },
  },
};

/**
 * NextAuth.js Type Augmentation
 *
 * Extends the default Session type to include user.id
 * so TypeScript knows about the id field we inject in the session callback.
 */

import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

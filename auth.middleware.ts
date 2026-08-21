import { Request, Response, NextFunction } from "express";
import { DecodedIdToken } from "firebase-admin/auth";
import { getAdminAuth } from "./db-instance.ts";

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  emailVerified?: boolean;
  displayName?: string;
  photoURL?: string;
  decodedToken: DecodedIdToken;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Strict Firebase ID Token Authentication Middleware for Express.
 * 
 * Verifies the incoming Authorization header (Bearer <Firebase_ID_TOKEN>)
 * server-side using the Firebase Admin SDK. Attaches verified user metadata to req.user.
 * 
 * Returns HTTP 401 for:
 * - Missing Authorization header
 * - Invalid header format (non-Bearer)
 * - Missing token
 * - Expired token
 * - Invalid/tampered token
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: "Unauthorized: Missing Authorization header. Expected 'Authorization: Bearer <token>'",
      code: "AUTH_HEADER_MISSING"
    });
  }

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Unauthorized: Invalid Authorization header format. Expected 'Bearer <token>'",
      code: "AUTH_HEADER_INVALID_FORMAT"
    });
  }

  const token = authHeader.substring(7).trim();

  if (!token) {
    return res.status(401).json({
      error: "Unauthorized: Missing Bearer token in Authorization header",
      code: "AUTH_TOKEN_MISSING"
    });
  }

  const adminAuth = getAdminAuth();
  if (!adminAuth) {
    console.error("[AUTH MIDDLEWARE ERROR] Firebase Admin Auth instance is not initialized.");
    return res.status(500).json({
      error: "Internal Server Error: Authentication verification service unavailable",
      code: "AUTH_SERVICE_UNAVAILABLE"
    });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);

    if (!decodedToken || !decodedToken.uid) {
      return res.status(401).json({
        error: "Unauthorized: Invalid authentication credentials",
        code: "AUTH_TOKEN_INVALID"
      });
    }

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      displayName: (decodedToken.name as string) || undefined,
      photoURL: (decodedToken.picture as string) || undefined,
      decodedToken
    };

    return next();
  } catch (err: any) {
    console.warn(`[AUTH MIDDLEWARE] Token verification failed: ${err?.message || err}`);

    if (err?.code === "auth/id-token-expired") {
      return res.status(401).json({
        error: "Unauthorized: Authentication token has expired",
        code: "AUTH_TOKEN_EXPIRED"
      });
    }

    if (err?.code === "auth/id-token-revoked") {
      return res.status(401).json({
        error: "Unauthorized: Authentication token has been revoked",
        code: "AUTH_TOKEN_REVOKED"
      });
    }

    if (err?.code === "auth/argument-error" || err?.code === "auth/invalid-id-token") {
      return res.status(401).json({
        error: "Unauthorized: Malformed or invalid authentication token",
        code: "AUTH_TOKEN_INVALID"
      });
    }

    return res.status(401).json({
      error: "Unauthorized: Token verification failed",
      code: "AUTH_VERIFICATION_FAILED"
    });
  }
}

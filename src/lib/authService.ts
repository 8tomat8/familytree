import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db/connection';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export interface TokenPayload {
  userId: string;
  email: string;
  username: string;
  isAdmin: boolean;
}

export interface User {
  id: string;
  email: string;
  username: string;
  isAdmin: boolean;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
}

export class AuthService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET;
  private static readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
  private static readonly BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');

  static generateToken(user: User): string {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      isAdmin: user.isAdmin,
    };

    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    });
  }

  static validateToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.JWT_SECRET) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.BCRYPT_ROUNDS);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static async extractUserFromRequest(request: NextRequest): Promise<User | null> {
    try {
      let token: string | undefined;

      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }

      const tokenCookie = request.cookies.get('auth-token');
      if (!token && tokenCookie) {
        token = tokenCookie.value;
      }

      if (!token) {
        return null;
      }

      const payload = this.validateToken(token);
      
      const [user] = await db
        .select({
          id: users.id,
          email: users.email,
          username: users.username,
          isAdmin: users.isAdmin,
          isActive: users.isActive,
          createdAt: users.createdAt,
          lastLoginAt: users.lastLoginAt,
        })
        .from(users)
        .where(eq(users.id, payload.userId))
        .limit(1);

      if (!user || !user.isActive) {
        return null;
      }

      return user;
    } catch (error) {
      return null;
    }
  }

  static async authenticateUser(email: string, password: string): Promise<User | null> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);

      if (!user || !user.isActive) {
        return null;
      }

      const isValidPassword = await this.comparePassword(password, user.passwordHash);
      if (!isValidPassword) {
        return null;
      }

      await db
        .update(users)
        .set({ lastLoginAt: new Date() })
        .where(eq(users.id, user.id));

      return {
        id: user.id,
        email: user.email,
        username: user.username,
        isAdmin: user.isAdmin,
        isActive: user.isActive,
        createdAt: user.createdAt,
        lastLoginAt: new Date(),
      };
    } catch (error) {
      return null;
    }
  }

  static async createAdminUser(): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@familytree.local';
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    try {
      const [existingAdmin] = await db
        .select()
        .from(users)
        .where(eq(users.email, adminEmail))
        .limit(1);

      if (existingAdmin) {
        return;
      }

      const hashedPassword = await this.hashPassword(adminPassword);

      await db.insert(users).values({
        email: adminEmail,
        username: adminUsername,
        passwordHash: hashedPassword,
        isAdmin: true,
        isActive: true,
      });

      console.log(`Admin user created: ${adminEmail}`);
    } catch (error) {
      console.error('Failed to create admin user:', error);
    }
  }
}
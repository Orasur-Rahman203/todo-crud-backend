import { Injectable, BadRequestException } from '@nestjs/common';
import {
  CreateUserSchema,
  UpdateUserSchema,
  User,
  PaginationQuery,
} from './dto/user.schema';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createUser(userData: any): Promise<User> {
    // Check if userData is null, undefined, or not an object
    if (!userData || typeof userData !== 'object' || Array.isArray(userData)) {
      throw new BadRequestException({
        message: 'Invalid request body',
        errors: [
          {
            field: 'body',
            message: 'Request body must be a valid JSON object',
          },
        ],
      });
    }

    // Validate the incoming data using Zod
    const result = CreateUserSchema.safeParse(userData);

    if (!result.success) {
      // Format Zod errors into a readable format with more detailed messages
      const errors = result.error.issues.map((err) => {
        let field = err.path.join('.');
        if (field === '') field = 'root';

        let message = err.message;

        if (
          !message.toLowerCase().includes(field.toLowerCase()) &&
          field !== 'root'
        ) {
          message = `${field}: ${message}`;
        }

        return {
          field,
          message,
          receivedValue: err.path.reduce((obj, key) => obj?.[key], userData),
        };
      });

      throw new BadRequestException({
        message: 'Validation failed',
        errors: errors,
      });
    }

    // Checks if user with same email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: result.data.email },
    });

    if (existingUser) {
      throw new BadRequestException({
        message: 'User already exists',
        errors: [
          {
            field: 'email',
            message: 'User with this email already exists',
            receivedValue: result.data.email,
          },
        ],
      });
    }

    try {
      // Create user with Prisma
      const newUser = await this.prisma.user.create({
        data: {
          name: result.data.name,
          ext: result.data.ext,
          phone: result.data.phone,
          email: result.data.email,
          dateOfBirth: result.data.dateOfBirth,
          password: result.data.password,
          skills: result.data.skills,
        },
      });

      return newUser as unknown as User;
    } catch (error) {
      throw new BadRequestException({
        message: 'Failed to create user',
        errors: [
          {
            field: 'server',
            message: 'Internal server error occurred while creating user',
          },
        ],
      });
    }
  }

  async getAllUsers(query: PaginationQuery = {}): Promise<{
    data: User[];
    totalUsers: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  }> {
    const page = query.page || 1;
    const limit = query.limit || 5;

    // Get total count
    const totalUsers = await this.prisma.user.count();
    const totalPages = Math.ceil(totalUsers / limit);
    const currentPage = Math.max(1, Math.min(page, totalPages));

    // Calculate offset
    const offset = (currentPage - 1) * limit;

    // Get paginated data
    const data = await this.prisma.user.findMany({
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    // Calculate hasNext and hasPrev
    const hasNext = currentPage < totalPages;
    const hasPrev = currentPage > 1;

    return {
      data: data as unknown as User[],
      totalUsers,
      totalPages,
      currentPage,
      limit,
      hasNext,
      hasPrev,
    };
  }

  async getUserById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    return user as unknown as User | null;
  }

  async deleteUser(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new BadRequestException(`User with id ${id} not found`);
    }

    return this.prisma.user.delete({
      where: { id },
    }) as Promise<User>;
  }

  async updateUser(id: string, userData: any): Promise<User> {
    // Check if userData is null, undefined, or not an object
    if (!userData || typeof userData !== 'object' || Array.isArray(userData)) {
      throw new BadRequestException('Invalid input: Expected an object');
    }

    // Validate the input data using Zod
    const validationResult = UpdateUserSchema.safeParse(userData);

    if (!validationResult.success) {
      const errorMessages = validationResult.error.issues
        .map((error) => `${error.path.join('.')}: ${error.message}`)
        .join(', ');
      throw new BadRequestException(`Validation failed: ${errorMessages}`);
    }

    const validatedData = validationResult.data;

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new BadRequestException(`User with id ${id} not found`);
    }

    // If email is being updated, check for uniqueness
    if (validatedData.email) {
      const emailExists = await this.prisma.user.findFirst({
        where: {
          email: validatedData.email,
          NOT: { id },
        },
      });

      if (emailExists) {
        throw new BadRequestException('Email already exists');
      }
    }

    // Update the user
    return this.prisma.user.update({
      where: { id },
      data: validatedData,
    }) as Promise<User>;
  }
}

import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  HttpStatus,
  HttpCode,
  BadRequestException,
  Query,
  Delete,
  Patch,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User, PaginatedResponse, PaginationQuery } from './dto/user.schema';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Create a new user
  @Post('/create')
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() createUserDto: any): Promise<{
    success: boolean;
    message: string;
    data?: User;
    errors?: any[];
  }> {
    try {
      const user = await this.usersService.createUser(createUserDto);
      return {
        success: true,
        message: 'User created successfully',
        data: user,
      };
    } catch (error) {
      // Handle BadRequestException properly
      if (error instanceof BadRequestException) {
        const response = error.getResponse() as any;
        return {
          success: false,
          message: response.message || error.message,
          errors: response.errors || [],
        };
      }

      // Handle unexpected errors
      return {
        success: false,
        message: 'Internal server error',
        errors: [
          {
            field: 'server',
            message: 'An unexpected error occurred while creating the user',
          },
        ],
      };
    }
  }

  // Get All users with pagination
  @Get()
  async getAllUsers(@Query() query: any): Promise<PaginatedResponse<User>> {
    const paginationQuery: PaginationQuery = {
      page: query.page ? parseInt(query.page) : undefined,
      limit: query.limit ? parseInt(query.limit) : undefined,
    };

    const result = await this.usersService.getAllUsers(paginationQuery);
    return {
      success: true,
      message: 'Users retrieved successfully',
      ...result,
    };
  }

  // Get Single user by ID
  @Get(':id')
  async getUserById(@Param('id') id: string): Promise<{
    success: boolean;
    message: string;
    data?: User;
  }> {
    const user = await this.usersService.getUserById(id);
    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    }
    return {
      success: true,
      message: 'User retrieved successfully',
      data: user,
    };
  }

  // Delete user by ID
  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    try {
      const user = await this.usersService.deleteUser(id);
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }
      return {
        success: true,
        message: 'User deleted successfully',
        data: user,
      };
    } catch (error) {
      throw error;
    }
  }

  // Update user by ID
  @Patch(':id')
  async updateUser(@Param('id') id: string, @Body() userData: any) {
    try {
      const user = await this.usersService.updateUser(id, userData);
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }
      return {
        success: true,
        message: 'User updated successfully',
        data: user,
      };
    } catch (error) {
      throw error;
    }
  }
}

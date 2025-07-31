import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class OwnerGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resourceId = request.params.id;

    // If no resource ID, allow (might be creating new resource)
    if (!resourceId) {
      return true;
    }

    // Check if user is admin (admins can access everything)
    const fullUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (fullUser?.role === 'ADMIN') {
      return true;
    }

    // Check resource ownership based on the controller
    const controllerName = context.getClass().name;

    switch (controllerName) {
      case 'AccountsController':
        return this.checkAccountOwnership(user.id, resourceId);
      
      case 'UsersController':
        return user.id === resourceId; // Users can only access their own profile
      
      case 'TransactionsController':
        return this.checkTransactionOwnership(user.id, resourceId);
      
      default:
        return false;
    }
  }

  private async checkAccountOwnership(userId: string, accountId: string): Promise<boolean> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { userId: true },
    });

    return account?.userId === userId;
  }

  private async checkTransactionOwnership(userId: string, transactionId: string): Promise<boolean> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        fromAccount: { select: { userId: true } },
        toAccount: { select: { userId: true } },
      },
    });

    if (!transaction) {
      return false;
    }

    // User owns transaction if they own either the from or to account
    return (
      transaction.fromAccount?.userId === userId ||
      transaction.toAccount?.userId === userId
    );
  }
}
declare module '@prisma/client' {
  export class PrismaClient {
    constructor(options?: any);
    user: any;
    account: any;
    session: any;
    verificationToken: any;
    context: any;
    project: any;
    task: any;
    habit: any;
    habitLog: any;
    $transaction: any;
  }

  export namespace Prisma {
    export type TransactionClient = any;
  }
}

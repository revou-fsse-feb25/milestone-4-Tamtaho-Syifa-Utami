<h1> Milestone 4 </h1>
<h2> Relationships </h2>
1. User ⇨ Account (One-to-Many)
userId in the Account model is a foreign key that references User.id
Cascade delete is enabled, so if a user is deleted, all their related accounts will also be deleted

2. Account ⇨ Transaction (One-to-Many in two directions)
A transaction may have either or both fields:
Transfer: has both sender and receiver
Deposit: only has toAccount
Withdrawal: only has fromAccount

<h2> seeder </h2>

Uses AI to generate data 

<h2> Backend API </h2>

Data formats:
GET user
<code>
 {
    "id": 1,
    "email": "admin@bank.com",
    "firstName": "System",
    "lastName": "Administrator",
    "role": "ADMIN"
  },

    {
    "id": 5,
    "email": "bob.wilson@example.com",
    "firstName": "Bob",
    "lastName": "Wilson",
    "role": "USER"
  }
  
  GET accounts
  {
      accountNumber: 'ACC-002-SAV',
      accountType: 'SAVINGS',
      balance: 8750.25,
      userId: user2.id,
      }


  GET transactions
  {
      type: 'DEPOSIT',
      amount: 1000.00,
      description: 'Initial deposit',
      toAccountId: account1.id,
      status: 'COMPLETED',
    },
{
      type: 'WITHDRAWAL',
      amount: 150.00,
      description: 'Cash withdrawal',
      fromAccountId: account3.id,
      status: 'COMPLETED',
    },


</code>
List of API 

- GET /user/profile: Retrieve user profile
- PATCH /user/profile: Update user profile
- POST /accounts: Create bank account (user-specific)
- GET /accounts: List all user bank accounts
- GET /accounts/:id: Get specific account
- PATCH /accounts/:id: Update bank account
- DELETE /accounts/:id: Delete bank account
- POST /transactions/withdraw: Withdraw from account
- GET /transactions: List user transactions
- GET /transactions/:id: View transaction details See carefully in case we already have some data

<h2> Security </h2>

1. Use jwt secret:
   <img width="300" height="auto" alt="image" src="https://github.com/user-attachments/assets/2aa9d68a-c13c-457e-9ea8-beed564a4a24" />
<img width="163" height="81" alt="Screenshot 2025-08-01 at 11 39 30 pm" src="https://github.com/user-attachments/assets/4b349ba7-c39f-4974-bb49-90095d8faeec" />

2. Authentication Guard (JwtAuthGuard):
- All endpoints have to login
- No access without JWT token

3. Admin Guard
- view all users/accounts
- Delete users/accounts - Admin only
- operations

Owner Guard (as in ownership)

- View their own profile/accounts
- can modify their own data
- Cannot see other users' data


<h2> Testing </h2>
1. src/auth/auth.controller.spec.ts ⇨ check authentication points - register and login
2. src/auth/auth.error.spec.ts ⇨ error handling (409 conflict errors, 401 unauthorized errors, etc) 
3. src/transaction/transaction.business.spec.ts ⇨ business logics, type validation, transaction amounts/numbers validation
4. src/endpoints-test.spec.ts ⇨ chek all endpoints

<h2>Deployment</h2>

- **backend** Railway : milestone-4-tamtaho-syifa-utami.railway.internal
- **database** Supabase : https://mkasyrrbtmkkmrgnhhwj.supabase.co

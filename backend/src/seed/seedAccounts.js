const Account = require('../models/Account');

const seedAccounts = async () => {
  try {
    // Check if accounts collection is empty
    const count = await Account.countDocuments();
    
    if (count > 0) {
      console.log('✅ Accounts already seeded, skipping...');
      return;
    }

    console.log('🌱 Seeding accounts...');

    // Default accounts with password '123456' (meets 6 char minimum)
    const defaultAccounts = [
      {
        username: 'admin',
        password: '123456',
        firstName: 'Admin',
        lastName: 'User'
      },
      {
        username: 'user1',
        password: '123456',
        firstName: 'สมชาย',
        lastName: 'ใจดี'
      },
      {
        username: 'user2',
        password: '123456',
        firstName: 'สมหญิง',
        lastName: 'รักเรียน'
      }
    ];

    // Create accounts one by one to trigger pre-save hook
    for (const accountData of defaultAccounts) {
      const account = new Account(accountData);
      await account.save();
    }

    console.log('✅ Successfully seeded 3 accounts');
    console.log('   - admin / 123456');
    console.log('   - user1 / 123456');
    console.log('   - user2 / 123456');

  } catch (error) {
    console.error('❌ Error seeding accounts:', error.message);
  }
};

module.exports = seedAccounts;

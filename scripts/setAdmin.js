/**
 * Script to set a user as admin
 * Usage: node scripts/setAdmin.js <email>
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function setAdminRole(email) {
  try {
    // Get user by email
    const userRecord = await admin.auth().getUserByEmail(email);
    console.log(`Found user: ${userRecord.uid}`);

    // Update role in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      role: 'admin'
    }, { merge: true });

    console.log(`✅ Successfully set ${email} as admin`);
    console.log(`User ID: ${userRecord.uid}`);

  } catch (error) {
    console.error('❌ Error setting admin role:', error.message);
    process.exit(1);
  }
}

// Get email from command line
const email = process.argv[2];

if (!email) {
  console.error('Usage: node scripts/setAdmin.js <email>');
  process.exit(1);
}

setAdminRole(email)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

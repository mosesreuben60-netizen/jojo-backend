// Run locally with: npm run hash-password -- "the-password-you-want"
// Copy the printed hash into ADMIN_PASSWORD_HASH on Railway.

const bcrypt = require("bcryptjs");

const plain = process.argv[2];
if (!plain) {
  console.error("Usage: npm run hash-password -- \"your-password\"");
  process.exit(1);
}

const hash = bcrypt.hashSync(plain, 10);
console.log("\nAdd this to ADMIN_PASSWORD_HASH:\n");
console.log(hash);
console.log("");

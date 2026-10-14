import bcrypt from "bcrypt";

const password = process.argv[2] || "admin123";

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error("Error hashing password:", err);
    process.exit(1);
  }
  console.log("\n✅ Password hash for: " + password);
  console.log("Hash: " + hash);
  console.log("\nCopy the hash above and use in SQL below");
  process.exit(0);
});

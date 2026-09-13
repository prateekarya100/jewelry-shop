// Run with: node test-email.js
// This bypasses the whole app and directly tests just the email sending,
// so we can see the real error (if any) with nothing else in the way.
import "dotenv/config";
import * as mailer from "./mailer.js";

console.log("Attempting to send a test email now...\n");

try {
  await mailer.sendOtpEmail(process.env.GMAIL_USER, "123456");
  console.log("\n✅ send() completed without throwing an error.");
  console.log(
    "If you still see no email, the problem is on Gmail's delivery side, not our code.",
  );
} catch (err) {
  console.log("\n❌ send() threw an error:");
  console.log(err);
}

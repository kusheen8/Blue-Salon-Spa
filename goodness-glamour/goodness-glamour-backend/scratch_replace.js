import fs from 'fs';

const filePath = 'server.js';
let content = fs.readFileSync(filePath, 'utf8');

// Replace convertTo24hr time convert calls and wrap loop content in try-catch defensively
const targetCronStr = `cron.schedule("* * * * *", async () => {
  const now = new Date();
  const bookings = await booking.find();
  for (const booking of bookings) {

   const apptTime = new Date(
     \`\${booking.date}T\${convertTo24hr(booking.time)}+05:30\`
   );`;

// Let's find if the file has any variations in spacing or line endings
// We can use a regex that matches the cron.schedule loop precisely:
const cronRegex = /cron\.schedule\(\s*['"]\* \* \* \* \*['"]\s*,\s*async\s*\(\s*\)\s*=>\s*\{\s*const\s+now\s*=\s*new\s+Date\(\);\s*const\s+bookings\s*=\s*await\s+booking\.find\(\);\s*for\s*\(\s*const\s+booking\s+of\s+bookings\s*\)\s*\{/;

if (cronRegex.test(content)) {
  console.log("✅ cron.schedule match found!");
} else {
  console.log("❌ cron.schedule match NOT found!");
}

// Let's do a clean regex replacement of the entire loop body to wrap it in try-catch and secure convertTo24hr time checks.
// We will replace from:
// for (const booking of bookings) {
// to the end of the loop, which closes with `  }});` or similar
// Let's read and do a simpler, clean string replacement:
content = content.replace(
  /for\s*\(\s*const\s+booking\s+of\s+bookings\s*\)\s*\{\s*const\s+apptTime\s*=\s*new\s+Date\(\s*`\$\{booking\.date\}T\$\{convertTo24hr\(booking\.time\)\}\+05:30`\s*\);\s*console\.log\(\s*["']\[CRON\] ISO Appointment:["']\s*,\s*apptTime\.toISOString\(\)\s*\);\s*const\s+diffMins\s*=\s*\(apptTime\s*-\s*now\)\s*\/\s*60000;/,
  `for (const booking of bookings) {
    try {
      if (!booking.date || !booking.time) continue;
      const t24 = convertTo24hr(booking.time);
      const apptTime = new Date(\`\${booking.date}T\${t24}+05:30\`);
      if (isNaN(apptTime.getTime())) continue;
      const diffMins = (apptTime - now) / 60000;`
);

// Add safety catches to end of cron loop
content = content.replace(
  /booking\.fifteenMinReminderSent\s*=\s*true;\s*await\s+booking\.save\(\);\s*console\.log\(["']\[CRON\] 15 minute reminder sent["']\);\s*\}\s*catch\s*\(\s*err\s*\)\s*\{\s*console\.log\(\s*["']EMAIL ERROR:["']\s*,\s*err\s*\);\s*\}\s*\}\s*\}\s*\}\);\s*function\s+convertTo24hr/,
  `booking.fifteenMinReminderSent = true;
    await booking.save();
    console.log("[CRON] 15 minute reminder sent");
  } catch (err) {
    console.log("EMAIL ERROR:", err);
  }
} catch (loopErr) {
  console.error("❌ Cron error processing booking for " + booking.name + ":", loopErr.message);
}
  }
});

function convertTo24hr`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("🎉 Programmatic replacement complete!");

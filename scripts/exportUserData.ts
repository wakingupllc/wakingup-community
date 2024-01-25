import {promisify} from 'util'
import {exec} from 'child_process'

/**
 * To use this script, run:
 * connect local server to production database
 * `yarn export-user-data <email>`
 * you'll get 3 csv files in the root directory of the project (email_profile.csv, email_posts.csv, email_comments.csv)
 */
(async () => {
  const email = process.argv[2];
  if (!email) {
    throw new Error(`No email supplied`);
  }

  const runExec = promisify(exec)
  await runExec(`./scripts/serverShellCommand.sh --wait "Vulcan.wuExportUserData({email: '${email}'})" > /dev/tty 2>&1`)
})()

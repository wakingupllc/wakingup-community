import {promisify} from 'util'
import {exec} from 'child_process'
import * as fs from 'fs';

const secretsJson = fs.readFileSync('./exportSecrets.json').toString();
const secrets = JSON.parse(secretsJson);

const readline = require('readline');

function getInput(prompt: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise<string>(resolve => {
    rl.question(prompt, (input: string) => {
      rl.close();
      resolve(input);
    });
  });
}

function outputPostIds() {
  console.log('Useful postIds for testing exports: ');
  console.log('');
  console.log('B6a4S5cP8PgBuco25 (Meditation and ADHD) - This one contains comment 9rppqpCJFoQDfzga5, which is deleted and is by the deleted user AndrewR and has 2 replies');
  console.log('EvjYDCrBNsAjnwBnp (Do you meditate every day?)');
  console.log("Ey4Y5jFLdML7hxsoa (How do you know that you've woken up?) - This one contains comment jgtPwjvNiB4fwQaZf, which is deleted and is by the deleted user AndrewR and has 3 replies");
  console.log('q6rTaPk5qE8CxqjK4 (How do you all deal with fear of your own mortality and inevitable death?) - This one contains comments nZFiqRP9B5LoDs6oo and go9bBt3gfxwxMCpMg, which have deletedPublic = true (and are not by AndrewR)');
  console.log('KemiWtrqQanJtykYq (Awakened Life)');
  console.log('tzmseRmmeefYBWDTg (Grateful) - has deep-nested comments');
  console.log('pj6HekLJnbxTk5tnS (Listening Week) - two comments, few votes');
  console.log('8LRkmEdjnHz5FY9TH (Reluctant search for meaning) - has a comment with double backslash escape character problem');
  console.log('');
}

const KEENAN_PASSWORD = secrets['KEENAN_PASSWORD'];

/**
 * To use this script, run:
 * run local server, probably pointing to production database
 * `yarn better-mode-export`
 */
(async () => {
  let postIdsInput: string;
  const commandLineArgs = process.argv.slice(2); // Get command line arguments, excluding the first two elements

  if (commandLineArgs.length > 0) {
    postIdsInput = commandLineArgs[0] === 'all' ? '' : commandLineArgs[0]; // First argument used for postIdsInput
  } else {
    // Prompt for input if no command line argument is provided
    while (true) {
      postIdsInput = await getInput("\nEnter a comma-delimited list of post IDs to export, or type 'l' to list some candidate post ids, or just hit enter to export all posts:\n") as string;
      if (postIdsInput === 'l') {
        outputPostIds()
        continue;
      }
      break;
    }
  }

  // Split the input into an array of strings, and then map each string to a string wrapped in double quotes, and then join the array of strings with commas
  const postIdsArray = postIdsInput.split(',').map((id: string) => `'${id.trim()}'`);

  if (postIdsInput.length > 0) {
    console.log('\nExporting only specific post/s: ', postIdsInput);
  }

  const postIdsParam = (postIdsInput.length > 0) ? `, [${postIdsArray.join(',')}]` : '';

  let singleUserInput: string;
  if (commandLineArgs.length > 1) {
    singleUserInput = commandLineArgs[1]; // Second argument used for singleUserInput
  } else {
    // prompt for singleUserInput if no second argument is provided
    console.log("\nDo you want to skip exporting all 4000 users, and just assign every post and comment to one single user (Keenan)? (Use this option if you just want to test post and comment exports, and don't want to wait for the slow user creation export to finish.)");
    singleUserInput = await getInput("Enter 'y' for yes, or any other input for no:\n") as string;
  }

  const singleUserParam = String(singleUserInput === 'y');

  const execStr = `./scripts/serverShellCommand.sh --wait "Vulcan.wuBetterModeExport('${KEENAN_PASSWORD}', ${singleUserParam}${postIdsParam})" > /dev/tty 2>&1`;

  // const execStr = `./scripts/serverShellCommand.sh --wait "Vulcan.wuDeleteOldBetterModeCollectionsAndSpaces('${KEENAN_PASSWORD}')" > /dev/tty 2>&1`;

  // const execStr = `./scripts/serverShellCommand.sh --wait "Vulcan.wuReconcilePosts('${KEENAN_PASSWORD}')" > /dev/tty 2>&1`;

  // const execStr = `./scripts/serverShellCommand.sh --wait "Vulcan.wuBetterModeNotificationsDeletion('${KEENAN_PASSWORD}')" > /dev/tty 2>&1`;

  // const execStr = `./scripts/serverShellCommand.sh --wait "Vulcan.wuBetterModeDuplicateRepliesDeletion('${KEENAN_PASSWORD}')" > /dev/tty 2>&1`;

  console.log('\nRunning this command: ', execStr)

  const runExec = promisify(exec)
  await runExec(execStr)
})()
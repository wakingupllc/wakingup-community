import {promisify} from 'util'
import {exec} from 'child_process'

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
  console.log('');
}

/**
 * To use this script, run:
 * run local server, probably pointing to production database
 * `yarn better-mode-export`
 */
(async () => {
  const mkPasswordInput = await getInput("Enter the password for the Keenan admin account that'll call the API:\n") as string;

  let postIdsInput: string;
  while (true) {
    postIdsInput = await getInput("\nEnter a comma-delimited list of post IDs to export, or type 'l' to list some candidate post ids, or just hit enter to export all posts:\n") as string;
    if (postIdsInput === 'l') {
      outputPostIds()
      continue;
    }
    break;
  }

  // Split the input into an array of strings, and then map each string to a string wrapped in double quotes, and then join the array of strings with commas

  const postIdsArray = postIdsInput.split(',').map((id: string) => `'${id.trim()}'`);

  if (postIdsArray.length > 0) {
    console.log('\nExporting only specific post/s: ', postIdsInput);
  }

  const postIdsParam = (postIdsInput.length > 0) ? `, [${postIdsArray.join(',')}]` : '';

  console.log("\nDo you want to skip exporting all 4000 users, and just assign every post and comment to one single user (Keenan)? (Use this option if you just want to test post and comment exports, and don't want to wait the 8 minutes it takes to export all the users.)");
  const singleUserInput = await getInput("Enter 'y' for yes, or any other input for no:\n") as string;

  const singleUserParam = String(singleUserInput === 'y');

  const execStr = `./scripts/serverShellCommand.sh --wait "Vulcan.wuBetterModeExport('${mkPasswordInput}', ${singleUserParam}${postIdsParam})" > /dev/tty 2>&1`;

  console.log('\nRunning this command: ', execStr)

  const runExec = promisify(exec)
  await runExec(execStr)
})()

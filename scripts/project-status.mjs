import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const githubGraphqlUrl = 'https://api.github.com/graphql';
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const tokenFile = resolve(scriptDirectory, '..', '.env.agent.local');
const statuses = {
  'in-progress': 'GH_PROJECT_STATUS_IN_PROGRESS_OPTION_ID',
  'in-review': 'GH_PROJECT_STATUS_IN_REVIEW_OPTION_ID',
  blocked: 'GH_PROJECT_STATUS_BLOCKED_OPTION_ID',
};

function fail(message) {
  throw new Error(message);
}

function parseTokenFile(contents) {
  const values = Object.fromEntries(
    contents
      .split(/\r?\n/u)
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const separator = line.indexOf('=');
        return [line.slice(0, separator), line.slice(separator + 1)];
      }),
  );
  const required = [
    'GH_TOKEN',
    'GH_TOKEN_EXPIRES_AT',
    'GH_REPOSITORY',
    'GH_HANDOFF_ISSUE_NUMBER',
    'GH_PROJECT_ID',
    'GH_PROJECT_STATUS_FIELD_ID',
    ...Object.values(statuses),
  ];

  if (required.some((key) => !values[key])) {
    fail(
      'The app GitHub token lacks Project status metadata. Ask factory control to issue a fresh token after approving the GitHub App Projects permission.',
    );
  }
  if (Date.parse(values.GH_TOKEN_EXPIRES_AT) <= Date.now()) {
    fail('The app GitHub token has expired. Ask factory control to issue a fresh token.');
  }
  if (!Number.isSafeInteger(Number(values.GH_HANDOFF_ISSUE_NUMBER))) {
    fail('The app GitHub token has an invalid handed-off Issue number.');
  }

  return values;
}

async function githubGraphql(token, query, variables) {
  const response = await fetch(githubGraphqlUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({ query, variables }),
  });
  const payload = await response.json();

  if (!response.ok || payload.errors) {
    fail(
      'GitHub Project status update failed. Check the issue, Project membership, and token permission.',
    );
  }

  return payload.data;
}

async function main() {
  const [issueNumberRaw, status] = process.argv.slice(2);
  const issueNumber = Number(issueNumberRaw);
  if (!Number.isSafeInteger(issueNumber) || issueNumber <= 0 || !statuses[status]) {
    fail('Usage: bun scripts/project-status.mjs <issue-number> <in-progress|in-review|blocked>');
  }

  let tokenContents;
  try {
    tokenContents = await readFile(tokenFile, 'utf8');
  } catch {
    fail('No app GitHub token is available. Ask factory control to issue one.');
  }
  const token = parseTokenFile(tokenContents);
  if (issueNumber !== Number(token.GH_HANDOFF_ISSUE_NUMBER)) {
    fail(
      `This token is issued only for Issue #${token.GH_HANDOFF_ISSUE_NUMBER}; it cannot update Issue #${issueNumber}.`,
    );
  }
  // This site's Issues are filed in 1n1-studio; the token names that repository.
  const [owner, repo] = (token.GH_ISSUE_REPOSITORY ?? token.GH_REPOSITORY).split('/');
  const issueData = await githubGraphql(
    token.GH_TOKEN,
    `query IssueProjectItem($owner: String!, $repo: String!, $number: Int!) {
      repository(owner: $owner, name: $repo) {
        issue(number: $number) {
          projectItems(first: 20) {
            nodes {
              id
              project {
                id
              }
            }
          }
        }
      }
    }`,
    { owner, repo, number: issueNumber },
  );
  const projectItem = issueData.repository?.issue?.projectItems.nodes.find(
    (item) => item.project.id === token.GH_PROJECT_ID,
  );
  if (!projectItem) {
    fail(`Issue #${issueNumber} is not an item in this app's Project.`);
  }

  await githubGraphql(
    token.GH_TOKEN,
    `mutation UpdateProjectStatus(
      $projectId: ID!
      $itemId: ID!
      $fieldId: ID!
      $optionId: String!
    ) {
      updateProjectV2ItemFieldValue(
        input: {
          projectId: $projectId
          itemId: $itemId
          fieldId: $fieldId
          value: { singleSelectOptionId: $optionId }
        }
      ) {
        projectV2Item {
          id
        }
      }
    }`,
    {
      projectId: token.GH_PROJECT_ID,
      itemId: projectItem.id,
      fieldId: token.GH_PROJECT_STATUS_FIELD_ID,
      optionId: token[statuses[status]],
    },
  );

  console.log(`Set Issue #${issueNumber} to ${status}.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

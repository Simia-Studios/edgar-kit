import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const cliPath = fileURLToPath(new URL("../dist/cli.mjs", import.meta.url));

const commandTree = {
  companies: ["by-ticker"],
  filings: ["list", "search"],
  financials: ["company", "statement", "metric"],
  "share-prices": ["history", "latest"],
};

const removedGroups = ["tickers", "submissions", "search", "archives", "indexes", "xbrl"];

if (!existsSync(cliPath)) {
  throw new Error("dist/cli.mjs does not exist. Run pnpm build before pnpm verify:cli.");
}

const runHelp = (args) => {
  const result = spawnSync(process.execPath, [cliPath, ...args, "--help"], {
    encoding: "utf8",
    env: {
      ...process.env,
      FORCE_COLOR: "0",
      NO_COLOR: "1",
    },
  });

  if (result.status !== 0) {
    throw new Error(`edgar-kit ${args.join(" ")} --help failed:\n${result.stderr || result.stdout}`);
  }

  return stripAnsi(result.stdout);
};

const stripAnsi = (value) => value.replace(/\x1b\[[0-9;]*m/g, "");

const assertIncludes = (output, expected, command) => {
  if (!output.includes(expected)) {
    throw new Error(`Help for "${command}" did not include "${expected}".`);
  }
};

const assertNoCommandGroup = (output, group) => {
  const lines = output.split(/\r?\n/);
  const hasGroup = lines.some((line) => line.startsWith(`  ${group}  `) || line.startsWith(`    ${group} `));

  if (hasGroup) {
    throw new Error(`Root help unexpectedly included removed command group "${group}".`);
  }
};

const rootHelp = runHelp([]);
assertIncludes(rootHelp, "Usage:", "edgar-kit");
assertIncludes(rootHelp, "Options:", "edgar-kit");
assertIncludes(rootHelp, "Commands:", "edgar-kit");
assertIncludes(rootHelp, "--help", "edgar-kit");

for (const [group, commands] of Object.entries(commandTree)) {
  assertIncludes(rootHelp, group, "edgar-kit");

  for (const command of commands) {
    assertIncludes(rootHelp, `${group} ${command}`, "edgar-kit");
  }
}

for (const group of removedGroups) {
  assertNoCommandGroup(rootHelp, group);
}

for (const [group, commands] of Object.entries(commandTree)) {
  const groupHelp = runHelp([group]);
  assertIncludes(groupHelp, "Usage:", group);
  assertIncludes(groupHelp, "Options:", group);
  assertIncludes(groupHelp, "Commands:", group);
  assertIncludes(groupHelp, "--help", group);

  for (const command of commands) {
    assertIncludes(groupHelp, command, group);

    const leafHelp = runHelp([group, command]);
    assertIncludes(leafHelp, "Usage:", `${group} ${command}`);
    assertIncludes(leafHelp, "Global options:", `${group} ${command}`);
    assertIncludes(leafHelp, "--help", `${group} ${command}`);
    assertIncludes(leafHelp, command, `${group} ${command}`);
  }
}

console.log(`Verified --help for ${Object.values(commandTree).flat().length} focused CLI commands.`);

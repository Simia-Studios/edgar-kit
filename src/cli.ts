#!/usr/bin/env node
import { Command, Options } from "@effect/cli";
import { NodeContext, NodeRuntime } from "@effect/platform-node";
import { Effect } from "effect";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { SECClient } from "./client";
import { isSECClientError } from "./errors";
import { SEC_FINANCIAL_METRIC_DEFINITIONS } from "./resources/financials";
import type { SECClientError } from "./errors";
import type { SECFinancialFrequency, SECFinancialMetric, SECFinancialStatement } from "./types/financials";
import type { SearchFilingsInput } from "./types/search";
import type { SECSharePriceProvider } from "./types/share-prices";

interface PackageJson {
  readonly description: string;
  readonly version: string;
}

interface CommonCliOptions {
  readonly userAgent: string;
  readonly maxRps: number;
  readonly disableRateLimit: boolean;
  readonly sharePriceProviderCommand: string;
}

interface CliHelpOption {
  readonly flags: string;
  readonly description: string;
}

interface CliHelpCommand {
  readonly description: string;
  readonly options?: readonly CliHelpOption[];
}

interface CliHelpGroup {
  readonly description: string;
  readonly commands: Record<string, CliHelpCommand>;
}

type AnyCommand = Command.Command<string, never, never, any>;

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as PackageJson;

const financialMetricChoices = Object.keys(SEC_FINANCIAL_METRIC_DEFINITIONS) as [
  SECFinancialMetric,
  ...SECFinancialMetric[],
];

const financialStatementChoices = ["income", "balance-sheet", "cash-flow"] as const;
const frequencyChoices = ["annual", "quarterly"] as const;
const intervalChoices = ["daily", "weekly", "monthly"] as const;

const globalHelpOptions: readonly CliHelpOption[] = [
  { flags: "-u, --user-agent <ua>", description: "SEC User-Agent. Defaults to EDGAR_KIT_USER_AGENT." },
  { flags: "--max-rps <n>", description: "Client-side SEC request limit. Defaults to 10." },
  { flags: "--disable-rate-limit", description: "Disable the SDK request rate limiter." },
  { flags: "--share-price-provider-command <cmd>", description: "Provider command for share-price methods." },
];

const builtinHelpOptions: readonly CliHelpOption[] = [
  { flags: "-h, --help", description: "Show help for a command." },
  { flags: "--version", description: "Print the CLI version." },
];

const helpOptions = {
  cik: { flags: "--cik <cik>", description: "Company CIK. Use exactly one of --ticker or --cik." },
  endDate: { flags: "--end-date <yyyy-mm-dd>", description: "End date." },
  form: { flags: "-f, --form <form>", description: "Filing form. Repeat or pass a comma-separated list." },
  frequency: {
    flags: "--frequency <annual|quarterly>",
    description: "Financial period frequency. Defaults to annual.",
  },
  includeHistory: { flags: "--include-history", description: "Include older filing history when listing filings." },
  interval: { flags: "--interval <daily|weekly|monthly>", description: "Share-price interval. Defaults to daily." },
  limit: { flags: "--limit <n>", description: "Maximum number of records. Omit or pass 0 for no explicit limit." },
  metric: {
    flags: "--metric <metric>",
    description: `Financial metric (${financialMetricChoices.join(", ")}).`,
  },
  query: { flags: "-q, --query <text>", description: "Full text search query." },
  startDate: { flags: "--start-date <yyyy-mm-dd>", description: "Start date." },
  statement: { flags: "--statement <income|balance-sheet|cash-flow>", description: "Financial statement." },
  ticker: { flags: "-t, --ticker <ticker>", description: "Ticker symbol." },
  tickerIdentity: {
    flags: "-t, --ticker <ticker>",
    description: "Ticker symbol. Use exactly one of --ticker or --cik.",
  },
} satisfies Record<string, CliHelpOption>;

const identityHelpOptions = [helpOptions.tickerIdentity, helpOptions.cik] as const;
const dateFilterHelpOptions = [helpOptions.startDate, helpOptions.endDate, helpOptions.limit] as const;
const filingFilterHelpOptions = [
  ...identityHelpOptions,
  helpOptions.form,
  helpOptions.startDate,
  helpOptions.endDate,
  helpOptions.includeHistory,
  helpOptions.limit,
] as const;
const filingSearchHelpOptions = [
  helpOptions.query,
  ...identityHelpOptions,
  helpOptions.form,
  helpOptions.startDate,
  helpOptions.endDate,
  helpOptions.limit,
] as const;
const financialCommonHelpOptions = [...identityHelpOptions, helpOptions.frequency, ...dateFilterHelpOptions] as const;

const helpTree = {
  companies: {
    description: "Company identity and metadata.",
    commands: {
      "by-ticker": {
        description: "Look up company metadata by ticker.",
        options: [helpOptions.ticker],
      },
    },
  },
  filings: {
    description: "Company filing discovery.",
    commands: {
      list: {
        description: "List normalized filings for one company.",
        options: filingFilterHelpOptions,
      },
      search: {
        description: "Search EDGAR filings, optionally scoped to one company.",
        options: filingSearchHelpOptions,
      },
    },
  },
  financials: {
    description: "Normalized company financials.",
    commands: {
      company: {
        description: "Fetch normalized company financial periods.",
        options: [...financialCommonHelpOptions, helpOptions.metric],
      },
      statement: {
        description: "Fetch one normalized financial statement.",
        options: [...financialCommonHelpOptions, helpOptions.statement],
      },
      metric: {
        description: "Fetch one normalized financial metric over time.",
        options: [...financialCommonHelpOptions, helpOptions.metric],
      },
    },
  },
  "share-prices": {
    description: "Share price provider adapter methods.",
    commands: {
      history: {
        description: "Fetch historical prices from the configured provider command.",
        options: [...identityHelpOptions, helpOptions.startDate, helpOptions.endDate, helpOptions.interval],
      },
      latest: {
        description: "Fetch the latest price from the configured provider command.",
        options: identityHelpOptions,
      },
    },
  },
} satisfies Record<string, CliHelpGroup>;

const commonOptions = {
  userAgent: Options.text("user-agent").pipe(
    Options.withAlias("u"),
    Options.withDescription("SEC request User-Agent. Defaults to EDGAR_KIT_USER_AGENT when omitted."),
    Options.withDefault(""),
  ),
  maxRps: Options.integer("max-rps").pipe(
    Options.withDescription("Client-side SEC request limit. Defaults to 10."),
    Options.withDefault(10),
  ),
  disableRateLimit: Options.boolean("disable-rate-limit").pipe(
    Options.withDescription("Disable the SDK request rate limiter."),
  ),
  sharePriceProviderCommand: Options.text("share-price-provider-command").pipe(
    Options.withDescription(
      "Command used by share-price methods. It receives resolved provider input on stdin and must print JSON bars.",
    ),
    Options.withDefault(""),
  ),
};

const tickerOption = Options.text("ticker").pipe(Options.withAlias("t"), Options.withDescription("Ticker symbol."));
const optionalTickerOption = Options.text("ticker").pipe(
  Options.withAlias("t"),
  Options.withDescription("Ticker symbol. Use exactly one of --ticker or --cik."),
  Options.withDefault(""),
);
const optionalCikOption = Options.text("cik").pipe(
  Options.withDescription("Company CIK. Use exactly one of --ticker or --cik."),
  Options.withDefault(""),
);
const startDateOption = Options.text("start-date").pipe(
  Options.withDescription("Start date in YYYY-MM-DD format."),
  Options.withDefault(""),
);
const endDateOption = Options.text("end-date").pipe(
  Options.withDescription("End date in YYYY-MM-DD format."),
  Options.withDefault(""),
);
const limitOption = Options.integer("limit").pipe(
  Options.withDescription("Maximum number of records. Omit or pass 0 for no explicit limit."),
  Options.withDefault(0),
);
const formsOption = Options.text("form").pipe(
  Options.withAlias("f"),
  Options.withDescription("Filing form. Repeat or pass a comma-separated list."),
  Options.repeated,
);

const commandGroup = (name: string, description: string, subcommands: [AnyCommand, ...AnyCommand[]]): AnyCommand =>
  Command.make(name).pipe(Command.withDescription(description), Command.withSubcommands(subcommands)) as AnyCommand;

const maybePrintCustomHelp = (args: readonly string[]): boolean => {
  if (!args.some((arg) => arg === "--help" || arg === "-h")) {
    return false;
  }

  process.stdout.write(renderHelp(commandPathFromHelpArgs(args)));
  return true;
};

const commandPathFromHelpArgs = (args: readonly string[]): string[] => {
  const path: string[] = [];

  for (const arg of args) {
    if (arg === "--help" || arg === "-h") {
      continue;
    }

    if (arg.startsWith("-")) {
      break;
    }

    path.push(arg);

    if (path.length === 2) {
      break;
    }
  }

  return path;
};

const renderHelp = (path: readonly string[]): string => {
  const [groupName, commandName] = path;

  if (!groupName) {
    return renderRootHelp();
  }

  const group = (helpTree as Record<string, CliHelpGroup>)[groupName];

  if (!group) {
    return `${renderRootHelp()}\nUnknown command group: ${groupName}\n`;
  }

  if (!commandName) {
    return renderGroupHelp(groupName, group);
  }

  const command = group.commands[commandName];

  if (!command) {
    return `${renderGroupHelp(groupName, group)}\nUnknown command: ${groupName} ${commandName}\n`;
  }

  return renderCommandHelp(groupName, commandName, command);
};

const renderRootHelp = (): string => {
  const lines = [
    `edgar-kit ${packageJson.version}`,
    "",
    "Focused CLI for understanding company filings, financials, and share-price provider data.",
    "",
    "Usage:",
    "  edgar-kit <command> [options]",
    "",
    "Commands:",
  ];

  for (const [groupName, group] of Object.entries(helpTree)) {
    lines.push(...formatHelpRows([[groupName, group.description]], 2));

    for (const [commandName, command] of Object.entries(group.commands)) {
      lines.push(...formatHelpRows([[`${groupName} ${commandName}`, command.description]], 4));
    }
  }

  lines.push(
    "",
    "Options:",
    ...formatOptionHelp(builtinHelpOptions, 2),
    "",
    "Run `edgar-kit <command> --help` for command-specific options.",
  );

  return `${lines.join("\n")}\n`;
};

const renderGroupHelp = (groupName: string, group: CliHelpGroup): string => {
  const lines = [
    `edgar-kit ${groupName}`,
    "",
    group.description,
    "",
    "Usage:",
    `  edgar-kit ${groupName} <command> [options]`,
    "",
    "Commands:",
    ...formatHelpRows(
      Object.entries(group.commands).map(([name, command]) => [name, command.description]),
      2,
    ),
    "",
    "Options:",
    ...formatOptionHelp(builtinHelpOptions, 2),
    "",
    `Run \`edgar-kit ${groupName} <command> --help\` for command-specific options.`,
  ];

  return `${lines.join("\n")}\n`;
};

const renderCommandHelp = (groupName: string, commandName: string, command: CliHelpCommand): string => {
  const commandOptions = command.options ?? [];
  const lines = [
    `edgar-kit ${groupName} ${commandName}`,
    "",
    command.description,
    "",
    "Usage:",
    `  edgar-kit ${groupName} ${commandName} [options]`,
  ];

  if (commandOptions.length > 0) {
    lines.push("", "Command options:", ...formatOptionHelp(commandOptions, 2));
  }

  lines.push(
    "",
    "Global options:",
    ...formatOptionHelp(globalHelpOptions, 2),
    "",
    "Other options:",
    ...formatOptionHelp(builtinHelpOptions, 2),
  );

  return `${lines.join("\n")}\n`;
};

const formatOptionHelp = (options: readonly CliHelpOption[], indent: number): string[] =>
  formatHelpRows(
    options.map((option) => [option.flags, option.description]),
    indent,
  );

const formatHelpRows = (rows: readonly (readonly [string, string])[], indent: number): string[] => {
  const leftWidth = Math.min(Math.max(...rows.map(([left]) => left.length), 0), 34);
  const prefix = " ".repeat(indent);
  const continuationPrefix = " ".repeat(indent + 2);
  const descriptionWidth = Math.max(48, 100 - indent - leftWidth - 2);
  const lines: string[] = [];

  for (const [left, description] of rows) {
    const wrappedDescription = wrapWords(description, descriptionWidth);

    if (left.length > leftWidth) {
      lines.push(`${prefix}${left}`);
      lines.push(...wrappedDescription.map((line) => `${continuationPrefix}${line}`));
      continue;
    }

    const [firstLine = "", ...rest] = wrappedDescription;
    lines.push(`${prefix}${left.padEnd(leftWidth)}  ${firstLine}`);
    lines.push(...rest.map((line) => `${prefix}${" ".repeat(leftWidth)}  ${line}`));
  }

  return lines;
};

const wrapWords = (text: string, width: number): string[] => {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (!current) {
      current = word;
      continue;
    }

    if (`${current} ${word}`.length > width) {
      lines.push(current);
      current = word;
      continue;
    }

    current = `${current} ${word}`;
  }

  if (current) {
    lines.push(current);
  }

  return lines.length > 0 ? lines : [""];
};

const printJson = async (value: unknown): Promise<void> => {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
};

const handle = <A>(operation: () => Promise<A>, output: (value: A) => Promise<void>): Effect.Effect<void> =>
  Effect.tryPromise({
    try: operation,
    catch: (error) => error,
  }).pipe(
    Effect.flatMap((value) =>
      Effect.tryPromise({
        try: () => output(value),
        catch: (error) => error,
      }),
    ),
    Effect.catchAll((error) =>
      Effect.sync(() => {
        process.stderr.write(`${formatCliError(error)}\n`);
        process.exitCode = 1;
      }),
    ),
  );

const runClientEffect = <A>(
  options: CommonCliOptions,
  effect: (client: SECClient) => Effect.Effect<A, unknown, never>,
): Effect.Effect<void> =>
  handle(async () => {
    const client = createClient(options);
    return await client.run(effect(client));
  }, printJson);

const runClientPromise = <A>(
  options: CommonCliOptions,
  operation: (client: SECClient) => Promise<A>,
): Effect.Effect<void> =>
  handle(async () => {
    const client = createClient(options);
    return await operation(client);
  }, printJson);

const createClient = (options: CommonCliOptions): SECClient => {
  const userAgent = options.userAgent.trim() || process.env.EDGAR_KIT_USER_AGENT?.trim();
  const sharePriceProviderCommand =
    options.sharePriceProviderCommand.trim() || process.env.EDGAR_KIT_SHARE_PRICE_PROVIDER_COMMAND?.trim();

  if (!userAgent) {
    throw new TypeError("SEC User-Agent is required. Pass --user-agent or set EDGAR_KIT_USER_AGENT.");
  }

  if (!options.disableRateLimit && (!Number.isInteger(options.maxRps) || options.maxRps < 1)) {
    throw new TypeError("--max-rps must be a positive integer.");
  }

  return new SECClient({
    userAgent,
    maxRps: options.disableRateLimit ? null : options.maxRps,
    sharePriceProvider: sharePriceProviderCommand
      ? createCommandSharePriceProvider(sharePriceProviderCommand)
      : undefined,
  });
};

const createCommandSharePriceProvider = (command: string): SECSharePriceProvider => ({
  historicalPrices: async (input) => {
    const stdout = await runProviderCommand(command, input);
    const parsed = JSON.parse(stdout) as unknown;

    if (!Array.isArray(parsed)) {
      throw new TypeError("Share price provider command must print a JSON array.");
    }

    return parsed;
  },
});

const runProviderCommand = (command: string, input: unknown): Promise<string> =>
  new Promise((resolve, reject) => {
    const child = spawn(command, {
      shell: true,
      stdio: ["pipe", "pipe", "pipe"],
    });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];

    child.stdout.on("data", (chunk: Buffer) => stdout.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve(Buffer.concat(stdout).toString("utf8"));
        return;
      }

      reject(
        new Error(
          `Share price provider command exited with code ${code ?? "unknown"}${
            stderr.length ? `: ${Buffer.concat(stderr).toString("utf8").trim()}` : ""
          }`,
        ),
      );
    });

    child.stdin.end(JSON.stringify(input));
  });

const formatCliError = (error: unknown): string => {
  if (isSECClientError(error)) {
    return formatSECClientError(error);
  }

  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }

  if (typeof error === "string") {
    return error;
  }

  return JSON.stringify(error, null, 2);
};

const formatSECClientError = (error: SECClientError): string => {
  const lines = [`${error._tag}: ${error.message}`];

  if ("status" in error && error.status !== undefined) {
    lines.push(`Status: ${error.status}${error.statusText ? ` ${error.statusText}` : ""}`);
  }

  if ("url" in error) {
    lines.push(`URL: ${error.url}`);
  }

  if ("input" in error && error.input !== undefined) {
    lines.push(`Input: ${safeJson(error.input)}`);
  }

  if ("responseBody" in error && error.responseBody) {
    lines.push(`Response: ${error.responseBody}`);
  }

  if ("cause" in error && error.cause !== undefined) {
    lines.push(`Cause: ${formatCliError(error.cause)}`);
  }

  return lines.join("\n");
};

const safeJson = (value: unknown): string => {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const cleanInput = <T extends Record<string, unknown>>(input: T): T => {
  const output: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) {
      continue;
    }

    output[key] = value;
  }

  return output as T;
};

const splitList = (values: readonly string[]): string[] | undefined => {
  const items = values
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
  return items.length > 0 ? items : undefined;
};

const optionalLimit = (limit: number): number | undefined => {
  if (limit === 0) {
    return undefined;
  }

  if (!Number.isInteger(limit) || limit < 0) {
    throw new TypeError("--limit must be a non-negative integer.");
  }

  return limit;
};

const requiredCompanyIdentityInput = (input: {
  readonly ticker: string;
  readonly cik: string;
}): { ticker: string } | { cik: string } => {
  const identity = optionalCompanyIdentityInput(input);

  if (!identity) {
    throw new TypeError("Pass exactly one of --ticker or --cik.");
  }

  return identity;
};

const optionalCompanyIdentityInput = (input: {
  readonly ticker: string;
  readonly cik: string;
}): { ticker: string } | { cik: string } | undefined => {
  const ticker = input.ticker.trim();
  const cik = input.cik.trim();

  if (ticker && cik) {
    throw new TypeError("Pass only one of --ticker or --cik.");
  }

  if (ticker) {
    return { ticker };
  }

  if (cik) {
    return { cik };
  }

  return undefined;
};

const filingsFilterInput = (options: {
  readonly forms: readonly string[];
  readonly startDate: string;
  readonly endDate: string;
  readonly includeHistory: boolean;
  readonly limit: number;
}): Record<string, unknown> =>
  cleanInput({
    forms: splitList(options.forms),
    startDate: options.startDate,
    endDate: options.endDate,
    includeAdditionalFiles: options.includeHistory,
    limit: optionalLimit(options.limit),
  });

const financialsQueryInput = (options: {
  readonly frequency: SECFinancialFrequency;
  readonly startDate: string;
  readonly endDate: string;
  readonly limit: number;
}): Record<string, unknown> =>
  cleanInput({
    frequency: options.frequency,
    startDate: options.startDate,
    endDate: options.endDate,
    limit: optionalLimit(options.limit),
  });

const resolveCiksFilter = async (
  client: SECClient,
  identity: { ticker: string } | { cik: string } | undefined,
): Promise<string | undefined> => {
  if (!identity) {
    return undefined;
  }

  if ("cik" in identity) {
    return identity.cik;
  }

  const company = await client.run(client.companies.byTicker(identity.ticker));

  if (!company) {
    throw new TypeError(`SEC ticker was not found: ${identity.ticker}`);
  }

  return String(company.cik_str);
};

const companiesCommands = commandGroup("companies", "Company identity and metadata.", [
  Command.make("by-ticker", { ...commonOptions, ticker: tickerOption }, (options) =>
    runClientEffect(options, (client) => client.companies.byTicker(options.ticker)),
  ).pipe(Command.withDescription("Look up company metadata by ticker.")) as AnyCommand,
]);

const filingsCommands = commandGroup("filings", "Company filing discovery.", [
  Command.make(
    "list",
    {
      ...commonOptions,
      ticker: optionalTickerOption,
      cik: optionalCikOption,
      forms: formsOption,
      startDate: startDateOption,
      endDate: endDateOption,
      includeHistory: Options.boolean("include-history").pipe(
        Options.withDescription("Include older filing history when listing filings."),
      ),
      limit: limitOption,
    },
    (options) =>
      runClientEffect(options, (client) => {
        const identity = requiredCompanyIdentityInput(options);
        const filters = filingsFilterInput(options);

        if ("ticker" in identity) {
          return client.companies.filingsByTicker({
            ticker: identity.ticker,
            ...filters,
          });
        }

        return client.submissions.listFilings({
          cik: identity.cik,
          ...filters,
        });
      }),
  ).pipe(Command.withDescription("List normalized filings for one company.")) as AnyCommand,
  Command.make(
    "search",
    {
      ...commonOptions,
      query: Options.text("query").pipe(Options.withAlias("q"), Options.withDefault("")),
      ticker: optionalTickerOption,
      cik: optionalCikOption,
      forms: formsOption,
      startDate: startDateOption,
      endDate: endDateOption,
      limit: limitOption,
    },
    (options) =>
      runClientPromise(options, async (client) => {
        const identity = optionalCompanyIdentityInput(options);
        const limit = optionalLimit(options.limit);
        const ciks = await resolveCiksFilter(client, identity);
        const results = await client.run(
          client.search.filingResults(
            cleanInput({
              query: options.query,
              ciks,
              forms: splitList(options.forms),
              startDate: options.startDate,
              endDate: options.endDate,
            }) as SearchFilingsInput,
          ),
        );

        return limit === undefined ? results : results.slice(0, limit);
      }),
  ).pipe(Command.withDescription("Search EDGAR filings, optionally scoped to one company.")) as AnyCommand,
]);

const financialCommonOptions = {
  ...commonOptions,
  ticker: optionalTickerOption,
  cik: optionalCikOption,
  frequency: Options.choice("frequency", frequencyChoices).pipe(Options.withDefault("annual")),
  startDate: startDateOption,
  endDate: endDateOption,
  limit: limitOption,
};

const financialsCommands = commandGroup("financials", "Normalized company financials.", [
  Command.make(
    "company",
    {
      ...financialCommonOptions,
      metrics: Options.choice("metric", financialMetricChoices).pipe(
        Options.withDescription("Financial metric. Repeat to select multiple metrics."),
        Options.repeated,
      ),
    },
    (options) =>
      runClientPromise(options, (client) =>
        client.financials.company(
          cleanInput({
            ...requiredCompanyIdentityInput(options),
            ...financialsQueryInput(options),
            metrics: options.metrics.length > 0 ? options.metrics : undefined,
          }),
        ),
      ),
  ).pipe(Command.withDescription("Fetch normalized company financial periods.")) as AnyCommand,
  Command.make(
    "statement",
    {
      ...financialCommonOptions,
      statement: Options.choice("statement", financialStatementChoices),
    },
    (options) =>
      runClientPromise(options, (client) =>
        client.financials.statement(
          cleanInput({
            ...requiredCompanyIdentityInput(options),
            ...financialsQueryInput(options),
            statement: options.statement as SECFinancialStatement,
          }),
        ),
      ),
  ).pipe(Command.withDescription("Fetch one normalized financial statement.")) as AnyCommand,
  Command.make(
    "metric",
    {
      ...financialCommonOptions,
      metric: Options.choice("metric", financialMetricChoices),
    },
    (options) =>
      runClientPromise(options, (client) =>
        client.financials.metric(
          cleanInput({
            ...requiredCompanyIdentityInput(options),
            ...financialsQueryInput(options),
            metric: options.metric,
          }),
        ),
      ),
  ).pipe(Command.withDescription("Fetch one normalized financial metric over time.")) as AnyCommand,
]);

const sharePricesCommands = commandGroup("share-prices", "Share price provider adapter methods.", [
  Command.make(
    "history",
    {
      ...commonOptions,
      ticker: optionalTickerOption,
      cik: optionalCikOption,
      startDate: startDateOption,
      endDate: endDateOption,
      interval: Options.choice("interval", intervalChoices).pipe(Options.withDefault("daily")),
    },
    (options) =>
      runClientPromise(options, (client) =>
        client.sharePrices.history(
          cleanInput({
            ...requiredCompanyIdentityInput(options),
            startDate: options.startDate,
            endDate: options.endDate,
            interval: options.interval,
          }),
        ),
      ),
  ).pipe(Command.withDescription("Fetch historical prices from the configured provider command.")) as AnyCommand,
  Command.make(
    "latest",
    {
      ...commonOptions,
      ticker: optionalTickerOption,
      cik: optionalCikOption,
    },
    (options) =>
      runClientPromise(options, (client) =>
        client.sharePrices.latest(cleanInput(requiredCompanyIdentityInput(options))),
      ),
  ).pipe(Command.withDescription("Fetch the latest price from the configured provider command.")) as AnyCommand,
]);

const rootCommand = commandGroup("edgar-kit", packageJson.description, [
  companiesCommands,
  filingsCommands,
  financialsCommands,
  sharePricesCommands,
]);

if (maybePrintCustomHelp(process.argv.slice(2))) {
  process.exit(0);
}

const run = Command.run(rootCommand, {
  name: "edgar-kit",
  version: packageJson.version,
  executable: "edgar-kit",
});

NodeRuntime.runMain(run(process.argv).pipe(Effect.provide(NodeContext.layer)));

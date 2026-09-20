import { test, expect, type APIRequestContext } from "@playwright/test";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const settingsBeforeInstall = '{"alwaysThinkingEnabled": true}';
const aliasLine = "alias martin='claude --agent martin'";

interface Machine {
  home: string;
  bin: string;
  settingsPath: string;
  backupPath: string;
  profilePath: string;
}

interface InstallRun {
  status: number | null;
  stdout: string;
  stderr: string;
}

function putOnPath(machine: Machine, name: string, script: string): void {
  const path = join(machine.bin, name);
  writeFileSync(path, `#!/bin/sh\n${script}\n`);
  chmodSync(path, 0o755);
}

function putClaudeOnPath(machine: Machine, version: string): void {
  putOnPath(
    machine,
    "claude",
    `if [ "$1" = "--version" ]; then echo "${version} (Claude Code)"; fi`,
  );
}

function machineWithSettings(): Machine {
  const home = mkdtempSync(join(tmpdir(), "martin-install-"));
  const bin = join(home, "bin");
  mkdirSync(bin);
  mkdirSync(join(home, ".claude"));
  const settingsPath = join(home, ".claude", "settings.json");
  writeFileSync(settingsPath, settingsBeforeInstall);
  return {
    home,
    bin,
    settingsPath,
    backupPath: `${settingsPath}.before-martin`,
    profilePath: join(home, ".zshrc"),
  };
}

async function runInstallScript(
  request: APIRequestContext,
  machine: Machine,
  apiKey?: string,
): Promise<InstallRun> {
  const script = await (await request.get("/install.sh")).text();
  const run = spawnSync("bash", {
    input: script,
    encoding: "utf8",
    env: {
      HOME: machine.home,
      SHELL: "/bin/zsh",
      PATH: `${machine.bin}:/usr/bin:/bin`,
      ...(apiKey === undefined ? {} : { MARTIN_API_KEY: apiKey }),
    },
  });
  return { status: run.status, stdout: run.stdout, stderr: run.stderr };
}

function aliasCount(machine: Machine): number {
  return readFileSync(machine.profilePath, "utf8").split(aliasLine).length - 1;
}

test.describe("with a working key", () => {
  let machine: Machine;

  test.beforeEach(() => {
    machine = machineWithSettings();
    putClaudeOnPath(machine, "2.1.278");
    putOnPath(machine, "curl", "exit 0");
  });

  test("the install script installs the plugin", async ({ request }) => {
    const run = await runInstallScript(request, machine, "martin_working");

    expect(run.stdout).toContain("Installing martin plugin...");
    expect(run.stdout).toContain(
      'Done! You are now ready to use Martin in Claude Code:\n\nclaude --agent martin "Introduce yourself and describe your capabilities"',
    );
    expect(run.stdout).toContain(
      "TIP: `martin` alias added to ~/.zshrc. Reload your current shell to use",
    );
    expect(run.status).toBe(0);
    expect(aliasCount(machine)).toBe(1);

    const settings = JSON.parse(readFileSync(machine.settingsPath, "utf8"));
    expect(settings.extraKnownMarketplaces.martin.source).toEqual({
      source: "url",
      url: "https://api.trymartin.dev/marketplace.json",
      headers: { Authorization: "Bearer martin_working" },
    });
  });

  test("running the install script a second time changes nothing", async ({
    request,
  }) => {
    await runInstallScript(request, machine, "martin_working");
    const settingsAfterFirstRun = readFileSync(machine.settingsPath, "utf8");

    const secondRun = await runInstallScript(
      request,
      machine,
      "martin_working",
    );

    expect(secondRun.stdout).toContain(
      "Done! You are now ready to use Martin in Claude Code:",
    );
    expect(secondRun.stdout).not.toContain("TIP:");
    expect(aliasCount(machine)).toBe(1);
    expect(readFileSync(machine.settingsPath, "utf8")).toBe(
      settingsAfterFirstRun,
    );
  });

  test("my other Claude Code settings survive the install", async ({
    request,
  }) => {
    await runInstallScript(request, machine, "martin_working");

    const settings = JSON.parse(readFileSync(machine.settingsPath, "utf8"));
    expect(settings.alwaysThinkingEnabled).toBe(true);
  });

  test("my settings from before the install are kept", async ({ request }) => {
    const firstRun = await runInstallScript(request, machine, "martin_working");

    expect(firstRun.stdout).toContain(
      "Backed up ~/.claude/settings.json to ~/.claude/settings.json.before-martin",
    );
    expect(readFileSync(machine.backupPath, "utf8")).toBe(
      settingsBeforeInstall,
    );

    const secondRun = await runInstallScript(
      request,
      machine,
      "martin_working",
    );

    expect(secondRun.stdout).not.toContain("Backed up");
    expect(readFileSync(machine.backupPath, "utf8")).toBe(
      settingsBeforeInstall,
    );
  });
});

test.describe("the install script stops with a reason", () => {
  const situations = [
    {
      situation: "MARTIN_API_KEY is not set",
      apiKey: undefined,
      prepare: (machine: Machine) => putClaudeOnPath(machine, "2.1.278"),
      message:
        "error: MARTIN_API_KEY is not set. Your key is in the email from support@trymartin.dev.",
    },
    {
      situation: "MARTIN_API_KEY is 12345",
      apiKey: "12345",
      prepare: (machine: Machine) => putClaudeOnPath(machine, "2.1.278"),
      message:
        "error: that API key was not accepted. Recopy it from the email from support@trymartin.dev.",
    },
    {
      situation: "claude is not on my PATH",
      apiKey: "martin_working",
      prepare: () => {},
      message:
        "error: Claude Code is required to install martin. Get it at https://claude.com/claude-code",
    },
    {
      situation: "perl cannot load JSON::PP",
      apiKey: "martin_working",
      prepare: (machine: Machine) => {
        putClaudeOnPath(machine, "2.1.278");
        putOnPath(machine, "perl", "exit 1");
      },
      message: "error: perl with JSON::PP is required to install martin",
    },
    {
      situation: "my Claude Code version is 2.1.200",
      apiKey: "martin_working",
      prepare: (machine: Machine) => putClaudeOnPath(machine, "2.1.200"),
      message:
        "error: martin needs Claude Code 2.1.238 or newer; you have 2.1.200. Run `claude update`.",
    },
  ];

  for (const { situation, apiKey, prepare, message } of situations) {
    test(situation, async ({ request }) => {
      const machine = machineWithSettings();
      prepare(machine);

      const run = await runInstallScript(request, machine, apiKey);

      expect(run.stderr).toContain(message);
      expect(run.status).toBe(1);
      expect(readFileSync(machine.settingsPath, "utf8")).toBe(
        settingsBeforeInstall,
      );
      expect(existsSync(machine.backupPath)).toBe(false);
    });
  }
});

test("the instructions for agents are served", async ({ request }) => {
  const response = await request.get("/llms.txt");
  const instructions = await response.text();

  expect(response.status()).toBe(200);
  expect(instructions).toContain(
    "https://buy.stripe.com/cNi14mdE1eMY2sG3Zi7kc00",
  );
  expect(instructions).toContain(
    'curl -fsSL https://trymartin.dev/install.sh | MARTIN_API_KEY="$(cat ~/Downloads/martin-api-key.txt)" bash',
  );
  expect(instructions).toContain(
    "CRITICAL: DO **NOT** ask directly for the API key",
  );
});

test("an agent that asks for markdown is given the instructions for agents", async ({
  request,
}) => {
  const instructions = await (await request.get("/llms.txt")).text();

  const response = await request.get("/", {
    headers: { Accept: "text/markdown, text/html, */*" },
  });

  expect(await response.text()).toBe(instructions);
  expect(response.headers()["content-type"]).toBe(
    "text/markdown; charset=utf-8",
  );
  expect(response.headers()["vary"]).toContain("Accept");
});

test("a browser still gets the page", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "What happens after you pay" }),
  ).toBeVisible();
});

test("the footer points agents at the instructions", async ({ page }) => {
  await page.goto("/");

  const footer = page.getByRole("contentinfo");
  await footer.scrollIntoViewIfNeeded();

  await expect(
    footer.getByRole("link", { name: "Are you an agent? Read llms.txt" }),
  ).toHaveAttribute("href", "/llms.txt");
});

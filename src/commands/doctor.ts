import { Command } from "commander";
import { createLogger } from "../utils/logger.ts";
import { detectRuntime } from "../utils/runtime.ts";

interface DoctorCheck {
  name: string;
  required: boolean;
  passed: boolean;
  message: string;
}

async function checkRuntimeVersion(): Promise<DoctorCheck[]> {
  const checks: DoctorCheck[] = [];
  const currentRuntime = detectRuntime();

  // Deno checks
  if (currentRuntime === "deno") {
    try {
      const version = Deno.version.deno;
      const versionNum = version.split(".").map(Number).slice(0, 2); // Major.Minor
      const required = [1, 46]; // Deno >= 1.46 required

      const passed = (versionNum[0] > required[0]) ||
        (versionNum[0] === required[0] && versionNum[1] >= required[1]);

      checks.push({
        name: "Deno Runtime",
        required: true,
        passed,
        message: passed
          ? `✓ Deno ${version} (>=1.46)`
          : `✗ Deno ${version} (<1.46)\n   Please upgrade to Deno >=1.46`,
      });
    } catch {
      checks.push({
        name: "Deno Runtime",
        required: true,
        passed: false,
        message: "✗ Failed to check Deno version",
      });
    }
  }

  // Node checks (if available)
  try {
    const cmd = new Deno.Command("node", {
      args: ["--version"],
      stdout: "piped",
      stderr: "piped",
    });
    const process = await cmd.output();
    const nodeVersion = new TextDecoder().decode(process.stdout).trim();

    if (nodeVersion) {
      const version = nodeVersion.replace(/^v/, ""); // Remove 'v' prefix
      const versionNum = version.split(".").map(Number).slice(0, 2); // Major.Minor
      const required = [18]; // Node >= 18 required

      const passed = versionNum[0] >= required[0];

      checks.push({
        name: "Node Runtime",
        required: false,
        passed,
        message: passed
          ? `✓ Node ${version} (>=18)`
          : `✗ Node ${version} (<18)\n   Please upgrade to Node >=18 LTS`,
      });
    } else {
      checks.push({
        name: "Node Runtime",
        required: false,
        passed: false,
        message: "- Node not found",
      });
    }
  } catch {
    checks.push({
      name: "Node Runtime",
      required: false,
      passed: false,
      message: "- Node not available",
    });
  }

  // Bun checks (if available)
  try {
    const cmd = new Deno.Command("bun", {
      args: ["--version"],
      stdout: "piped",
      stderr: "piped",
    });
    const process = await cmd.output();
    const bunVersion = new TextDecoder().decode(process.stdout).trim();

    if (bunVersion) {
      const version = bunVersion.split(".").map(Number).slice(0, 3); // Major.Minor.Patch
      const required = [1, 1]; // Bun >= 1.1 required

      const passed = (version[0] > required[0]) ||
        (version[0] === required[0] && version[1] >= required[1]);

      checks.push({
        name: "Bun Runtime",
        required: false,
        passed,
        message: passed
          ? `✓ Bun ${bunVersion} (>=1.1)`
          : `✗ Bun ${bunVersion} (<1.1)\n   Please upgrade to Bun >=1.1`,
      });
    } else {
      checks.push({
        name: "Bun Runtime",
        required: false,
        passed: false,
        message: "- Bun not found",
      });
    }
  } catch {
    checks.push({
      name: "Bun Runtime",
      required: false,
      passed: false,
      message: "- Bun not available",
    });
  }

  return checks;
}

async function checkProjectConfig(): Promise<DoctorCheck[]> {
  const checks: DoctorCheck[] = [];

  // Check for deno.json
  try {
    await Deno.stat("deno.json");
    checks.push({
      name: "Deno Config",
      required: false,
      passed: true,
      message: "✓ deno.json found",
    });
  } catch {
    checks.push({
      name: "Deno Config",
      required: false,
      passed: false,
      message: "- deno.json not found",
    });
  }

  // Check for package.json
  try {
    await Deno.stat("package.json");
    checks.push({
      name: "Node Config",
      required: false,
      passed: true,
      message: "✓ package.json found",
    });
  } catch {
    checks.push({
      name: "Node Config",
      required: false,
      passed: false,
      message: "- package.json not found",
    });
  }

  return checks;
}

async function checkJsrNpmCompatibility(): Promise<DoctorCheck[]> {
  const checks: DoctorCheck[] = [];

  // Check internet connectivity by trying to fetch from JSR
  try {
    const response = await fetch("https://jsr.io");
    if (response.ok) {
      checks.push({
        name: "JSR Connectivity",
        required: true,
        passed: true,
        message: "✓ JSR registry accessible",
      });
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch {
    checks.push({
      name: "JSR Connectivity",
      required: true,
      passed: false,
      message: "✗ JSR registry not accessible\n   Check your internet connection",
    });
  }

  return checks;
}

export const doctorCommand = new Command("doctor")
  .description("Check environment and dependencies")
  .action(async () => {
    const logger = createLogger();

    logger.info("Performing environment checks...\n");

    const runtimeChecks = await checkRuntimeVersion();
    const configChecks = await checkProjectConfig();
    const compatibilityChecks = await checkJsrNpmCompatibility();

    const allChecks = [...runtimeChecks, ...configChecks, ...compatibilityChecks];

    // Group checks by category
    console.log("🔧 Runtime Environment:");
    runtimeChecks.forEach((check) => console.log(`   ${check.message}`));

    console.log("\n📋 Project Configuration:");
    configChecks.forEach((check) => console.log(`   ${check.message}`));

    console.log("\n🌐 Network & Compatibility:");
    compatibilityChecks.forEach((check) => console.log(`   ${check.message}`));

    // Summary
    const failedRequired = allChecks.filter((check) => check.required && !check.passed);
    const failedOptional = allChecks.filter((check) => !check.required && !check.passed);

    console.log("\n📊 Summary:");

    if (failedRequired.length > 0) {
      console.log(`   ❌ ${failedRequired.length} critical issues found`);
    } else {
      console.log(`   ✅ All critical checks passed`);
    }

    if (failedOptional.length > 0) {
      console.log(`   ⚠️  ${failedOptional.length} optional warnings`);
    }

    // Exit with proper code
    if (failedRequired.length > 0) {
      logger.error("Environment check failed");
      Deno.exit(1);
    } else {
      logger.info("Environment check completed successfully");
    }
  });

import { confirm, select } from "@inquirer/prompts";

export interface MenuChoice<T extends string> {
  name: string;
  value: T;
}

export async function promptSelect<T extends string>(
  message: string,
  choices: Array<MenuChoice<T>>,
): Promise<T> {
  return select<T>({ message, choices });
}

export async function promptConfirmLaunch(): Promise<boolean> {
  return confirm({ message: "Launch Claude Code?", default: true });
}

export async function promptLauncherOptions() {
  return select({
    message: "Before launching Claude, what would you like to do?",
    choices: [
      {
        name: "🚀 Launch with recommended optimizations (Recommended)",
        value: "optimized",
      },
      {
        name: "👀 Review optimization details",
        value: "review",
      },
      {
        name: "⚡ Launch without optimization",
        value: "normal",
      },
      {
        name: "❌ Cancel",
        value: "cancel",
      },
    ],
  });
}

export async function promptOptimizationApply(): Promise<"yes" | "review" | "no"> {
  return select<"yes" | "review" | "no">({
    message: "Apply these optimizations?",
    choices: [
      { name: "Yes", value: "yes" },
      { name: "Review details", value: "review" },
      { name: "No", value: "no" },
    ],
  });
}

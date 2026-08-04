import { confirm, select } from '@inquirer/prompts';

export interface MenuChoice<T extends string> {
  name: string;
  value: T;
}

export async function promptSelect<T extends string>(message: string, choices: Array<MenuChoice<T>>): Promise<T> {
  return select<T>({ message, choices });
}

export async function promptConfirmLaunch(): Promise<boolean> {
  return confirm({ message: 'Launch Claude Code?', default: true });
}

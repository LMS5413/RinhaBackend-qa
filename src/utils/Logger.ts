import chalk from "chalk";

export class Logger {
    static info(message: string) {
        console.log(chalk.blue("[INFO] ") + message);
    }
    static warn(message: string) {
        console.log(chalk.yellow("[WARN] ") + message);
    }
    static error(message: string | unknown) {
        console.log(chalk.red("[ERROR] ") + message);
    }
    static debug(message: string) {
        console.log(chalk.green("[DEBUG] ") + message);
    }
}
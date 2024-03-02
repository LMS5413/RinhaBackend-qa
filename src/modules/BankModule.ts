import type { ICustomer } from "../interfaces/ICustomer";
import type { ITransaction } from "../interfaces/ITransactions";
import { Database } from "bun:sqlite";
import { readFileSync } from "fs";
import { cpus } from "os";


export class BankModule {

  sqlite = new Database(process.env.SQLITE_DIR);

  constructor() {

    const configSqlite = () => {
      return new Promise((resolve, reject) => {
        try {
          this.sqlite.exec("PRAGMA journal_mode = WAL;");
          this.sqlite.exec("PRAGMA busy_timeout = 30000;");
          this.sqlite.exec(`PRAGMA threads = ${cpus().length};`);
          this.sqlite.exec("PRAGMA auto_vacuum = FULL;");
          this.sqlite.exec("PRAGMA automatic_indexing = TRUE;");
          this.sqlite.exec("PRAGMA count_changes = FALSE;");
          this.sqlite.exec("PRAGMA encoding = \"UTF-8\";");
          this.sqlite.exec("PRAGMA ignore_check_constraints = TRUE;");
          this.sqlite.exec("PRAGMA incremental_vacuum = 0;");
          this.sqlite.exec("PRAGMA legacy_file_format = FALSE;");
          this.sqlite.exec("PRAGMA optimize;");
          this.sqlite.exec("PRAGMA synchronous = NORMAL;");
          this.sqlite.exec("PRAGMA temp_store = 2;");

          this.sqlite.exec(readFileSync("./config/schema.sql", "utf-8"));

          resolve(null);
        } catch (e) {
          configSqlite();
        }
      })
    }

    configSqlite();
  }

  getCustomer(id: number, includeTransaction: Boolean = true): ICustomer | null {
    const customerSchema = this.sqlite.prepare("SELECT limite,saldo FROM Clientes WHERE id = ?").get(id) as ICustomer | null;
    if (!customerSchema) return null;
    if (includeTransaction) {
      customerSchema.transacoes = this.sqlite.prepare("SELECT valor,tipo,descricao,realizada_em FROM Transacoes WHERE clienteId = ? ORDER BY id DESC LIMIT 10").all(id) as ITransaction[];
    }

    return customerSchema;
  }

  addTransaction(transaction: ITransaction) {
    this.sqlite.prepare("UPDATE Clientes SET saldo = saldo + ? WHERE id = ?").run(
      transaction.tipo === "d" ? transaction.valor * -1 : transaction.valor,
      transaction.cliente.id
    );
    this.sqlite.prepare("INSERT INTO Transacoes (valor, tipo, descricao, clienteId,realizada_em) VALUES (?, ?, ?, ?,?)").run(
      transaction.valor,
      transaction.tipo,
      transaction.descricao,
      transaction.cliente.id,
      new Date().toISOString()
    );
  }
}


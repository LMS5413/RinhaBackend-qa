import type { ICustomer } from "../interfaces/ICustomer";
import type { ITransaction } from "../interfaces/ITransactions";
import { Database } from "bun:sqlite";
import { readFileSync } from "fs";


export class BankModule {

  sqlite = new Database(process.env.SQLITE_DIR);

  constructor() {

    const configSqlite = () => {
      return new Promise((resolve, reject) => {
        try {
          this.sqlite.exec("PRAGMA journal_mode = WAL;");
          this.sqlite.exec("PRAGMA busy_timeout = 30000;");
          this.sqlite.exec("PRAGMA optimize;");
          this.sqlite.exec("PRAGMA synchronous = 1;");
          this.sqlite.exec("PRAGMA temp_store = 1;");

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


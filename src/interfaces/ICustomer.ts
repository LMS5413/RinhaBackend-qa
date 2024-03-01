import type { ITransaction } from "./ITransactions";

export interface ICustomer {
    saldo: number,
    limite: number,
    id: number,
    transacoes: ITransaction[]
}
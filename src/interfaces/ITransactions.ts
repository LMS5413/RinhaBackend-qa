import type { ICustomer } from "./ICustomer"

export interface ITransaction {
    valor: number,
    tipo: string,
    descricao: string,
    realizada_em: Date
    cliente: ICustomer
}
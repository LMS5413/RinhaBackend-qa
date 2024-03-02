import { BankModule } from "./modules/BankModule";

export class SuperServer {
  private static bancoModule = new BankModule();

  public async start() {

    const decoder = new TextDecoder();

    Bun.serve({
      port: parseInt(process.env.PORT ?? "3000"),
      async fetch(req) {
        const uri = new URL(req.url);
        if (uri.pathname.startsWith("/clientes")) {
          const id = parseInt(uri.pathname.split("/")[2])
          if (isNaN(id)) {
            return new Response(null, {
              status: 400
            })
          }

          if (uri.pathname.endsWith("/extrato")) {
            const clienteInfo = SuperServer.bancoModule.getCustomer(id);
            if (!clienteInfo) {
              return new Response(null, {
                status: 404
              })
            }

            return new Response(JSON.stringify({
              saldo: {
                total: clienteInfo.saldo,
                limite: clienteInfo.limite
              },
              ultimas_transacoes: clienteInfo.transacoes
            }), {
              status: 200,
              headers: {
                "Content-type": "application/json"
              }
            });
          }

          if (uri.pathname.endsWith("/transacoes") && req.method === "POST") {
            if (!req.body) {
              return new Response(null, {
                status: 422
              });
            }
            const { valor, tipo, descricao } = JSON.parse(decoder.decode((await req.body.getReader().read()).value))

            if (!valor || !tipo || !descricao) {
              return new Response(null, {
                status: 422
              });
            }

            const types = ["c", "d"];
            if (!types.includes(tipo)) {
              return new Response(null, {
                status: 422
              });
            }

            if (descricao.length > 10 || descricao.length <= 1) {
              return new Response(null, {
                status: 422
              });
            }

            if (!Number.isInteger(valor)) {
              return new Response(null, {
                status: 422
              });
            }

            if (valor < 0) {
              return new Response(null, {
                status: 422
              });
            }

            const clienteInfo = SuperServer.bancoModule.getCustomer(id, false);
            if (!clienteInfo) return new Response(null, {
              status: 404
            });

            if (tipo === "d" && clienteInfo.saldo - valor < clienteInfo.limite * -1) {
              return new Response(null, {
                status: 422
              });
            }

            clienteInfo.saldo += tipo === "d" ? -valor : valor;
            clienteInfo.id = id;

            SuperServer.bancoModule.addTransaction({
              cliente: clienteInfo,
              realizada_em: new Date(),
              tipo,
              valor,
              descricao
            });

            return new Response(JSON.stringify({
              limite: clienteInfo.limite,
              saldo: clienteInfo.saldo
            }), {
              status: 200,
              headers: {
                "Content-type": "application/json"
              }
            });
          }
        }

        return new Response(null, {
          status: 500
        });
      }
    });

  }
}

FROM oven/bun:1 as base
WORKDIR /usr/src/app

FROM base AS install
RUN mkdir -p /temp/prod
COPY package.json bun.lockb /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

FROM base AS prerelease
COPY --from=install /temp/prod/node_modules node_modules
COPY . .

RUN mkdir -p /usr/src/app/data
RUN chown -R bun:bun /usr/src/app

FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /usr/src/app/package.json .
COPY --from=prerelease /usr/src/app/index.ts .

USER bun

COPY --from=prerelease /usr/src/app .

ENTRYPOINT [ "bun", "run", "index.ts" ]
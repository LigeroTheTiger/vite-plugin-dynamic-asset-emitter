import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { Plugin, ResolvedConfig } from "vite";

export interface DynamicAsset {
  /** Path relative to Vite's build.outDir. */
  fileName: string;
  /** URL served by the development server. Defaults to /<fileName>. */
  devPath?: string;
  /** Evaluated for each development request and each build. */
  source: () => string | Uint8Array;
  /** Response Content-Type. Defaults to application/octet-stream. */
  contentType?: string;
}

export function dynamicAssetEmitter(assets: DynamicAsset[]): Plugin {
  let config: ResolvedConfig;

  const assetsByDevPath = new Map(
    assets.map((asset) => [
      `/${(asset.devPath ?? asset.fileName).replace(/^\/+/, "")}`,
      asset,
    ]),
  );

  return {
    name: "vite-plugin-dynamic-asset-emitter",
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = new URL(req.url ?? "/", "http://localhost").pathname;
        const asset = assetsByDevPath.get(pathname);
        if (!asset) return next();

        if (req.method === "HEAD") {
          res.setHeader(
            "Content-Type",
            asset.contentType ?? "application/octet-stream",
          );
          res.statusCode = 200;
          res.end();
          return;
        }

        Promise.resolve(asset.source())
          .then((data) => {
            res.setHeader(
              "Content-Type",
              asset.contentType ?? "application/octet-stream",
            );
            res.statusCode = 200;
            res.end(data);
          })
          .catch((error) => {
            console.error(error);
            next(error);
          });
      });
    },
    writeBundle() {
      for (const asset of assets) {
        const target = resolve(
          config.root,
          config.build.outDir,
          asset.fileName,
        );
        const outputDirectory = resolve(config.root, config.build.outDir);
        if (
          target !== outputDirectory &&
          !target.startsWith(outputDirectory + "/")
        ) {
          throw new Error(
            `Asset fileName must stay inside build.outDir: ${asset.fileName}`,
          );
        }
        mkdirSync(dirname(target), { recursive: true });
        writeFileSync(target, asset.source());
      }
    },
  };
}

export default dynamicAssetEmitter;

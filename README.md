# vite-plugin-dynamic-asset-emitter

A Vite plugin that serves generated files through the development server and writes them as standalone assets into `build.outDir` during a production build. Define each file's contents in your Vite config using a function that returns a string or binary data.

## Why this plugin exists

This plugin might be useful if you are integrating a Vite app into your backend and some frontend files also need to be available to the backend. Think configuration, general theming, localization and feature flag files.

During development, the backend can retrieve these files with a simple HTTP request to the Vite development server. Their contents are generated on demand. When the Vite project is built for production, each file is written as its own asset in the build output, ready for the backend to read or serve.

## Availability

This plugin is currently **not available on npm**. I wrote it to solve a very specific problem of my own, and I don't know if it might be useful to someone else. I'm open to fully publishing it in the future.

For now, use a local copy of the package. The example below assumes it is linked into your project under its package name.

## Example

```ts
import { defineConfig } from "vite";
import { dynamicAssetEmitter } from "vite-plugin-dynamic-asset-emitter";

const theme = {
  primaryColor: "#6366f1",
  fontFamily: "system-ui, sans-serif",
};

export default defineConfig({
  plugins: [
    dynamicAssetEmitter([
      {
        devPath: "/dynamic/theme.json",
        fileName: "static/theme.json",
        contentType: "application/json",
        source: () => JSON.stringify(theme),
      },
    ]),
  ],
});
```

In this example, the backend can request `/dynamic/theme.json` from the Vite development server. A production build writes the same theme data to `static/theme.json` inside `build.outDir`.

| Option        | Description                                                                                                                  |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `fileName`    | Required output path relative to `build.outDir`. Must stay inside that directory.                                            |
| `devPath`     | Development URL path. Defaults to `/<fileName>`.                                                                             |
| `source`      | Function returning a string or `Uint8Array`. Runs on each development request that returns file contents and once per build. |
| `contentType` | Development response's `Content-Type`. Defaults to `application/octet-stream`.                                               |

`HEAD` requests return headers without evaluating `source`. The plugin creates output directories as needed and writes files at the paths you specify, without adding content hashes.

## Development

A Nix development shell is provided for convenience. If you don't use Nix, you can ignore it and use your existing Node.js and npm setup.

### Interactive Vite playground

The small app in `examples/playground` imports this local plugin by package name.
It uses the repository's dependencies, so there is no second install. (This part of the package is AI generated, but reviewed)

```sh
npm install
npm run playground
```

Open the local URL printed by Vite. The page fetches three assets and displays
PASS/FAIL, HTTP status, content type, and returned data. Click **Fetch assets again**
to confirm that the JSON invocation count and timestamps change in development.

To test production output, stop the development server and run:

```sh
npm run playground:build
npm run playground:preview
```

Open the preview URL printed by Vite. All three checks should pass again, but
timestamps and invocation count should now stay fixed across requests. Generated
files are in `examples/playground/dist/generated/`.

| Asset  | Development URL          | Build / preview URL      |
| ------ | ------------------------ | ------------------------ |
| JSON   | `/dynamic/theme.json`    | `/generated/theme.json`  |
| Text   | `/generated/message.txt` | `/generated/message.txt` |
| Binary | `/generated/bytes.bin`   | `/generated/bytes.bin`   |

Edit `examples/playground/vite.config.js` to change the asset definitions. The
development server restarts on config changes. After changing plugin code in
`src/index.ts`, stop and rerun `npm run playground` to rebuild the local plugin.
For production, rerun the build and preview commands.

### Automated checks

Run `npm install` and `npm run build`. Vite is a peer dependency of the consuming project.

Run `npm test` to build the plugin and check development URLs, fresh responses,
binary data, build output, and the playground's production preview. Tests use
temporary output directories and Node's built-in test runner, so no extra test
dependency is needed. Add more cases in `test/plugin.test.js` using the same pattern.

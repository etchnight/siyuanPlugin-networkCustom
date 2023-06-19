// vite.config.ts
import { resolve } from "path";
import { defineConfig } from "file:///D:/project/0project_new/siyuanPlugin-networkCustom/node_modules/.pnpm/vite@4.3.7_@types+node@20.2.0_sass@1.62.1/node_modules/vite/dist/node/index.js";
import minimist from "file:///D:/project/0project_new/siyuanPlugin-networkCustom/node_modules/.pnpm/minimist@1.2.8/node_modules/minimist/index.js";
import { viteStaticCopy } from "file:///D:/project/0project_new/siyuanPlugin-networkCustom/node_modules/.pnpm/vite-plugin-static-copy@0.15.0_vite@4.3.7/node_modules/vite-plugin-static-copy/dist/index.js";
import livereload from "file:///D:/project/0project_new/siyuanPlugin-networkCustom/node_modules/.pnpm/rollup-plugin-livereload@2.0.5/node_modules/rollup-plugin-livereload/dist/index.cjs.js";
import { svelte } from "file:///D:/project/0project_new/siyuanPlugin-networkCustom/node_modules/.pnpm/@sveltejs+vite-plugin-svelte@2.0.3_svelte@3.57.0_vite@4.3.7/node_modules/@sveltejs/vite-plugin-svelte/dist/index.js";
import zipPack from "file:///D:/project/0project_new/siyuanPlugin-networkCustom/node_modules/.pnpm/vite-plugin-zip-pack@1.0.5_vite@4.3.7/node_modules/vite-plugin-zip-pack/dist/esm/index.mjs";
import fg from "file:///D:/project/0project_new/siyuanPlugin-networkCustom/node_modules/.pnpm/fast-glob@3.2.12/node_modules/fast-glob/out/index.js";
var __vite_injected_original_dirname = "D:\\project\\0project_new\\siyuanPlugin-networkCustom";
var args = minimist(process.argv.slice(2));
var isWatch = args.watch || args.w || false;
var devDistDir = "./dev";
var distDir = isWatch ? devDistDir : "./dist";
console.log("isWatch=>", isWatch);
console.log("distDir=>", distDir);
var vite_config_default = defineConfig({
  plugins: [
    svelte(),
    viteStaticCopy({
      targets: [
        {
          src: "./README*.md",
          dest: "./"
        },
        {
          src: "./icon.png",
          dest: "./"
        },
        {
          src: "./preview.png",
          dest: "./"
        },
        {
          src: "./plugin.json",
          dest: "./"
        },
        {
          src: "./src/i18n/**",
          dest: "./i18n/"
        }
      ]
    })
  ],
  // https://github.com/vitejs/vite/issues/1930
  // https://vitejs.dev/guide/env-and-mode.html#env-files
  // https://github.com/vitejs/vite/discussions/3058#discussioncomment-2115319
  // 在这里自定义变量
  define: {
    "process.env.DEV_MODE": `"${isWatch}"`
  },
  build: {
    // 输出路径
    outDir: distDir,
    emptyOutDir: false,
    // 构建后是否生成 source map 文件
    sourcemap: false,
    // 设置为 false 可以禁用最小化混淆
    // 或是用来指定是应用哪种混淆器
    // boolean | 'terser' | 'esbuild'
    // 不压缩，用于调试
    minify: !isWatch,
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__vite_injected_original_dirname, "src/index.ts"),
      // the proper extensions will be added
      fileName: "index",
      formats: ["cjs"]
    },
    rollupOptions: {
      plugins: [
        ...isWatch ? [
          livereload(devDistDir),
          {
            //监听静态资源文件
            name: "watch-external",
            async buildStart() {
              const files = await fg([
                "src/i18n/*.json",
                "./README*.md",
                "./plugin.json"
              ]);
              for (let file of files) {
                this.addWatchFile(file);
              }
            }
          }
        ] : [
          zipPack({
            inDir: "./dist",
            outDir: "./",
            outFileName: "package.zip"
          })
        ]
      ],
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ["siyuan", "process"],
      output: {
        entryFileNames: "[name].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === "style.css") {
            return "index.css";
          }
          return assetInfo.name;
        }
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxwcm9qZWN0XFxcXDBwcm9qZWN0X25ld1xcXFxzaXl1YW5QbHVnaW4tbmV0d29ya0N1c3RvbVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxccHJvamVjdFxcXFwwcHJvamVjdF9uZXdcXFxcc2l5dWFuUGx1Z2luLW5ldHdvcmtDdXN0b21cXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L3Byb2plY3QvMHByb2plY3RfbmV3L3NpeXVhblBsdWdpbi1uZXR3b3JrQ3VzdG9tL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gXCJwYXRoXCJcclxuaW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBsb2FkRW52IH0gZnJvbSBcInZpdGVcIlxyXG5pbXBvcnQgbWluaW1pc3QgZnJvbSBcIm1pbmltaXN0XCJcclxuaW1wb3J0IHsgdml0ZVN0YXRpY0NvcHkgfSBmcm9tIFwidml0ZS1wbHVnaW4tc3RhdGljLWNvcHlcIlxyXG5pbXBvcnQgbGl2ZXJlbG9hZCBmcm9tIFwicm9sbHVwLXBsdWdpbi1saXZlcmVsb2FkXCJcclxuaW1wb3J0IHsgc3ZlbHRlIH0gZnJvbSBcIkBzdmVsdGVqcy92aXRlLXBsdWdpbi1zdmVsdGVcIlxyXG5pbXBvcnQgemlwUGFjayBmcm9tIFwidml0ZS1wbHVnaW4temlwLXBhY2tcIjtcclxuaW1wb3J0IGZnIGZyb20gJ2Zhc3QtZ2xvYic7XHJcblxyXG5jb25zdCBhcmdzID0gbWluaW1pc3QocHJvY2Vzcy5hcmd2LnNsaWNlKDIpKVxyXG5jb25zdCBpc1dhdGNoID0gYXJncy53YXRjaCB8fCBhcmdzLncgfHwgZmFsc2VcclxuY29uc3QgZGV2RGlzdERpciA9IFwiLi9kZXZcIlxyXG5jb25zdCBkaXN0RGlyID0gaXNXYXRjaCA/IGRldkRpc3REaXIgOiBcIi4vZGlzdFwiXHJcblxyXG5jb25zb2xlLmxvZyhcImlzV2F0Y2g9PlwiLCBpc1dhdGNoKVxyXG5jb25zb2xlLmxvZyhcImRpc3REaXI9PlwiLCBkaXN0RGlyKVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICAgIHBsdWdpbnM6IFtcclxuICAgICAgICBzdmVsdGUoKSxcclxuXHJcbiAgICAgICAgdml0ZVN0YXRpY0NvcHkoe1xyXG4gICAgICAgICAgICB0YXJnZXRzOiBbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3JjOiBcIi4vUkVBRE1FKi5tZFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGRlc3Q6IFwiLi9cIixcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3JjOiBcIi4vaWNvbi5wbmdcIixcclxuICAgICAgICAgICAgICAgICAgICBkZXN0OiBcIi4vXCIsXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHNyYzogXCIuL3ByZXZpZXcucG5nXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgZGVzdDogXCIuL1wiLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBzcmM6IFwiLi9wbHVnaW4uanNvblwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGRlc3Q6IFwiLi9cIixcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3JjOiBcIi4vc3JjL2kxOG4vKipcIixcclxuICAgICAgICAgICAgICAgICAgICBkZXN0OiBcIi4vaTE4bi9cIixcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIF0sXHJcbiAgICAgICAgfSksXHJcbiAgICBdLFxyXG5cclxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS92aXRlanMvdml0ZS9pc3N1ZXMvMTkzMFxyXG4gICAgLy8gaHR0cHM6Ly92aXRlanMuZGV2L2d1aWRlL2Vudi1hbmQtbW9kZS5odG1sI2Vudi1maWxlc1xyXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3ZpdGVqcy92aXRlL2Rpc2N1c3Npb25zLzMwNTgjZGlzY3Vzc2lvbmNvbW1lbnQtMjExNTMxOVxyXG4gICAgLy8gXHU1NzI4XHU4RkQ5XHU5MUNDXHU4MUVBXHU1QjlBXHU0RTQ5XHU1M0Q4XHU5MUNGXHJcbiAgICBkZWZpbmU6IHtcclxuICAgICAgICBcInByb2Nlc3MuZW52LkRFVl9NT0RFXCI6IGBcIiR7aXNXYXRjaH1cImAsXHJcbiAgICB9LFxyXG5cclxuICAgIGJ1aWxkOiB7XHJcbiAgICAgICAgLy8gXHU4RjkzXHU1MUZBXHU4REVGXHU1Rjg0XHJcbiAgICAgICAgb3V0RGlyOiBkaXN0RGlyLFxyXG4gICAgICAgIGVtcHR5T3V0RGlyOiBmYWxzZSxcclxuXHJcbiAgICAgICAgLy8gXHU2Nzg0XHU1RUZBXHU1NDBFXHU2NjJGXHU1NDI2XHU3NTFGXHU2MjEwIHNvdXJjZSBtYXAgXHU2NTg3XHU0RUY2XHJcbiAgICAgICAgc291cmNlbWFwOiBmYWxzZSxcclxuXHJcbiAgICAgICAgLy8gXHU4QkJFXHU3RjZFXHU0RTNBIGZhbHNlIFx1NTNFRlx1NEVFNVx1Nzk4MVx1NzUyOFx1NjcwMFx1NUMwRlx1NTMxNlx1NkRGN1x1NkRDNlxyXG4gICAgICAgIC8vIFx1NjIxNlx1NjYyRlx1NzUyOFx1Njc2NVx1NjMwN1x1NUI5QVx1NjYyRlx1NUU5NFx1NzUyOFx1NTRFQVx1NzlDRFx1NkRGN1x1NkRDNlx1NTY2OFxyXG4gICAgICAgIC8vIGJvb2xlYW4gfCAndGVyc2VyJyB8ICdlc2J1aWxkJ1xyXG4gICAgICAgIC8vIFx1NEUwRFx1NTM4Qlx1N0YyOVx1RkYwQ1x1NzUyOFx1NEU4RVx1OEMwM1x1OEJENVxyXG4gICAgICAgIG1pbmlmeTogIWlzV2F0Y2gsXHJcblxyXG4gICAgICAgIGxpYjoge1xyXG4gICAgICAgICAgICAvLyBDb3VsZCBhbHNvIGJlIGEgZGljdGlvbmFyeSBvciBhcnJheSBvZiBtdWx0aXBsZSBlbnRyeSBwb2ludHNcclxuICAgICAgICAgICAgZW50cnk6IHJlc29sdmUoX19kaXJuYW1lLCBcInNyYy9pbmRleC50c1wiKSxcclxuICAgICAgICAgICAgLy8gdGhlIHByb3BlciBleHRlbnNpb25zIHdpbGwgYmUgYWRkZWRcclxuICAgICAgICAgICAgZmlsZU5hbWU6IFwiaW5kZXhcIixcclxuICAgICAgICAgICAgZm9ybWF0czogW1wiY2pzXCJdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICAgICAgICBwbHVnaW5zOiBbXHJcbiAgICAgICAgICAgICAgICAuLi4oXHJcbiAgICAgICAgICAgICAgICAgICAgaXNXYXRjaCA/IFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGl2ZXJlbG9hZChkZXZEaXN0RGlyKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cdTc2RDFcdTU0MkNcdTk3NTlcdTYwMDFcdThENDRcdTZFOTBcdTY1ODdcdTRFRjZcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6ICd3YXRjaC1leHRlcm5hbCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc3luYyBidWlsZFN0YXJ0KCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgZmcoW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnc3JjL2kxOG4vKi5qc29uJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJy4vUkVBRE1FKi5tZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICcuL3BsdWdpbi5qc29uJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGZpbGUgb2YgZmlsZXMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRXYXRjaEZpbGUoZmlsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgXSA6IFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgemlwUGFjayh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbkRpcjogJy4vZGlzdCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXREaXI6ICcuLycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXRGaWxlTmFtZTogJ3BhY2thZ2UuemlwJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgXSxcclxuXHJcbiAgICAgICAgICAgIC8vIG1ha2Ugc3VyZSB0byBleHRlcm5hbGl6ZSBkZXBzIHRoYXQgc2hvdWxkbid0IGJlIGJ1bmRsZWRcclxuICAgICAgICAgICAgLy8gaW50byB5b3VyIGxpYnJhcnlcclxuICAgICAgICAgICAgZXh0ZXJuYWw6IFtcInNpeXVhblwiLCBcInByb2Nlc3NcIl0sXHJcblxyXG4gICAgICAgICAgICBvdXRwdXQ6IHtcclxuICAgICAgICAgICAgICAgIGVudHJ5RmlsZU5hbWVzOiBcIltuYW1lXS5qc1wiLFxyXG4gICAgICAgICAgICAgICAgYXNzZXRGaWxlTmFtZXM6IChhc3NldEluZm8pID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYXNzZXRJbmZvLm5hbWUgPT09IFwic3R5bGUuY3NzXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiaW5kZXguY3NzXCJcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFzc2V0SW5mby5uYW1lXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICB9XHJcbn0pXHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBZ1YsU0FBUyxlQUFlO0FBQ3hXLFNBQVMsb0JBQTZCO0FBQ3RDLE9BQU8sY0FBYztBQUNyQixTQUFTLHNCQUFzQjtBQUMvQixPQUFPLGdCQUFnQjtBQUN2QixTQUFTLGNBQWM7QUFDdkIsT0FBTyxhQUFhO0FBQ3BCLE9BQU8sUUFBUTtBQVBmLElBQU0sbUNBQW1DO0FBU3pDLElBQU0sT0FBTyxTQUFTLFFBQVEsS0FBSyxNQUFNLENBQUMsQ0FBQztBQUMzQyxJQUFNLFVBQVUsS0FBSyxTQUFTLEtBQUssS0FBSztBQUN4QyxJQUFNLGFBQWE7QUFDbkIsSUFBTSxVQUFVLFVBQVUsYUFBYTtBQUV2QyxRQUFRLElBQUksYUFBYSxPQUFPO0FBQ2hDLFFBQVEsSUFBSSxhQUFhLE9BQU87QUFFaEMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDeEIsU0FBUztBQUFBLElBQ0wsT0FBTztBQUFBLElBRVAsZUFBZTtBQUFBLE1BQ1gsU0FBUztBQUFBLFFBQ0w7QUFBQSxVQUNJLEtBQUs7QUFBQSxVQUNMLE1BQU07QUFBQSxRQUNWO0FBQUEsUUFDQTtBQUFBLFVBQ0ksS0FBSztBQUFBLFVBQ0wsTUFBTTtBQUFBLFFBQ1Y7QUFBQSxRQUNBO0FBQUEsVUFDSSxLQUFLO0FBQUEsVUFDTCxNQUFNO0FBQUEsUUFDVjtBQUFBLFFBQ0E7QUFBQSxVQUNJLEtBQUs7QUFBQSxVQUNMLE1BQU07QUFBQSxRQUNWO0FBQUEsUUFDQTtBQUFBLFVBQ0ksS0FBSztBQUFBLFVBQ0wsTUFBTTtBQUFBLFFBQ1Y7QUFBQSxNQUNKO0FBQUEsSUFDSixDQUFDO0FBQUEsRUFDTDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxRQUFRO0FBQUEsSUFDSix3QkFBd0IsSUFBSTtBQUFBLEVBQ2hDO0FBQUEsRUFFQSxPQUFPO0FBQUE7QUFBQSxJQUVILFFBQVE7QUFBQSxJQUNSLGFBQWE7QUFBQTtBQUFBLElBR2IsV0FBVztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFNWCxRQUFRLENBQUM7QUFBQSxJQUVULEtBQUs7QUFBQTtBQUFBLE1BRUQsT0FBTyxRQUFRLGtDQUFXLGNBQWM7QUFBQTtBQUFBLE1BRXhDLFVBQVU7QUFBQSxNQUNWLFNBQVMsQ0FBQyxLQUFLO0FBQUEsSUFDbkI7QUFBQSxJQUNBLGVBQWU7QUFBQSxNQUNYLFNBQVM7QUFBQSxRQUNMLEdBQ0ksVUFBVTtBQUFBLFVBQ04sV0FBVyxVQUFVO0FBQUEsVUFDckI7QUFBQTtBQUFBLFlBRUksTUFBTTtBQUFBLFlBQ04sTUFBTSxhQUFhO0FBQ2Ysb0JBQU0sUUFBUSxNQUFNLEdBQUc7QUFBQSxnQkFDbkI7QUFBQSxnQkFDQTtBQUFBLGdCQUNBO0FBQUEsY0FDSixDQUFDO0FBQ0QsdUJBQVMsUUFBUSxPQUFPO0FBQ3BCLHFCQUFLLGFBQWEsSUFBSTtBQUFBLGNBQzFCO0FBQUEsWUFDSjtBQUFBLFVBQ0o7QUFBQSxRQUNKLElBQUk7QUFBQSxVQUNBLFFBQVE7QUFBQSxZQUNKLE9BQU87QUFBQSxZQUNQLFFBQVE7QUFBQSxZQUNSLGFBQWE7QUFBQSxVQUNqQixDQUFDO0FBQUEsUUFDTDtBQUFBLE1BRVI7QUFBQTtBQUFBO0FBQUEsTUFJQSxVQUFVLENBQUMsVUFBVSxTQUFTO0FBQUEsTUFFOUIsUUFBUTtBQUFBLFFBQ0osZ0JBQWdCO0FBQUEsUUFDaEIsZ0JBQWdCLENBQUMsY0FBYztBQUMzQixjQUFJLFVBQVUsU0FBUyxhQUFhO0FBQ2hDLG1CQUFPO0FBQUEsVUFDWDtBQUNBLGlCQUFPLFVBQVU7QUFBQSxRQUNyQjtBQUFBLE1BQ0o7QUFBQSxJQUNKO0FBQUEsRUFDSjtBQUNKLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==

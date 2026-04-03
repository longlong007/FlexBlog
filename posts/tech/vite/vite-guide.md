# Vite 入门指南：下一代前端构建工具

Vite 是由 Vue 作者尤雨溪主导开发的下一代前端构建工具，它基于原生 ES Module 实现了极速的开发体验。

## 为什么选择 Vite？

传统的打包工具如 Webpack 在开发环境下需要将所有模块打包成 bundle，这导致启动速度随项目规模增长而下降。Vite 利用浏览器原生 ES Module 的能力，实现了真正的即时热更新。

## 核心特性

- **极速启动**：利用原生 ESM，无需等待打包
- **热更新快**：基于 ESM 的 HMR，更新速度与文件数量无关
- **开箱即用**：内置 TypeScript、JSX、CSS 预处理器支持
- **生产构建**：基于 Rollup 的高效打包

## 快速上手

```bash
npm create vite@latest my-app -- --template vue
cd my-app
npm install
npm run dev
```

## 工作原理

Vite 在开发模式下不会打包代码，而是直接启动一个 ES Module 开发服务器。当浏览器请求某个模块时，Vite 才会对该模块进行转换和编译。这种方式让启动时间几乎不随项目规模增长。

## 总结

Vite 代表了前端构建工具的发展方向，它的理念和实现都值得深入学习。

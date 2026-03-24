# Online Judge Frontend

基于 `Vue 3 + TypeScript + Vite` 的在线编程评测系统前端项目，服务于毕业设计中的 OJ 平台场景。当前版本已经完成基础工程搭建，并提供了题库、题目详情、比赛、评测状态、管理台和登录页等页面骨架，便于后续直接接入 Spring Boot 后端接口。

## 技术栈

- Vue 3
- TypeScript
- Vite
- Vue Router
- Pinia
- Element Plus
- Axios
- Monaco Editor

## 当前能力

- 提供统一应用壳布局，包含侧边导航和顶部信息栏
- 提供登录页与本地演示登录态
- 提供题库列表页和题目详情页
- 提供在线代码编辑器组件，已集成 Monaco Editor
- 提供比赛页、评测状态页、管理台页基础视图
- 提供 `/api` 代理配置，便于本地联调 Spring Boot 后端

## 本地启动

建议使用 Node.js `20.x`。

安装依赖：

```bash
npm install
```

启动开发环境：

```bash
npm run dev
```

类型检查：

```bash
npm run check
```

生产构建：

```bash
npm run build
```

本地预览构建结果：

```bash
npm run preview
```

## 接口联调

开发环境下，Vite 已将 `/api` 请求代理到：

```text
http://localhost:8080
```

如果后端端口发生变化，可修改 `vite.config.ts` 中的代理配置。

## 项目结构

```text
src
├── components      # 通用组件，例如代码编辑器
├── layouts         # 应用整体布局
├── router          # 路由配置
├── stores          # Pinia 状态管理
├── utils           # 请求封装等工具模块
├── views           # 页面级视图
├── App.vue         # 根组件
├── main.ts         # 应用入口
└── style.css       # 全局样式
```

## 主要页面

- `/login`：登录页
- `/`：控制台首页
- `/problems`：题库页
- `/problems/:id`：题目详情页
- `/contests`：比赛页
- `/status`：评测状态页
- `/admin`：管理台

## 后续开发建议

- 接入真实登录、鉴权和权限路由
- 接入题目列表、题目详情、提交记录等后端接口
- 完善代码提交、结果轮询或 WebSocket 推送
- 补充教师端和管理员端的业务页面
- 优化 Monaco Editor 打包体积和按需加载策略

## 仓库说明

当前仓库仅包含前端工程。后端服务、判题逻辑、Docker 沙箱和消息队列等内容由主项目中的后端仓库负责。

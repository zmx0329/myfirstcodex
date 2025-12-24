# 用于记录每个文件的作用

- `memory_bank/design_document.md`：产品需求与交互细节。
- `memory_bank/tech_stack.md`：技术栈和外部服务选型（Nano Banana 生图、Azure Vision 检测、Supabase 存储等）。
- `memory_bank/implementation_plan.md`：分步实施与验证计划。
- `memory_bank/progress.md`：已完成步骤记录。
- `memory_bank/architecture.md`：本文件，概述文件/目录作用。
- `memory_bank/frontend/`：前端工程（Vite + React + TS + React Router，持续迭代星露谷风界面）。
- `memory_bank/frontend/package.json` / `memory_bank/frontend/package-lock.json`：前端依赖清单，包含 `react-router-dom` 路由与 `zustand` 状态管理；锁文件已生成。
- `memory_bank/frontend/src/App.tsx`：应用入口与路由配置，提供主页（Home）、捕物页（Capture）、珍藏页（Collection），并将未知路径重定向到主页。
- `memory_bank/frontend/src/pages/Home.tsx`：主页，唯一可点击入口为“捕物”“珍藏”两按钮。
- `memory_bank/frontend/src/pages/Capture.tsx`：捕物页骨架，左预览（约 60%）/右编辑（约 40%）布局，底部物品栏占位，后续填充上传、框、标签交互。
- `memory_bank/frontend/src/pages/Collection.tsx`：珍藏页骨架，占位作品网格，后续接入保存记录与查看大图。
- `memory_bank/frontend/src/state/capture-store.ts`：Zustand 全局状态模型（上传文件/预览、检测框列表、当前选中框、标签草稿、保存状态），标签草稿按检测框 ID 存储，字段涵盖名称/类别/描述/能量/生命/时间/标签位置比例与缩放；设置检测框时自动计算面积并默认选中最大框。
- `memory_bank/frontend/src/state/capture-store.test.ts`：Vitest 验证默认选中最大框与切换选中 ID 的逻辑。
- `memory_bank/frontend/vite.config.ts`：Vite 配置，启用 React 插件并指定 Vitest 运行环境为 jsdom。
- `memory_bank/frontend/src/App.css`：全局样式与布局，定义 60/40 栅格、按钮样式、物品栏与网格占位视觉（尺寸可后续微调）。
- `memory_bank/frontend/src/index.css`：基础排版与 reset，统一字体和盒模型。

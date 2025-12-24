# 用于记录每个文件的作用

- `memory_bank/design_document.md`：产品需求与交互细节。
- `memory_bank/tech_stack.md`：技术栈和外部服务选型（Nano Banana 生图、Azure Vision 检测、Supabase 存储等）。
- `memory_bank/implementation_plan.md`：分步实施与验证计划。
- `memory_bank/progress.md`：已完成步骤记录。
- `memory_bank/architecture.md`：本文件，概述文件/目录作用。
- `frontend/`：根目录下的前端工程（Vite + React + TS，新增 React Router 以支撑多页骨架）。
- `frontend/package.json` / `frontend/package-lock.json`：前端依赖清单，包含 `react-router-dom` 以支持路由；锁文件已生成。
- `frontend/src/App.tsx`：应用入口与路由配置，提供主页（Home）、捕物页（Capture）、珍藏页（Collection），并将未知路径重定向到主页。
- `frontend/src/pages/Home.tsx`：主页，唯一可点击入口为“捕物”“珍藏”两按钮。
- `frontend/src/pages/Capture.tsx`：捕物页骨架，左预览（约 60%）/右编辑（约 40%）布局，底部物品栏占位，后续填充上传、框、标签交互。
- `frontend/src/pages/Collection.tsx`：珍藏页骨架，占位作品网格，后续接入保存记录与查看大图。
- `frontend/src/App.css`：全局样式与布局，定义 60/40 栅格、按钮样式、物品栏与网格占位视觉（尺寸可后续微调）。
- `frontend/src/index.css`：基础排版与 reset，统一字体和盒模型。

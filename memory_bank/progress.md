# 用于记录已完成步骤

- 完成前端初始化（步骤 1）：在仓库根目录创建 `frontend`（Vite React TS 模板），运行 `npm install` 安装依赖，补充缺失的 `@typescript-eslint/tsconfig-utils` 以修复 ESLint，`npm run lint` 通过。暂未开始步骤 2。
- 完成路由与骨架占位（步骤 2）：引入 React Router，新建主页/捕物/珍藏三页骨架；捕物页按左预览约 60% + 右编辑约 40% 布局并预留底部物品栏，珍藏页提供网格占位。新增依赖 `react-router-dom` 并已执行 `npm install` 生成 `package-lock.json`。验证：手动访问 `npm run dev`，仅“捕物/珍藏”可点，三页骨架可切换，比例已大致符合要求（细节尺寸后续再调，已记录为 TODO）。

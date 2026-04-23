# COC 7版增强车卡工具

一个基于 `Vite + React + TypeScript` 的纯前端 CoC 7版增强角色创建工具。  
项目采用“分步向导 + 实时角色卡预览”的工作台式界面，支持随机生成、手动微调、本地快照，以及 JSON 导入导出。

## 当前功能

- 5 步建卡流程：基础设定、属性生成、身份与背景、职业与技能点、装备与校对
- CoC 7 版基础投骰与年龄修正
- 派生值自动计算：`HP / MP / SAN / MOV / Dodge / Build / Damage Bonus`
- 职业点公式配置、职业技能勾选、兴趣点分配
- 标准技能目录 + 自定义技能
- 浏览器 `localStorage` 自动保存当前草稿
- 本地角色快照保存
- JSON 导入 / 导出
- 桌面端实时角色卡预览
- 移动端预览抽屉

## 技术栈

- React 19
- TypeScript
- Vite
- Framer Motion
- Vitest
- React Testing Library

## 本地开发

### 1. 安装依赖

```bash
npm install
```

如果你在 Windows PowerShell 下遇到脚本执行策略问题，可以改用：

```powershell
npm.cmd install
```

### 2. 启动开发服务器

```bash
npm run dev
```

Windows PowerShell 可用：

```powershell
npm.cmd run dev
```

### 3. 运行测试

```bash
npm run test
```

### 4. 生产构建

```bash
npm run build
```

构建完成后产物位于 `dist/`。

## 构建产物说明

本项目的 Vite 构建已经配置为相对资源路径输出，因此：

- 可以通过静态服务器部署 `dist/`
- 也可以直接打开 `dist/index.html` 进行本地查看

打包后的页面逻辑不在 `index.html` 里内联，而是在：

- `dist/assets/*.js`
- `dist/assets/*.css`

这是正常的前端打包结果。

## 项目结构

```text
COC-Character-Create/
├─ src/
│  ├─ components/        # 各步骤界面与预览组件
│  ├─ domain/            # 规则、类型、存储、技能目录
│  ├─ state/             # 全局状态与 reducer/context
│  ├─ styles/            # 全局样式与 CSS Modules
│  ├─ App.tsx            # 应用入口界面
│  └─ main.tsx           # React 挂载入口
├─ index.html
├─ package.json
├─ tsconfig.json
├─ vite.config.ts
└─ README.md
```

## 规则与状态设计

- `InvestigatorDraft` 是全应用唯一角色源数据
- 派生值通过规则函数计算，不直接手写覆盖
- 存档使用统一的 `StorageEnvelopeV1`
- UI 主要消费 reducer/context 提供的状态和动作

## 测试覆盖

当前测试包括：

- 属性生成与年龄规则
- 派生值计算
- 本地存储与 JSON 导入导出
- 基础 UI 交互与快照保存

## 当前限制

- 目前不包含 PDF / 打印版角色卡
- 不包含账号系统、云同步、多人协作
- 不内置完整官方职业库，采用“职业名称 + 职业点公式 + 职业技能选择”的灵活方式

## 后续可扩展方向

- 打印版角色卡 / PDF 导出
- 预置职业模板
- 更完整的战斗栏与武器模板
- 房规配置与自定义规则包

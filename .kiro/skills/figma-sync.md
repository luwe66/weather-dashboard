# Skill: Figma 设计稿同步

## 用途
将天气大屏页面导入到 Figma，或从 Figma 读取修改后同步回代码。

---

## 流程一：代码 → Figma（导入设计稿）

### 前置条件
- 本地 dev server 已启动（`npm run dev`，端口 5173）
- Figma 文件：https://www.figma.com/design/yXOqDAPYX61zPgwV2ob5rH/weather-dashboard

### 步骤

1. **注入捕获脚本**
   在 `index.html` 的 `</body>` 前添加：
   ```html
   <script src="https://mcp.figma.com/mcp/html-to-design/capture.js" async></script>
   ```

2. **生成 Capture ID**
   调用 `generate_figma_design`，outputMode 选 `existingFile`，fileKey 为 `yXOqDAPYX61zPgwV2ob5rH`

3. **打开页面触发捕获**
   用生成的 hash URL 打开 `http://localhost:5173/`，延迟设为 `8000ms` 确保数据加载完成

   > **获取 1920x1080 尺寸的方法：**
   > 1. 系统设置 → 显示器 → 分辨率调整为 1080p
   > 2. 先在浏览器里点右上角全屏按钮进入全屏
   > 3. 在全屏状态下按 `Cmd + L` 聚焦地址栏
   > 4. 粘贴 hash URL 并回车（不能用 `open` 命令，会新开窗口破坏全屏）
   > 5. 捕获完成后把分辨率改回来

4. **轮询等待完成**
   每 5 秒轮询一次，直到状态变为 `completed`

5. **清理**
   捕获完成后，从 `index.html` 移除捕获脚本

### 注意事项
- 每次导入放在新位置，**不覆盖、不删除**已有 frame
- 页面多大就捕获多大，不强制指定尺寸
- 捕获完成后，给 frame 命名唯一名称，格式：`天气大屏 vX.X · YYYY-MM-DD`
- 捕获后替换天气图标为 WeatherIcon 组件实例，替换 UI 图标为 Remix Icons 组件实例，图标颜色统一改为 `#4a6a8a`

---

## 流程二：Figma → 代码（同步设计修改）

### 前置条件
- 用户在 Figma 中完成了设计修改
- 用户提供了修改后的 node-id 或链接

### 步骤

1. **读取设计稿**
   调用 `get_design_context`，传入用户指定的 fileKey 和 nodeId

2. **分析差异**
   对比设计稿与当前代码，识别需要修改的样式（颜色、间距、字体、布局等）

3. **更新代码**
   - 全局变量改动 → 修改 `src/styles/global.css`
   - 组件级改动 → 修改对应的 `.vue` 文件中的 `<style>` 部分
   - 布局改动 → 修改 `src/App.vue`

4. **验证**
   运行 `npm run build` 确认无报错，在浏览器中预览效果

---

## 相关文件

| 文件 | 说明 |
|------|------|
| `index.html` | 捕获脚本注入位置 |
| `src/styles/global.css` | 全局 CSS 变量（颜色、字体等） |
| `src/App.vue` | 主布局 |
| `src/components/` | 各模块组件 |
| `.kiro/steering/figma-rules.md` | Figma 操作约束规则 |

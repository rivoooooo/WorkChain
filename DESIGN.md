# Work-Chain 设计系统与样式指南

本文档概述了 Work-Chain 应用的设计规范、美学原则及颜色板，参考了我们的目标设计风格。

## 1. 美学原则

*   **极简与活力 (Vibrant Minimalism)**：核心 UI 严格采用单色调（黑、白、灰），突出丰富多彩的视觉元素（如像素风 Hero 图片）与微妙的氛围特效。
*   **排版即艺术 (Typography as Art)**：将清晰有力的无衬线标题与优雅的斜体衬线字结合，营造出高端杂志级别的排版质感（例如使用斜体衬线字强调特定的关键词）。
*   **悬浮式 UI 元素 (Floating UI Elements)**：导航栏和输入表单采用胶囊形状 (`rounded-full`) 悬浮于背景之上。在浅色模式下，导航栏采用极高对比度设计（白色背景上的黑色悬浮胶囊）。
*   **柔和氛围渐变 (Soft Atmospheric Gradients)**：在屏幕边缘使用微妙模糊的网格渐变（例如底部的暖粉与暖黄），在不干扰主内容的前提下增添视觉温度。

## 2. 字体排版

*   **主字体（无衬线）**：Inter、Geist 或类似的现代新怪异 (neo-grotesque) 无衬线字体。用于绝大多数 UI 元素、正文段落及加粗结构标题。
*   **强调字体（衬线）**：Playfair Display、Instrument Serif 或类似的高对比度衬线字体。仅在斜体时使用 (`font-serif italic`)，用于在大型标题中强调个别重点词汇。

## 3. UI 组件设计

*   **导航栏 (Navbar)**：悬浮胶囊形状。在浅色模式下，为高对比度的深色元素 (`bg-zinc-900` 或纯黑) 搭配白色文字，提供明确的视觉层级。
*   **按钮与输入框 (Buttons & Inputs)**：胶囊形状 (`rounded-full`)。主要操作按钮使用实色（浅色模式下为黑色，深色模式下为白色）。输入框采用柔和的灰色背景，无重边框。
*   **卡片与容器 (Cards/Containers)**：边框简洁利落，避免沉重的线条。依靠合理的留白与柔和的背景色差来实现区域分隔。
*   **品牌 Logo (Logos)**：柔和单色的 Logo，符合极简的布局风格。

## 4. 主题颜色 (Shadcn UI CSS 变量)

我们通过映射到 HSL 值的 CSS 变量定义了严格的浅色 (Light) 和深色 (Dark) 模式。应用的默认主题为 **深色模式 (Dark Mode)**，以防止首次加载时的强光闪烁，两种模式均完全支持并可随意切换。

### 浅色模式 (Light Mode - 参考美学)
提供极简清爽的白色画布，搭配深黑色文本与 UI 元素。

```css
:root {
  --background: 0 0% 100%; /* #FFFFFF */
  --foreground: 0 0% 3.9%; /* #0A0A0A */
  
  --card: 0 0% 100%;
  --card-foreground: 0 0% 3.9%;
  
  --popover: 0 0% 100%;
  --popover-foreground: 0 0% 3.9%;
  
  --primary: 0 0% 9%; /* #171717 */
  --primary-foreground: 0 0% 98%; /* #FAFAFA */
  
  --secondary: 0 0% 96.1%; /* #F5F5F5 */
  --secondary-foreground: 0 0% 9%;
  
  --muted: 0 0% 96.1%; /* #F5F5F5 */
  --muted-foreground: 0 0% 45.1%; /* #737373 */
  
  --accent: 0 0% 96.1%;
  --accent-foreground: 0 0% 9%;
  
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;

  --border: 0 0% 89.8%; /* #E5E5E5 */
  --input: 0 0% 89.8%;
  --ring: 0 0% 3.9%;
  
  --radius: 0.5rem;
}
```

### 深色模式 (Dark Mode - 默认基准)
翻转美学视觉，带来沉浸式、极具科技感与高端感的体验。悬浮导航栏变为略浅的灰色或微玻璃效果元素，与黑色背景形成对比。

```css
.dark {
  --background: 0 0% 3.9%; /* #0A0A0A */
  --foreground: 0 0% 98%; /* #FAFAFA */
  
  --card: 0 0% 3.9%;
  --card-foreground: 0 0% 98%;
  
  --popover: 0 0% 3.9%;
  --popover-foreground: 0 0% 98%;
  
  --primary: 0 0% 98%; /* #FAFAFA */
  --primary-foreground: 0 0% 9%; /* #171717 */
  
  --secondary: 0 0% 14.9%; /* #262626 */
  --secondary-foreground: 0 0% 98%;
  
  --muted: 0 0% 14.9%; /* #262626 */
  --muted-foreground: 0 0% 63.9%; /* #A3A3A3 */
  
  --accent: 0 0% 14.9%;
  --accent-foreground: 0 0% 98%;
  
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 0 0% 98%;
  
  --border: 0 0% 14.9%; /* #262626 */
  --input: 0 0% 14.9%;
  --ring: 0 0% 83.1%;
}
```

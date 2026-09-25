import type { ComponentProps } from "react";
import { Toaster as Sonner } from "sonner";
import { useAppStore } from "@/stores/app";

/**
 * Sonner 通知(shadcn 生态默认 Toast,替代 react-hot-toast)
 *
 * - 主题跟随 app store 的深浅模式;背景/文字/边框映射到主题 token,
 *   换颜色主题(data-theme)时通知样式自动跟随
 * - richColors:success/error/warning 使用彩色图标与底色,比纯文字直观
 */
function Toaster({ ...props }: ComponentProps<typeof Sonner>) {
  const theme = useAppStore((s) => s.theme);

  return (
    <Sonner
      theme={theme}
      position="bottom-right"
      richColors
      className="toaster group"
      /* sonner 通过这组 CSS 变量取色(官方 shadcn 接法):
         映射到 Tailwind v4 暴露的主题 token,而非写死颜色 */
      style={
        {
          "--normal-bg": "var(--color-popover)",
          "--normal-text": "var(--color-popover-foreground)",
          "--normal-border": "var(--color-border)",
          "--border-radius": "var(--radius-lg)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
}

export { Toaster };

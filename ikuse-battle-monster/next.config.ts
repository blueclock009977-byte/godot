import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Turbopackのルートディレクトリを明示的に指定
  // 複数のpackage-lock.jsonがある場合の警告を解消
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;

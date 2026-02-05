"use client";

import { App, ConfigProvider, theme } from "antd";
import type { ReactNode } from "react";

interface AntdProviderProps {
  children: ReactNode;
}

export default function AntdProvider({ children }: AntdProviderProps) {
  return (
    <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
      <App>{children}</App>
    </ConfigProvider>
  );
}

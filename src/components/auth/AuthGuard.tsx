/**
 * AuthGuard · 路由守卫
 *
 * 未登录时重定向到 /login，已登录则渲染子路由
 * 仅检查 localStorage 中的登录状态，不涉及后端 token 验证
 */

import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store/appStore';

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAppStore();
  const location = useLocation();

  if (!isLoggedIn) {
    // 将当前路径作为 state 传递，登录后可跳回
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
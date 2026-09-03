"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getCurrentUser,
  logout,
  type VantaUser,
} from "@/lib/auth";

const navigation = [
  {
    label: "Overview",
    href: "/",
    icon: "⌂",
  },
  {
    label: "Incidents",
    href: "/incidents",
    icon: "!",
  },
  {
    label: "Events",
    href: "/events",
    icon: "◈",
  },
  {
    label: "Services",
    href: "/services",
    icon: "◇",
  },
  {
    label: "Timeline",
    href: "/timeline",
    icon: "◷",
  },
  {
    label: "LYROMI",
    href: "/lyromi",
    icon: "L",
  },
];

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<VantaUser | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const currentUser = getCurrentUser();

    if (!currentUser) {
      router.replace("/login");
      return;
    }

    setUser(currentUser);
    setCheckingAuth(false);
  }, [router]);

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  if (checkingAuth) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#070b12",
          color: "#8290a5",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "12px",
          }}
        >
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: "#35d49a",
              boxShadow:
                "0 0 10px rgba(53, 212, 154, 0.65)",
            }}
          />
          Loading VANTA...
        </div>
      </main>
    );
  }

  const initials =
    user?.fullName
      ?.split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "VA";

  return (
    <div
      className={`app-shell ${
        collapsed ? "sidebar-collapsed" : ""
      }`}
    >
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">V</div>

          {!collapsed && (
            <div className="brand-copy">
              <strong>VANTA</strong>
              <span>Operational Intelligence</span>
            </div>
          )}
        </div>

        {!collapsed && (
          <div className="workspace-label">
            <span>WORKSPACE</span>

            <strong>Production</strong>
          </div>
        )}

        <nav className="main-nav" aria-label="Main navigation">
          {navigation.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${
                  active ? "active" : ""
                }`}
                title={
                  collapsed ? item.label : undefined
                }
              >
                <span className="nav-icon">
                  {item.icon}
                </span>

                {!collapsed && (
                  <span>{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <Link
            href="/settings"
            className={`nav-item ${
              pathname.startsWith("/settings")
                ? "active"
                : ""
            }`}
            title={collapsed ? "Settings" : undefined}
          >
            <span className="nav-icon">⚙</span>

            {!collapsed && <span>Settings</span>}
          </Link>

          {!collapsed && user && (
            <div className="user-card">
              <div className="user-avatar">
                {initials}
              </div>

              <div>
                <strong>{user.fullName}</strong>

                <span>{user.email}</span>
              </div>
            </div>
          )}

          <button
            type="button"
            className="nav-item logout-button"
            onClick={handleLogout}
            title={collapsed ? "Log out" : undefined}
          >
            <span className="nav-icon">↪</span>

            {!collapsed && <span>Log out</span>}
          </button>
        </div>

        <button
          type="button"
          className="sidebar-toggle"
          onClick={() =>
            setCollapsed((value) => !value)
          }
          aria-label={
            collapsed
              ? "Open sidebar"
              : "Collapse sidebar"
          }
          title={
            collapsed
              ? "Open sidebar"
              : "Collapse sidebar"
          }
        >
          {collapsed ? "→" : "←"}
        </button>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="topbar-eyebrow">
              VANTA · OPERATIONAL INTELLIGENCE
            </span>
          </div>

          <div className="system-status">
            <span className="status-dot" />
            All systems operational
          </div>
        </header>

        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
}
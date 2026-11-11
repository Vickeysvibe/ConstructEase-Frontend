import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Link, NavLink, Outlet, useLocation, useMatch, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Boxes,
  CalendarCheck,
  ClipboardList,
  HardHat,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  NotebookPen,
  Package,
  PackageCheck,
  Settings,
  ShoppingCart,
  Truck,
  Undo2,
  Users,
  Wallet,
  Building2,
  ArrowLeftRight,
  UserRound,
  KeyRound,
  Monitor,
  Moon,
  Sun,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { IconButton, Select, Badge, PageHelpContext, Tooltip } from "@/ui";
import { Breadcrumbs, CrumbProvider, useCurrentPageHelp } from "./Breadcrumbs";
import { useTheme, type ThemePref } from "./theme";
import { useAuth } from "./auth";
import { useSite, type SitePermission } from "./site";
import "./shell.css";

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  perm?: SitePermission;
  end?: boolean;
}
const SITE_NAV: { label: string; items: NavItem[] }[] = [
  { label: "Site", items: [{ to: "", label: "Overview", icon: <LayoutDashboard />, end: true }] },
  {
    label: "Purchasing",
    items: [
      { to: "purchasing/orders", label: "Purchase orders", icon: <ShoppingCart /> },
      { to: "purchasing/receipts", label: "Goods receipts", icon: <PackageCheck /> },
      { to: "purchasing/returns", label: "Returns", icon: <Undo2 /> },
    ],
  },
  {
    label: "Stock",
    items: [
      { to: "stock", label: "On hand", icon: <Boxes />, end: true },
      { to: "stock/movements", label: "Movements", icon: <ArrowLeftRight /> },
    ],
  },
  {
    label: "People",
    items: [
      { to: "attendance", label: "Labour attendance", icon: <CalendarCheck />, end: true },
      { to: "attendance/checkins", label: "Check-ins", icon: <MapPin /> },
    ],
  },
  { label: "Money", items: [{ to: "finance/payments", label: "Payments", icon: <Wallet />, perm: "finance:read" }] },
  {
    label: "Work",
    items: [
      { to: "worklog", label: "Trackers", icon: <ClipboardList /> },
      { to: "notes", label: "Notes", icon: <NotebookPen /> },
    ],
  },
  {
    label: "Masters",
    items: [
      { to: "masters/vendors", label: "Vendors", icon: <Truck /> },
      { to: "masters/clients", label: "Clients", icon: <Building2 /> },
      { to: "masters/labour", label: "Labour", icon: <HardHat /> },
      { to: "masters/products", label: "Products", icon: <Package /> },
      { to: "masters/team", label: "Team", icon: <Users /> },
    ],
  },
  { label: "Insight", items: [{ to: "reports", label: "Reports", icon: <BarChart3 />, perm: "reports:read" }] },
];

function SiteSidebar({ open, onNavigate }: { open: boolean; onNavigate: () => void }) {
  const { to, can, archived } = useSite();
  return (
    <nav className="sidebar" data-open={open} aria-label="Site sections">
      {archived && (
        <div className="sidebar__archived">
          <Badge tone="warn">Archived — read only</Badge>
        </div>
      )}
      {SITE_NAV.map((group) => {
        const items = group.items.filter((i) => !i.perm || can(i.perm));
        if (!items.length) return null;
        return (
          <div className="sidebar__group" key={group.label}>
            <span className="sidebar__label">{group.label}</span>
            {items.map((i) => (
              <NavLink key={i.to} to={to(i.to)} end={i.end} onClick={onNavigate}>
                {i.icon}
                {i.label}
              </NavLink>
            ))}
          </div>
        );
      })}
    </nav>
  );
}

function UserMenu() {
  const { session, logout, isOrgAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  if (!session) return null;
  return (
    <div className="topbar__user" ref={ref}>
      <IconButton label="Account" icon={<UserRound />} aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((o) => !o)} />
      {open && (
        <div className="topbar__menu" role="menu">
          <div className="topbar__menu-head">
            <strong>{session.user.name}</strong>
            <small>{session.user.email}</small>
          </div>
          {isOrgAdmin && (
            <Link to="/settings" role="menuitem" onClick={() => setOpen(false)}>
              <Settings /> Organisation settings
            </Link>
          )}
          <Link to="/account" role="menuitem" onClick={() => setOpen(false)}>
            <KeyRound /> Change password
          </Link>
          <ThemeSwitch />
          <button
            role="menuitem"
            onClick={async () => {
              await logout();
              navigate("/login", { replace: true });
            }}
          >
            <LogOut /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

const THEMES: { value: ThemePref; label: string; icon: ReactNode }[] = [
  { value: "system", label: "System", icon: <Monitor /> },
  { value: "light", label: "Light", icon: <Sun /> },
  { value: "dark", label: "Dark", icon: <Moon /> },
];

/** System / Light / Dark, remembered in this browser. */
function ThemeSwitch() {
  const [pref, setPref] = useTheme();
  return (
    <div className="themeswitch" role="radiogroup" aria-label="Theme">
      <span className="themeswitch__label">Theme</span>
      <div className="themeswitch__options">
        {THEMES.map((t) => (
          <button
            key={t.value}
            type="button"
            role="radio"
            aria-checked={pref === t.value}
            className="themeswitch__opt"
            onClick={() => setPref(t.value)}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SiteSwitcher() {
  const { me } = useAuth();
  const match = useMatch("/sites/:siteId/*");
  const navigate = useNavigate();
  if (!me || me.sites.length < 2 || !match) return null;
  return (
    <div className="topbar__site">
      <Select
        aria-label="Switch site"
        value={match.params.siteId}
        options={me.sites.map((s) => ({ value: s.id, label: s.status === "archived" ? `${s.name} (archived)` : s.name }))}
        onChange={(e) => navigate(`/sites/${e.target.value}`)}
      />
    </div>
  );
}

const NavContext = createContext<{ open: boolean; setOpen: (v: boolean) => void }>({ open: false, setOpen: () => undefined });

/** Organisation logo + name, next to the account menu. Admins can click through to settings. */
function OrgPill() {
  const { session, isOrgAdmin } = useAuth();
  const [logoFailed, setLogoFailed] = useState(false);
  const org = session?.org;
  if (!org) return null;
  const initials = org.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  const content = (
    <>
      {org.logoUrl && !logoFailed ? (
        <img src={org.logoUrl} alt="" className="orgpill__logo" onError={() => setLogoFailed(true)} />
      ) : (
        <span className="orgpill__logo orgpill__logo--initials" aria-hidden>
          {initials}
        </span>
      )}
      <span className="orgpill__name">{org.name}</span>
    </>
  );
  return isOrgAdmin ? (
    <Tooltip content="Organisation settings" describe={false}>
      <Link to="/settings" className="orgpill orgpill--link">
        {content}
      </Link>
    </Tooltip>
  ) : (
    <span className="orgpill">{content}</span>
  );
}

function PageChrome({ children }: { children: ReactNode }) {
  const help = useCurrentPageHelp();
  return (
    <PageHelpContext.Provider value={help}>
      <Breadcrumbs />
      {children}
    </PageHelpContext.Provider>
  );
}

/** Top bar + (on site routes) the section sidebar. */
export function AppShell() {
  const inSite = Boolean(useMatch("/sites/:siteId/*"));
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setNavOpen(false), [location.pathname]);
  return (
    <CrumbProvider>
    <NavContext.Provider value={{ open: navOpen, setOpen: setNavOpen }}>
      <div className="shell">
        <header className="topbar">
          {inSite && (
            <IconButton
              className="topbar__menu-btn"
              label={navOpen ? "Close menu" : "Open menu"}
              icon={<Menu />}
              onClick={() => setNavOpen(!navOpen)}
              aria-expanded={navOpen}
            />
          )}
          <Link to="/" className="topbar__brand">
            <img src={logo} alt="" />
            <span>ConstructEase</span>
          </Link>
          <span className="ce-spacer" />
          <SiteSwitcher />
          <OrgPill />
          <UserMenu />
        </header>
        <div className={inSite ? "body" : "body body--no-side"}>
          <Outlet />
        </div>
      </div>
    </NavContext.Provider>
    </CrumbProvider>
  );
}

/** Layout for /sites/:siteId/* — sidebar + content. Rendered inside SiteScope. */
export function SiteLayout() {
  const { open, setOpen } = useContext(NavContext);
  return (
    <>
      {open && <div className="sidebar-scrim" onClick={() => setOpen(false)} aria-hidden />}
      <SiteSidebar open={open} onNavigate={() => setOpen(false)} />
      <main className="main">
        <div className="main__inner">
          <PageChrome>
            <Outlet />
          </PageChrome>
        </div>
      </main>
    </>
  );
}

/** Plain content layout for non-site pages (home, settings, account). */
export function PlainLayout() {
  return (
    <main className="main">
      <div className="main__inner">
        <PageChrome>
          <Outlet />
        </PageChrome>
      </div>
    </main>
  );
}

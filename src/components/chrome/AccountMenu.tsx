/**
 * Identified Account button. The trigger shows who you are (avatar +
 * name + email) so identity isn't a click away; the panel exposes
 * Manage account (Keycloak's hosted account console — name, email,
 * password, 2FA, sessions, linked IdPs), Help Center, and Sign Out.
 *
 * Reuses Headless UI Menu directly for the panel mechanics. The
 * existing Dropdown component fits action lists; this menu's
 * non-interactive identified header doesn't fit that contract, so we
 * keep it close to home.
 */
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { Link } from "react-router";
import { useAuth } from "../../contexts/auth/useAuth";
import { useMe } from "../../contexts/me/MeProvider";
import { useLogout } from "../../hooks/use-logout";
import { ArrowSquareOut, Lifebuoy, SignOut, UserGear } from "./icons";

const initials = (name: string | null, email: string): string => {
  if (name) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
};

const AccountMenu: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const { me } = useMe();
  const { keycloak } = useAuth();
  const logout = useLogout();

  const accountUrl = keycloak?.createAccountUrl();

  const name =
    me?.identity?.name ??
    ([me?.identity?.givenName, me?.identity?.familyName]
      .filter(Boolean)
      .join(" ") ||
      null);
  const email = me?.identity?.email ?? "";
  const display = name || email || "Account";
  const avatarChars = initials(name, email);

  return (
    <Menu as="div" className="relative">
      <MenuButton
        className={[
          "inline-flex items-center gap-2.5 rounded-lg transition-colors",
          "hover:bg-warm-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/40",
          compact ? "p-0.5" : "h-10 pl-1.5 pr-3",
        ].join(" ")}
      >
        <span
          aria-hidden="true"
          className="h-7 w-7 rounded-full bg-primary-400 text-white text-xs font-semibold grid place-items-center shrink-0"
        >
          {avatarChars}
        </span>
        {!compact && (
          <span className="text-left leading-tight max-md:hidden">
            <span className="block text-sm font-semibold text-secondary-900 truncate max-w-[12rem]">
              {display}
            </span>
            {name && email && (
              <span className="block text-[11px] text-secondary-500 truncate max-w-[12rem]">
                {email}
              </span>
            )}
          </span>
        )}
        <span className="sr-only">Account menu</span>
      </MenuButton>

      <MenuItems
        anchor={{ to: "bottom end", gap: 8 }}
        transition
        portal
        className={[
          "z-30 w-64 rounded-xl bg-white shadow-lg ring-1 ring-warm-200",
          "focus:outline-hidden overflow-hidden origin-top-right",
          "transition duration-150 ease-out data-closed:opacity-0 data-closed:scale-95",
          "data-leave:duration-100 data-leave:ease-in",
        ].join(" ")}
      >
        {/* Identified header */}
        <div className="px-4 py-3 border-b border-warm-200">
          <p className="text-xs text-secondary-500">Signed in as</p>
          <p className="mt-0.5 text-sm font-semibold text-secondary-900 truncate">
            {display}
          </p>
          {name && email && (
            <p className="text-xs text-secondary-500 truncate">{email}</p>
          )}
        </div>

        <div className="py-1">
          {accountUrl && (
            <MenuItem>
              {({ focus }) => (
                <a
                  href={accountUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={[
                    "flex items-center gap-2.5 px-4 py-2 text-sm",
                    focus
                      ? "bg-warm-100 text-secondary-900"
                      : "text-secondary-700",
                  ].join(" ")}
                >
                  <UserGear
                    size={18}
                    weight="regular"
                    className="text-secondary-500"
                  />
                  <span className="flex-1">Manage account</span>
                  <ArrowSquareOut
                    size={14}
                    weight="regular"
                    className="text-secondary-400 shrink-0"
                    aria-hidden="true"
                  />
                </a>
              )}
            </MenuItem>
          )}
          <MenuItem>
            {({ focus }) => (
              <Link
                to="/help-center"
                className={[
                  "flex items-center gap-2.5 px-4 py-2 text-sm",
                  focus
                    ? "bg-warm-100 text-secondary-900"
                    : "text-secondary-700",
                ].join(" ")}
              >
                <Lifebuoy
                  size={18}
                  weight="regular"
                  className="text-secondary-500"
                />
                Help Center
              </Link>
            )}
          </MenuItem>
          <MenuItem>
            {({ focus }) => (
              <button
                type="button"
                onClick={() => logout()}
                className={[
                  "flex w-full items-center gap-2.5 px-4 py-2 text-sm text-left",
                  focus
                    ? "bg-warm-100 text-secondary-900"
                    : "text-secondary-700",
                ].join(" ")}
              >
                <SignOut
                  size={18}
                  weight="regular"
                  className="text-secondary-500"
                />
                Sign out
              </button>
            )}
          </MenuItem>
        </div>
      </MenuItems>
    </Menu>
  );
};

export default AccountMenu;

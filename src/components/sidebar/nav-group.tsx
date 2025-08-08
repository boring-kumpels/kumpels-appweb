"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQRScannerContext } from "@/context/qr-scanner-context";
import type {
  NavCollapsible,
  NavItem,
  NavLink,
  NavGroup as NavGroupType,
} from "./types";

export function NavGroup({ title, items }: NavGroupType) {
  const { state } = useSidebar();
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item: NavItem) => {
          const key = `${item.title}-${item.url}`;

          if (!item.items)
            return (
              <SidebarMenuLink key={key} item={item} pathname={pathname} />
            );

          if (state === "collapsed")
            return (
              <SidebarMenuCollapsedDropdown
                key={key}
                item={item}
                pathname={pathname}
              />
            );

          return (
            <SidebarMenuCollapsible key={key} item={item} pathname={pathname} />
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

const NavBadge = ({ children }: { children: ReactNode }) => (
  <Badge className="rounded-full px-1 py-0 text-xs">{children}</Badge>
);

function isNavLink(item: NavItem): item is NavLink {
  return "url" in item;
}

const SidebarMenuLink = ({
  item,
  pathname,
}: {
  item: NavLink;
  pathname: string;
}) => {
  const { setOpenMobile } = useSidebar();
  const { openQRScanner } = useQRScannerContext();
  const isExternalLink =
    item.url.startsWith("http://") || item.url.startsWith("https://");

  // Handle QR Scanner button
  if (item.isQRScanner) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={() => {
            openQRScanner();
            setOpenMobile(false);
          }}
          tooltip={item.title}
        >
          {item.icon && <item.icon />}
          <span>{item.title}</span>
          {item.badge && <NavBadge>{item.badge}</NavBadge>}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={checkIsActive(pathname, item)}
        tooltip={item.title}
      >
        {isExternalLink ? (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpenMobile(false)}
          >
            {item.icon && <item.icon />}
            <span>{item.title}</span>
            {item.badge && <NavBadge>{item.badge}</NavBadge>}
          </a>
        ) : (
          <Link href={item.url} onClick={() => setOpenMobile(false)}>
            {item.icon && <item.icon />}
            <span>{item.title}</span>
            {item.badge && <NavBadge>{item.badge}</NavBadge>}
          </Link>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

const SidebarMenuCollapsible = ({
  item,
  pathname,
}: {
  item: NavCollapsible;
  pathname: string;
}) => {
  const { setOpenMobile } = useSidebar();
  const { openQRScanner } = useQRScannerContext();

  return (
    <Collapsible
      asChild
      defaultOpen={checkIsActive(pathname, item, true)}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.title}>
            {item.icon && <item.icon />}
            <span>{item.title}</span>
            {item.badge && <NavBadge>{item.badge}</NavBadge>}
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent className="CollapsibleContent">
          <SidebarMenuSub>
            {item.items.map((subItem: NavItem) => {
              if (isNavLink(subItem)) {
                // Handle QR Scanner button in collapsible
                if (subItem.isQRScanner) {
                  return (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton
                        onClick={() => {
                          openQRScanner();
                          setOpenMobile(false);
                        }}
                      >
                        {subItem.icon && <subItem.icon />}
                        <span>{subItem.title}</span>
                        {subItem.badge && <NavBadge>{subItem.badge}</NavBadge>}
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  );
                }

                const isExternalLink =
                  subItem.url.startsWith("http://") ||
                  subItem.url.startsWith("https://");
                return (
                  <SidebarMenuSubItem key={subItem.title}>
                    <SidebarMenuSubButton
                      asChild
                      isActive={checkIsActive(pathname, subItem)}
                    >
                      {isExternalLink ? (
                        <a
                          href={subItem.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setOpenMobile(false)}
                        >
                          {subItem.icon && <subItem.icon />}
                          <span>{subItem.title}</span>
                          {subItem.badge && (
                            <NavBadge>{subItem.badge}</NavBadge>
                          )}
                        </a>
                      ) : (
                        <Link
                          href={subItem.url}
                          onClick={() => setOpenMobile(false)}
                        >
                          {subItem.icon && <subItem.icon />}
                          <span>{subItem.title}</span>
                          {subItem.badge && (
                            <NavBadge>{subItem.badge}</NavBadge>
                          )}
                        </Link>
                      )}
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                );
              }
              return null;
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
};

const SidebarMenuCollapsedDropdown = ({
  item,
  pathname,
}: {
  item: NavCollapsible;
  pathname: string;
}) => {
  const { openQRScanner } = useQRScannerContext();

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            tooltip={item.title}
            isActive={checkIsActive(pathname, item)}
          >
            {item.icon && <item.icon />}
            <span>{item.title}</span>
            {item.badge && <NavBadge>{item.badge}</NavBadge>}
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" sideOffset={4}>
          <DropdownMenuLabel>
            {item.title} {item.badge ? `(${item.badge})` : ""}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {item.items.map((sub: NavItem) => {
            if (isNavLink(sub)) {
              // Handle QR Scanner button in dropdown
              if (sub.isQRScanner) {
                return (
                  <DropdownMenuItem
                    key={`${sub.title}-${sub.url}`}
                    onClick={() => openQRScanner()}
                  >
                    {sub.icon && <sub.icon />}
                    <span className="max-w-52 text-wrap">{sub.title}</span>
                    {sub.badge && (
                      <span className="ml-auto text-xs">{sub.badge}</span>
                    )}
                  </DropdownMenuItem>
                );
              }

              const isExternalLink =
                sub.url.startsWith("http://") || sub.url.startsWith("https://");
              return (
                <DropdownMenuItem key={`${sub.title}-${sub.url}`} asChild>
                  {isExternalLink ? (
                    <a
                      href={sub.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${checkIsActive(pathname, sub) ? "bg-secondary" : ""}`}
                    >
                      {sub.icon && <sub.icon />}
                      <span className="max-w-52 text-wrap">{sub.title}</span>
                      {sub.badge && (
                        <span className="ml-auto text-xs">{sub.badge}</span>
                      )}
                    </a>
                  ) : (
                    <Link
                      href={sub.url}
                      className={`${checkIsActive(pathname, sub) ? "bg-secondary" : ""}`}
                    >
                      {sub.icon && <sub.icon />}
                      <span className="max-w-52 text-wrap">{sub.title}</span>
                      {sub.badge && (
                        <span className="ml-auto text-xs">{sub.badge}</span>
                      )}
                    </Link>
                  )}
                </DropdownMenuItem>
              );
            }
            return null;
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
};

function checkIsActive(pathname: string, item: NavItem, mainNav = false) {
  return (
    pathname === item.url || // /endpoint
    !!item?.items?.filter((i: NavItem) => i.url === pathname).length || // if child nav is active
    (mainNav &&
      pathname.split("/")[1] !== "" &&
      pathname.split("/")[1] === item?.url?.split("/")[1])
  );
}

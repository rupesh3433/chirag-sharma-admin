import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  BarChart3,
  Sparkles,
  BookOpen,
  CalendarDays,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const menuItems = [
  { title: 'Dashboard', url: '/admin/dashboard', icon: LayoutDashboard },
  { title: 'Bookings', url: '/admin/bookings', icon: Calendar },
  { title: 'Events', url: '/admin/events', icon: CalendarDays },
  { title: 'Analytics', url: '/admin/analytics', icon: BarChart3 },
  { title: 'Knowledge Base', url: '/admin/knowledge', icon: BookOpen },
];

const AdminSidebar = () => {
  const { state, open, setOpen, isMobile } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const navigate = useNavigate();

  /* DESKTOP - Save collapsed state to localStorage */
  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem('admin_sidebar_collapsed', state);
    }
  }, [state, isMobile]);

  /* Handle navigation - close sidebar on mobile after navigation */
  const handleNavigate = (url: string) => {
    navigate(url);
    // Close mobile sidebar after navigation
    if (isMobile) {
      setOpen(false);
    }
  };

  /* ============================================
     MOBILE VIEW - Simple drawer, text only
  ============================================ */
  if (isMobile) {
    return (
      <>
        {/* Sidebar Drawer */}
        <div
          className={`
            fixed top-0 left-0 h-full bg-sidebar z-50
            border-r border-sidebar-border
            transition-transform duration-300 ease-in-out
            ${open ? 'translate-x-0' : '-translate-x-full'}
          `}
          style={{ width: '70%', maxWidth: '280px' }}
        >
          {/* Header */}
          <div className="h-16 flex items-center px-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center rounded-xl gradient-primary">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-semibold text-sidebar-foreground">JinniChirag</h2>
                <p className="text-xs text-muted-foreground">Admin Panel</p>
              </div>
            </div>
          </div>

          {/* Menu - TEXT ONLY, NO ICONS */}
          <div className="py-3 px-3">
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const isActive = location.pathname.startsWith(item.url);

                return (
                  <button
                    key={item.title}
                    onClick={() => handleNavigate(item.url)}
                    className={`
                      w-full text-left px-4 py-3 rounded-lg
                      font-medium transition-colors
                      ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent'
                      }
                    `}
                  >
                    {item.title}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </>
    );
  }

  /* ============================================
     DESKTOP VIEW - Collapsible with icons
  ============================================ */
  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="h-16 flex items-center justify-center border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center rounded-xl gradient-primary">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="font-semibold">JinniChirag</h2>
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="py-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location.pathname.startsWith(item.url);
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.title}>
                    <Tooltip delayDuration={200}>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton asChild>
                          <button
                            onClick={() => handleNavigate(item.url)}
                            className={`
                              w-full flex items-center
                              ${collapsed ? 'justify-center px-2' : 'justify-start px-3'}
                              py-2.5 rounded-lg transition-colors
                              ${
                                isActive
                                  ? 'bg-primary text-primary-foreground'
                                  : 'hover:bg-sidebar-accent'
                              }
                            `}
                          >
                            <span className="w-6 h-6 flex items-center justify-center">
                              <Icon className="h-5 w-5" />
                            </span>
                            {!collapsed && (
                              <span className="ml-3 font-medium">{item.title}</span>
                            )}
                          </button>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      {collapsed && (
                        <TooltipContent side="right">{item.title}</TooltipContent>
                      )}
                    </Tooltip>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AdminSidebar;
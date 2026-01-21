import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';

const AdminLayoutContent = () => {
  const { open, setOpen, isMobile } = useSidebar();

  return (
    <>
      {/* MOBILE - Dark overlay, click to close sidebar */}
      {isMobile && open && (
        <div
          className="fixed inset-0 bg-black/60 z-40"
          onClick={() => setOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col min-h-screen">
          <AdminHeader />
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
};

const AdminLayout = () => {
  // Initialize with saved collapsed state for desktop, always closed for mobile
  const getDefaultOpen = () => {
    // For SSR safety, check if window is defined
    if (typeof window === 'undefined') return false;
    
    // Check if mobile (this is a rough check, will be refined by SidebarProvider)
    const isMobileView = window.innerWidth < 768;
    if (isMobileView) return false; // Mobile always starts closed
    
    const saved = localStorage.getItem('admin_sidebar_collapsed');
    // Desktop: default to expanded unless explicitly set to collapsed
    return saved !== 'collapsed';
  };

  return (
    <SidebarProvider defaultOpen={getDefaultOpen()}>
      <AdminLayoutContent />
    </SidebarProvider>
  );
};

export default AdminLayout;
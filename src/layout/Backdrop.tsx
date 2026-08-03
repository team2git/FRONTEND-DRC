import { useSidebar } from "../context/SidebarContext";

const Backdrop: React.FC = () => {
  const { isMobileOpen, toggleMobileSidebar } = useSidebar();

  if (!isMobileOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 bg-brand-950/70 backdrop-blur-[2px] lg:hidden"
      onClick={toggleMobileSidebar}
    />
  );
};

export default Backdrop;

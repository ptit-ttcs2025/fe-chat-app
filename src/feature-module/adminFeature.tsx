import { Outlet } from 'react-router'
import AdminHeader from './admin/common/adminHeader'
import AdminSidebar from './admin/common/adminSidebar'
import ThemeSettings from './admin/common/themeSettings'
import { useDispatch, useSelector } from 'react-redux'
import { setMobileSidebar } from '../core/data/redux/commonSlice'
import { useModalAutoCleanup, useModalNavigationCleanup } from '@/hooks/useModalAutoCleanup'

const AdminFeature = () => {
  const dispatch = useDispatch();
  const miniSidebar = useSelector((state: any) => state.common.miniSidebar);
  const expandMenu = useSelector((state: any) => state.common.expandMenu);
  const mobileSidebar = useSelector((state: any) => state.common.mobileSidebar);
  
  // Cleanup modal khi route thay đổi và khi dùng browser back/forward
  useModalAutoCleanup();
  useModalNavigationCleanup();

  return (
    <div className={`
      ${miniSidebar ? "mini-sidebar" : ""}
      ${expandMenu ? "expand-menu" : ""}`}>

    <div className={`main-wrapper ${mobileSidebar ? "slide-nav" : ""}`}>
      <AdminHeader/>
      <AdminSidebar/>
      <Outlet/>
      <ThemeSettings/>
    </div>
    <div className={`sidebar-overlay ${mobileSidebar ? "opened" : ""}` } onClick={()=>dispatch(setMobileSidebar(false))}></div>
    </div>
  )
}

export default AdminFeature
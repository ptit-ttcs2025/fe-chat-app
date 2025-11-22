

import { Outlet } from "react-router";
import { useModalAutoCleanup, useModalNavigationCleanup } from "@/hooks/useModalAutoCleanup";

const AuthFeature = () => {
  // Cleanup modal khi route thay đổi và khi dùng browser back/forward
  useModalAutoCleanup();
  useModalNavigationCleanup();
  
  return (
    <>
      {/* Main Wrapper */}
      <div className="main-wrapper d-block" style={{ visibility: "visible" }}>
        <Outlet />
      </div>
      {/* /Main Wrapper */}
    </>
  );
};

export default AuthFeature;

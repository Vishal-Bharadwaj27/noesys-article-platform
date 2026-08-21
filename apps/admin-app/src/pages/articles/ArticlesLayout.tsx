import React from "react";
import { Outlet } from "react-router-dom";

export const ArticlesLayout = () => {
  return (
    <div>
      <Outlet />
    </div>
  );
};

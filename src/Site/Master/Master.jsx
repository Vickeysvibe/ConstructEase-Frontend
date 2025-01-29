import React from "react";
import { Outlet, useParams } from "react-router-dom";
import Navbar from "../../Nav/Navbar";
const Master = () => {
  const { companyName, siteId } = useParams();

  return (
    <div>
      <Navbar companyName={companyName} siteId={siteId} />
      <Outlet />
    </div>
  );
};

export default Master;

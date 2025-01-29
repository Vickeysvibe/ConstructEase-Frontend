import React from "react";
import { Outlet } from "react-router-dom";
import PurchaseOrder from "./purchaseComp/PurchaseOrder";
import Navbar from "../../Nav/Navbar";
const Purchase = () => {
  return (
    <div className="bg">
      <Navbar />
      <Outlet />
    </div>
  );
};

export default Purchase;

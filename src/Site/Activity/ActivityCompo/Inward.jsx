import React, { useState, useEffect } from "react";
import "../Activity.css";
import { Link, Outlet } from "react-router-dom";

const Inward = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const material = [
    {
      vendorname: "ragul",
      productid: 101,
      unitshift: 2,
    },
    {
      vendorname: "bhghf",
      productid: 102,
      unitshift: 5,
    },
  ];

  const filteredMaterials = material.filter(
    (item) =>
      item.vendorname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.productid.toString().includes(searchTerm)
  );

  return (
    <main className="inward-main">
      <section>
        <header className="orderHeader">
          <h1>Material Inward</h1>
          <div className="search-bar">
            <div className="search">
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                }}
              />
              <button className="searchbutton">Search</button>
            </div>
            <div className="chooseVendor">
              <Link to={"add-material-inward"}>
                <button>Choose Vendor</button>
              </Link>
            </div>
          </div>
        </header>
        <div className="tablecon">
          {filteredMaterials.map((material, index) => (
            <Link to={"view-material-inward"} key={index}>
              <div className="orders-card">
                <div className="order-cards-detials">
                  <strong>Vendor Name: </strong>
                  <p>{material.vendorname}</p>
                </div>
                <div className="order-cards-detials">
                  <strong>Product Id: </strong>
                  <p>{material.productid}</p>
                </div>
                <div className="order-cards-detials">
                  <strong>Unit shift:</strong>
                  <p>{material.unitshift}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <Outlet />
      </section>
    </main>
  );
};

export default Inward;

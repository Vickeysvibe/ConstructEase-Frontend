import React, { useState, useEffect } from "react";
import "../Activity.css";
import { Link, Outlet, useParams } from "react-router-dom";
import { request } from "../../../api/request";

const Inward = () => {
  const { siteId } = useParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [materialInwards, setMaterialInwards] = useState();

  useEffect(() => {
    const fetchMaterialInwards = async () => {
      const response = await request("GET", `/materials/getMIBySite/siteId=${siteId}`);
      setMaterialInwards(response);
    };
    fetchMaterialInwards();
  }, []);

  const filteredMaterials = materialInwards?.filter((item) =>
    item.vendorName.toLowerCase().includes(searchTerm.toLowerCase())
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
          {filteredMaterials?.map((material, index) => (
            <Link to={material.MIid} key={index}>
              <div className="orders-card">
                <div className="order-cards-detials">
                  <strong>Vendor Name: </strong>
                  <p>{material.vendorName}</p>
                </div>
                <div className="order-cards-detials">
                  <strong>Date: </strong>
                  <p>{new Date(material.date).toLocaleDateString()}</p>
                </div>
                <div className="order-cards-detials">
                  <strong>Order count:</strong>
                  <p>{material.materials}</p>
                </div>
                <div className="order-cards-detials">
                  <strong>Sub-Total :</strong>
                  <p>{material.subTotal}</p>
                </div>
                <div className="order-cards-detials">
                  <strong>Grand-Total:</strong>
                  <p>{material.grandTotal}</p>
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

import React, { useState, useEffect } from "react";
import { Link, Outlet, useParams } from "react-router-dom";
import "./Purchase.css";
import Navbar from "../../Nav/Navbar";
import Details from "./purchaseComp/Details";
import VendorSelection from "./purchaseComp/VendorSelection";
import { request } from "../../api/request";

const PurchseMain = () => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [orders, setOrders] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  const { companyName, siteId: site } = useParams();

  // Fetch orders on initial load
  useEffect(() => {
    const fetchOrders = async () => {
      const response = await request(
        "GET",
        `/purchase/getAllPos?siteId=${site}`
      );
      setOrders(response);
      setFilteredData(response);
    };
    fetchOrders();
  }, []);

  // Search functionality
  useEffect(() => {
    const result = orders.filter((order) =>
      order.vendorName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredData(result);
  }, [searchTerm, orders]);

  return (
    <div>
      <Navbar />
      <main className="purchaseOrder">
        <section className="purchaseOrderSec">
          <header className="orderHeader">
            <h1>Purchase Order</h1>
            <div className="search-bar">
              <div className="search">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="searchbutton">Search</button>
              </div>
              <div className="chooseVendor">
                <button
                  onClick={() => {
                    setOpen(true);
                  }}
                >
                  Choose Vendor
                </button>
              </div>
            </div>
          </header>

          {/* Display Cards for Orders */}
          <div className="tablecon">
            {filteredData.map((order, index) => (
              <Link
                to={`/${companyName}/${site}/purchase/order/details/${order.POid}`}
                key={index}
              >
                <div className="orders-card">
                  <div className="order-cards-detials">
                    <strong>Vendor Name: </strong>
                    <p>{order.vendorName}</p>
                  </div>
                  <div className="order-cards-detials">
                    <strong>Order Count: </strong>
                    <p>{order.orderCount}</p>
                  </div>
                  <div className="order-cards-detials">
                    <strong>Transport: </strong>
                    <p>{order.transport}</p>
                  </div>
                  <div className="order-cards-detials">
                    <strong>Date: </strong>
                    <p>{new Date(order.date).toLocaleDateString()}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pass down state and methods to child components */}
          {open && <VendorSelection close={() => setOpen(false)} />}
          <Outlet />
        </section>
      </main>
    </div>
  );
};

export default PurchseMain;

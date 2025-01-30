import React, { useState, useEffect } from "react";
import { Link, Outlet, useParams } from "react-router-dom";
import "./Purchase.css";
import Navbar from "../../Nav/Navbar";

const PurchseMain = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [rows, setRows] = useState([]);
  const [orders, setOrders] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [orderPost, setOrderPost] = useState({
    siteId: "",
    VendorId: "",
    transport: "",
    date: "",
    order: [],
  });
  const [transport, setTransport] = useState("");
  const [date, setDate] = useState("");
  const [download, setDownload] = useState(false);
  const [vendorDetails, setVendorDetails] = useState({});
  const [ordersList, setOrdersList] = useState([]);
  const [addpopopn, setaddpopopn] = useState(null);

  const { companyName, siteId: site } = useParams();

  const orderhead = [
    "Serial No",
    "Product Name",
    "Order ID",
    "Unit",
    "Category",
  ];

  const vendorData = [
    {
      name: "Vendor One",
      ownerName: "John Doe",
      address: "123 Main St, City",
      gstIn: "GST123456789",
      phoneNo: "123-456-7890",
      siteId: "SITE001",
    },
    {
      name: "Vendor Two",
      ownerName: "Jane Smith",
      address: "456 Elm St, City",
      gstIn: "GST987654321",
      phoneNo: "987-654-3210",
      siteId: "SITE002",
    },
  ];

  const addRow = () => {
    const newRow = {
      id: rows.length + 1,
      ProductName: "",
      Ordercode: "",
      Unit: "",
      Category: "",
    };
    setRows([...rows, newRow]);
  };

  // Fetch orders on initial load
  useEffect(() => {
    const AllOrders = [
      {
        id: 1,
        ProductName: "Bricks",
        Ordercode: "#QvR3ti",
        Unit: "2",
        Category: "Ablock",
      },
    ];
    setOrders(AllOrders);
    setFilteredData(AllOrders);
  }, []);

  // Search functionality
  useEffect(() => {
    const result = orders.filter(
      (order) =>
        order.ProductName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.Ordercode.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredData(result);
  }, [searchTerm, orders]);

  const updateRow = (index, key, value) => {
    const updatedRows = [...rows];
    updatedRows[index][key] = value;
    setRows(updatedRows);
  };

  const addNewOrders = () => {
    const validRows = rows.filter(
      (row) =>
        row.ProductName.trim() !== "" &&
        row.Ordercode.trim() !== "" &&
        row.Unit.trim() !== "" &&
        row.Category.trim() !== ""
    );
    if (validRows.length > 0) {
      const updatedOrders = [...orders, ...validRows];
      setOrders(updatedOrders);
      setFilteredData(updatedOrders);
      setRows([]);
      setOrdersList(validRows);
      console.log(orderPost);
    } else {
      alert("No value");
    }
  };

  const vendorChoose = (event) => {
    const selectedIdx = event.target.selectedIndex - 1;
    if (selectedIdx >= 0) {
      setVendorDetails(vendorData[selectedIdx]);
    }
  };
  console.log(vendorDetails);
  const addOrderPost = () => {
    setOrderPost((prevOrderPost) => ({
      ...prevOrderPost,
      VendorId: vendorDetails.siteId,
      transport,
      date,
      order: ordersList,
    }));
    setDownload(true);
  };

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
                <Link to={"vendor-selection"}>
                  <button>Choose Vendor</button>
                </Link>
              </div>
            </div>
          </header>

          {/* Display Cards for Orders */}
          <div className="tablecon">
            {filteredData.map((order, index) => (
              <Link
                to={`/${companyName}/${site}/purchase/order/details`}
                key={index}
              >
                <div className="orders-card" onClick={() => setaddpopopn(1)}>
                  <div className="order-cards-detials">
                    <strong>Vendor Name: </strong>
                    <p>{order.ProductName}</p>
                  </div>
                  <div className="order-cards-detials">
                    <strong>Product Id: </strong>
                    <p>{order.Ordercode}</p>
                  </div>
                  <div className="order-cards-detials">
                    <strong>Total Unit: </strong>
                    <p>{order.Unit}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pass down state and methods to child components */}
          <Outlet
            context={{
              state: {
                searchTerm,
                filteredData,
                rows,
                orders,
                orderPost,
                transport,
                date,
                vendorData,
                vendorDetails,
                ordersList,
                download,
              },
              setState: {
                setSearchTerm,
                setRows,
                setOrders,
                setFilteredData,
                setOrderPost,
                setTransport,
                setDate,
                setDownload,
                setVendorDetails,
                setOrdersList,
              },
              methods: {
                addRow,
                updateRow,
                addNewOrders,
                vendorChoose,
                addOrderPost,
              },
            }}
          />
        </section>
      </main>
    </div>
  );
};

export default PurchseMain;

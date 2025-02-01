import React, { useState, useEffect } from "react";
import "../Purchase.css";
import { RxCrossCircled } from "react-icons/rx";
import format from "../../../assets/format.webp";
const PurchaseOrder = () => {
  const orderhead = [
    "Serial No",
    "Product Name",
    "Order ID",
    "Unit",
    "Category",
  ];

  const [searchTerm, setSearchTerm] = useState("");
  const [addpopopn, setaddpopopn] = useState(null);
  const [filteredData, setFilteredData] = useState([]);
  const [orders, setOrders] = useState([]);
  const [rows, setRows] = useState([]);

  const AllOrders = [
    {
      id: 1,
      ProductName: "Bricks",
      Ordercode: "#QvR3ti",
      Unit: "2",
      Category: "Ablock",
    },
  ];
  //-----------------------add-new-row------------------------------
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

  useEffect(() => {
    setOrders(AllOrders);
    setFilteredData(AllOrders);
  }, []);
  // ---------------------------search-------------------------
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
  // --------------------------New-row-in-cards---------------------------

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
      setOrderaList(validRows); // This updates ordersList
    } else {
      alert("No value");
    }
  };
  // -----------------------Date-------------------------------
  function getDate() {
    const today = new Date();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    const date = today.getDate();
    return `${date}/${month}/${year}`;
  }
  const [currentDate, setCurrentDate] = useState(getDate());

  // ------------------------vendor-name-----------------
  const vendor = [
    "Enter the vendor",
    "vendor1",
    "vendor2",
    "vendor3",
    "vendor4",
  ];

  // --------------------------vendor-detials------------------
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
    // Add more vendors as needed
  ];
  const [details, setDetails] = useState([]);

  const vendorChoose = (event) => {
    const selectedIdx = event.target.selectedIndex - 1;
    if (selectedIdx >= 0) {
      setDetails(vendorData[selectedIdx]); // This will trigger the useEffect to log
    }
  };
  // full-details-------------

  const [ordersList, setOrderaList] = useState([]);

  const [orderPost, setOrderPost] = useState(
    {
      siteId: 1,
      VendorId: 101,
      transport: "Car",
      date: "22/1/2024",
      order: [
        {
          Category: "brick",
          Ordercode: "101",
          productName: "brick",
          Unit: "2",
          id: 1,
        },
        {
          Category: "sand",
          Ordercode: "102",
          productName: "sand",
          Unit: "4",
          id: 2,
        },
      ],
    },
    {
      siteId: "",
      VendorId: "",
      transport: "",
      date: "",
      order: [],
    }
  );
  const [transport, setTransport] = useState();
  const [date, setDate] = useState();
  const addOrderPost = () => {
    setOrderPost((prevOrderPost) => ({
      ...prevOrderPost,
      VendorId: details.siteId,
      transport: transport,
      date: date,
      order: ordersList,
    }));
    setDownload(true);
  };

  useEffect(() => {
    console.log("Updated orderPost:", orderPost);
  }, [orderPost]);

  // ------------------------download---------------
  const [download, setDownload] = useState(false);

  return (
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
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                }}
              />
              <button className="searchbutton">Search</button>
            </div>
            <div className="chooseVendor">
              <button onClick={() => setaddpopopn(0)}>Choose Vendor</button>
            </div>
          </div>
        </header>
        <div className="tablecon">
          {filteredData.map((order, index) => (
            <div
              className="orders-card"
              key={index}
              onClick={() => setaddpopopn(1)}
            >
              <div className="order-cards-detials">
                <strong>Vendor Name: </strong>
                <p>{order.ProductName}</p>
              </div>
              <div className="order-cards-detials">
                <strong>Product Id: </strong>
                <p>{order.Ordercode}</p>
              </div>
              <div className="order-cards-detials">
                <strong>Toatal Unit: </strong>
                <p>{order.Unit}</p>
              </div>
              {/* <p>{order.Ordercode}</p> */}
            </div>
          ))}
        </div>
      </section>
      {addpopopn === 0 ? (
        <article className="purchasepopupcon">
          <div className="purchasepopupinner">
            <div className="chooseing-card">
              <header>
                <div className="header-top">
                  <h3>#xgcfhj</h3>
                  <div className="date">{currentDate}</div>
                  <div className="cross">
                    <p
                      onClick={() => {
                        setaddpopopn(null);
                        setDetails([]);
                      }}
                    >
                      <RxCrossCircled />
                    </p>
                  </div>
                </div>
                <div className="header-bottom">
                  <h1>PURCHASE ORDER</h1>
                </div>
              </header>
              <div className="selection">
                <div className="vendor-selection">
                  <div className="vendor-details">
                    {/* <label for="dropdown">Choose an option:</label> */}
                    <select
                      id="dropdown"
                      name="dropdown"
                      onChange={vendorChoose}
                    >
                      {/* <option disabled selected>
                      Enter the vendor
                    </option> */}
                      {vendor.map((drop, index) => (
                        <option key={index} value={drop}>
                          {drop}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      placeholder="Address"
                      value={details.address}
                    />
                    <input
                      type="text"
                      placeholder="GST Number"
                      value={details.gstIn}
                    />
                  </div>
                  <div className="shipping-details">
                    <input
                      type="text"
                      placeholder="Enter the Shipped to site"
                      value={details.siteId}
                    />
                    <input
                      type="text"
                      placeholder="Enter the transport"
                      onChange={(e) => {
                        setTransport(e.target.value);
                      }}
                    />
                    <input
                      type="date"
                      onChange={(e) => {
                        setDate(e.target.value);
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="table">
              <table className="purchasetable purchasetablepopup">
                <thead>
                  <tr className="labhead">
                    {orderhead.map((header, index) => (
                      <th className=" purchasepopupth" key={index}>
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={row.id}>
                      <td className="purchasepopuptd">{index + 1}</td>
                      <td
                        className="purchasepopuptd"
                        contentEditable="true"
                        onBlur={(e) =>
                          updateRow(index, "ProductName", e.target.innerText)
                        }
                      >
                        {row.ProductName}
                      </td>
                      <td
                        className="purchasepopuptd"
                        contentEditable="true"
                        onBlur={(e) =>
                          updateRow(index, "Ordercode", e.target.innerText)
                        }
                      >
                        {row.Ordercode}
                      </td>
                      <td
                        className="purchasepopuptd"
                        contentEditable="true"
                        onBlur={(e) =>
                          updateRow(index, "Unit", e.target.innerText)
                        }
                      >
                        {row.Unit}
                      </td>
                      <td
                        className="purchasepopuptd"
                        contentEditable="true"
                        onBlur={(e) =>
                          updateRow(index, "Category", e.target.innerText)
                        }
                      >
                        {row.Category}
                      </td>
                    </tr>
                  ))}
                  <tr className="addrow">
                    <td
                      className="purchasetd purchaseaddrow"
                      colSpan={3}
                      onClick={addRow}
                    >
                      New Row +
                    </td>
                    <td
                      className="purchasetd purchaseclosepopup"
                      onClick={addNewOrders}
                    >
                      Add
                    </td>
                    <td
                      className="purchasetd purchaseclosepopup"
                      onClick={() => setaddpopopn(false)}
                    >
                      Close
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="btn">
              <button className="conform-btn" onClick={addOrderPost}>
                Conform
              </button>
            </div>
          </div>
          <div />
        </article>
      ) : addpopopn === 1 ? (
        <article className="purchasepopupcon">
          <div className="purchasepopupinner">
            <div className="chooseing-card">
              <header>
                <div className="header-top">
                  <h3>#xgcfhj</h3>
                  {/* <div className="date">{orderPost.date}</div> */}
                  <div className="cross">
                    <p
                      onClick={() => {
                        setaddpopopn(null);
                        setDetails([]);
                      }}
                    >
                      <RxCrossCircled />
                    </p>
                  </div>
                </div>
                <div className="header-bottom">
                  <h1>PURCHASE ORDER DETAILS</h1>
                </div>
              </header>
              <div className="selection">
                <div className="vendor-selection">
                  <div className="vendor-details">
                    <div className="show">
                      <p>{orderPost.VendorId}</p>
                    </div>
                    <input
                      type="text"
                      placeholder="Address"
                      value={details.address}
                    />
                    <input
                      type="text"
                      placeholder="GST Number"
                      value={details.gstIn}
                    />
                  </div>
                  <div className="shipping-details">
                    <input
                      type="text"
                      placeholder="Enter the Shipped to site"
                      value={details.siteId}
                    />
                    <input
                      type="text"
                      placeholder="Enter the transport"
                      onChange={(e) => {
                        setTransport(e.target.value);
                      }}
                    />
                    <input
                      type="date"
                      onChange={(e) => {
                        setDate(e.target.value);
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="table">
              <table className="purchasetable purchasetablepopup ">
                <thead>
                  <tr className="labhead">
                    {orderhead.map((header, index) => (
                      <th className=" purchasepopupth" key={index}>
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orderPost.order.map((orderslists, index) => (
                    <tr key={index}>
                      <td>{orderslists.id}</td>
                      <td>{orderslists.productName}</td>
                      <td>{orderslists.Ordercode}</td>
                      <td>{orderslists.Unit}</td>
                      <td>{orderslists.Category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="btn">
              <button className="conform-btn" onClick={addOrderPost}>
                Conform
              </button>
            </div>
          </div>
        </article>
      ) : (
        <></>
      )}
      {download && (
        <article className="download-pg">
          <div className="download-sec">
            <header>
              <div className="heading">
                <h1>Download Formats</h1>
                <p
                  onClick={() => {
                    setDownload(false);
                  }}
                >
                  X
                </p>
              </div>

              <p>Select a option for download format.</p>
            </header>
            <div className="download-contaniner">
              <div className="download-card">
                <img src={format} alt="format" />
                <h3>Format 1</h3>
              </div>
              <div className="download-card">
                <img src={format} alt="format" />
                <h3>Format 2</h3>
              </div>
              <div className="download-card">
                <img src={format} alt="format" />
                <h3>Format 3</h3>
              </div>
            </div>
          </div>
        </article>
      )}
    </main>
  );
};

export default PurchaseOrder;

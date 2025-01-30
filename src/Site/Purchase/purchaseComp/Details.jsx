import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { RxCrossCircled } from "react-icons/rx";

const Details = () => {
  const {
    state: {
      orderPost,
      vendorDetails,
      transport,
      date,
      ordersList,
      download,
    },
    setState: {
      setOrderPost,
      setVendorDetails,
      setTransport,
      setDate,
      setDownload,
    },
    methods: { addOrderPost },
  } = useOutletContext();

  const [orderDate, setOrderDate] = useState(date);
  const [orderTransport, setOrderTransport] = useState(transport);

  const handleSave = () => {
    // addOrderPost();
    setDownload(true);
    // You can add further save functionality here
  };

  return (
    <article className="purchasepopupcon">
      <div className="purchasepopupinner">
        <div className="chooseing-card">
          <header>
            <div className="header-top">
              <h3>{vendorDetails.name}</h3>
              <div className="cross">
                <p
                  onClick={() => {
                    setOrderPost({}); // Clear order post or handle logic
                    setVendorDetails({});
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
                  <p>{vendorDetails.name}</p>
                </div>
                <input
                  type="text"
                  placeholder="Address"
                  value={vendorDetails.address}
                  readOnly
                />
                <input
                  type="text"
                  placeholder="GST Number"
                  value={vendorDetails.gstIn}
                  readOnly
                />
              </div>
              <div className="shipping-details">
                <input
                  type="text"
                  placeholder="Enter the Shipped to site"
                  value={orderPost.siteId}
                  readOnly
                />
                <input
                  type="text"
                  placeholder="Enter the transport"
                  value={orderTransport}
                  onChange={(e) => setOrderTransport(e.target.value)}
                />
                <input
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="table">
          <table className="purchasetable purchasetablepopup">
            <thead>
              <tr className="labhead">
                {["ID", "Product", "Order Code", "Unit", "Category"].map(
                  (header, index) => (
                    <th className="purchasepopupth" key={index}>
                      {header}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {ordersList.map((order, index) => (
                <tr key={index}>
                  <td>{order.id}</td>
                  <td>{order.ProductName}</td>
                  <td>{order.Ordercode}</td>
                  <td>{order.Unit}</td>
                  <td>{order.Category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="btn">
          <button className="conform-btn" onClick={handleSave}>
            Confirm
          </button>
        </div>
      </div>
    </article>
  );
};

export default Details;

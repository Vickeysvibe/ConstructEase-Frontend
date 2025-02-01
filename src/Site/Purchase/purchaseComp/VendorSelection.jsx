import React, { useEffect, useState } from "react";
import { Link, Navigate, useOutletContext, useParams } from "react-router-dom"; // Add this import
import { RxCrossCircled } from "react-icons/rx";
import { request } from "../../../api/request";

const VendorSelection = ({ close }) => {
  const { companyName, siteId: site } = useParams();
  const [details, setDetails] = useState({ vendors: [], products: [] });
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [rows, setRows] = useState([]);
  const [transport, setTransport] = useState("");
  const [date, setDate] = useState("");

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await request(
          "GET",
          `/purchase/create/details?siteId=${site}`
        );
        setDetails(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [site]);

  // Add a new row for product selection
  const addRow = () => {
    setRows((prevRows) => [
      ...prevRows,
      { id: "", name: "", category: "", unit: "", requiredQty: "" },
    ]);
  };

  // Handle product selection
  const updateRow = (e, index) => {
    const product = details.products.find(
      (prod) => prod._id === e.target.value
    );
    if (!product) return;

    setRows((prevRows) =>
      prevRows.map((row, i) =>
        i === index
          ? {
              ...row,
              id: product._id,
              name: product.name,
              category: product.category,
              unit: product.unit,
            }
          : row
      )
    );
  };

  // Handle quantity input change
  const reqqty = (e, index) => {
    setRows((prevRows) =>
      prevRows.map((row, i) =>
        i === index ? { ...row, requiredQty: e.target.innerText.trim() } : row
      )
    );
  };

  // Validate and submit the order
  const addNewOrders = async () => {
    if (!selectedVendor) return alert("Please select a vendor.");
    if (!transport.trim()) return alert("Please enter transport details.");
    if (!date.trim()) return alert("Please select a date.");
    if (rows.length === 0) return alert("Please add at least one product.");
    if (rows.some((row) => !row.id || !row.requiredQty.trim()))
      return alert("Please fill all product details.");

    const order = rows.map(({ id, requiredQty }) => ({
      productId: id,
      requiredQty,
    }));
    const orderData = {
      siteId: site,
      vendorId: selectedVendor._id,
      transport,
      date,
      order,
    };

    console.log("Final Order Data:", orderData);
    // Send the data to backend via API request
    const response = await request(
      "POST",
      `/purchase/createPo?siteId=${site}`,
      orderData,
      {
        responseType: "blob",
      }
    );
    // Create a Blob from the response
    const blob = new Blob([response.data], { type: "application/pdf" });
    // Create a download link and trigger download
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = "purchase_order.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link); // Cleanup
    if (response.status === 200) {
      Navigate(`/${companyName}/${site}/purchase/order`);
    } else {
      alert("Failed to create order.");
    }
  };

  return (
    <article className="purchasepopupcon">
      <div className="purchasepopupinner">
        <div className="chooseing-card">
          <header>
            <div className="header-top">
              <h3>#xgcfhj</h3>
              <div className="date">{new Date().toLocaleDateString()}</div>
              <div className="cross">
                <p onClick={close}>
                  {" "}
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
                <select
                  id="dropdown"
                  name="dropdown"
                  onChange={(e) =>
                    setSelectedVendor(
                      details.vendors.find((t) => t._id === e.target.value)
                    )
                  }
                >
                  <option disabled selected>
                    Choose Vendor
                  </option>
                  {details?.vendors?.length > 0 ? (
                    details.vendors.map((vendor, index) => (
                      <option key={vendor._id} value={vendor._id}>
                        {vendor.name}
                      </option>
                    ))
                  ) : (
                    <option disabled>No vendors available</option>
                  )}
                </select>

                <input
                  type="text"
                  placeholder="Address"
                  value={selectedVendor?.address}
                  readOnly
                />
                <input
                  type="text"
                  placeholder="GST Number"
                  value={selectedVendor?.gstIn}
                  readOnly
                />
              </div>

              <div className="shipping-details">
                <input
                  type="text"
                  placeholder="Enter the Shipped to site"
                  value={site}
                  readOnly
                />
                <input
                  type="text"
                  placeholder="Enter the transport"
                  value={transport}
                  onChange={(e) => setTransport(e.target.value)}
                />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table to display orders */}
        <div className="table">
          <table className="purchasetable purchasetablepopup">
            <thead>
              <tr className="labhead">
                <th className="purchasepopupth">Serial No</th>
                <th className="purchasepopupth">Product Name</th>
                <th className="purchasepopupth">Category</th>
                <th className="purchasepopupth">Unit</th>
                <th className="purchasepopupth">Required Qty</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id}>
                  <td className="purchasepopuptd">{index + 1}</td>
                  <td className="purchasepopuptd">
                    <select
                      id="productDropdown"
                      defaultValue=""
                      value={row.id}
                      onChange={(e) => updateRow(e, index)}
                    >
                      <option value={row.name} disabled>
                        Choose product
                      </option>
                      {details.products.length ? (
                        details.products.map((prod) => (
                          <option key={prod._id} value={prod._id}>
                            {prod.name}
                          </option>
                        ))
                      ) : (
                        <option disabled>No products available</option>
                      )}
                    </select>
                  </td>
                  <td className="purchasepopuptd">{row.category}</td>
                  <td className="purchasepopuptd">{row.unit}</td>
                  <td
                    className="purchasepopuptd"
                    contentEditable="true"
                    onBlur={(e) => reqqty(e, index)}
                  >
                    {row.requiredQty}
                  </td>
                </tr>
              ))}
              <tr className="addrow">
                <td
                  className="purchasetd purchaseaddrow"
                  colSpan={5}
                  onClick={addRow}
                >
                  New Row +
                </td>
                {/* <td
                  className="purchasetd purchaseclosepopup"
                  onClick={addNewOrders}
                >
                  Add
                </td>
                <td
                  className="purchasetd purchaseclosepopup"
                  onClick={() => {
                    // Close popup logic
                  }}
                >
                  Close
                </td> */}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Conform Button */}
        <div className="btn">
          <button className="conform-btn" onClick={addNewOrders}>
            Confirm
          </button>
        </div>
      </div>
    </article>
  );
};

export default VendorSelection;

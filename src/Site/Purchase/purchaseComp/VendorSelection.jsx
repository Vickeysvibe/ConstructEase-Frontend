import React from "react";
import { Link, useOutletContext, useParams } from "react-router-dom"; // Add this import
import { RxCrossCircled } from "react-icons/rx";

const VendorSelection = () => {
  const { companyName, siteId: site } = useParams();
  // Accessing context from the Outlet
  const { state, setState, methods } = useOutletContext();
  const { vendorData = [], vendorDetails, transport, date, rows } = state; // default empty array
  const { setVendorDetails, setTransport, setDate } = setState;
  const { vendorChoose, addRow, updateRow, addNewOrders, addOrderPost } =
    methods;

  const { address, gstIn, siteId } = vendorDetails;

  return (
    <article className="purchasepopupcon">
      <div className="purchasepopupinner">
        <div className="chooseing-card">
          <header>
            <div className="header-top">
              <h3>#xgcfhj</h3>
              <div className="date">{new Date().toLocaleDateString()}</div>
              <div className="cross">
                <Link to={`/${companyName}/${site}/purchase`}>
                  <p>
                    {" "}
                    <RxCrossCircled />
                  </p>
                </Link>
              </div>
            </div>
            <div className="header-bottom">
              <h1>PURCHASE ORDER</h1>
            </div>
          </header>

          <div className="selection">
            <div className="vendor-selection">
              <div className="vendor-details">
                <select id="dropdown" name="dropdown" onChange={vendorChoose}>
                  <option disabled selected>
                    Choose Vendor
                  </option>
                  {vendorData.length > 0 ? (
                    vendorData.map((vendor, index) => (
                      <option key={index} value={vendor.siteId}>
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
                  value={address}
                  readOnly
                />
                <input
                  type="text"
                  placeholder="GST Number"
                  value={gstIn}
                  readOnly
                />
              </div>

              <div className="shipping-details">
                <input
                  type="text"
                  placeholder="Enter the Shipped to site"
                  value={siteId}
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
                <th className="purchasepopupth">Order ID</th>
                <th className="purchasepopupth">Unit</th>
                <th className="purchasepopupth">Category</th>
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
                    onBlur={(e) => updateRow(index, "Unit", e.target.innerText)}
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
                  onClick={() => {
                    // Close popup logic
                  }}
                >
                  Close
                </td>
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

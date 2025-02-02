import React, { useState } from "react";
import { Link } from "react-router-dom";
import { RxCrossCircled } from "react-icons/rx";
import { FaRegEdit, FaSave } from "react-icons/fa";

const VendorSelection = () => {
  const tableHeaders = [
    "Serial No",
    "Product Name",
    "Details",
    "Req. Qty",
    "Unit",
    "Supplied Qty",
    "Unit Price",
    "Sub Total",
    "Edit",
  ];

  const initialData = [
    {
      serialNo: 1,
      productName: "Cement",
      details: "50kg bag, Grade 43",
      reqQty: 100,
      unit: "Bags",
      suppliedQty: 90,
      unitPrice: 350,
      subtotal: 90 * 350,
    },
    {
      serialNo: 2,
      productName: "Steel Rods",
      details: "TMT 12mm",
      reqQty: 50,
      unit: "Kg",
      suppliedQty: 50,
      unitPrice: 600,
      subtotal: 50 * 600,
    },
    {
      serialNo: 3,
      productName: "Bricks",
      details: "Red Clay Bricks",
      reqQty: 500,
      unit: "Pieces",
      suppliedQty: 480,
      unitPrice: 8,
      subtotal: 480 * 8,
    },
  ];

  const Orders = [
    {
      siteId: "001",
      VendorId: "V1001",
      transport: "Truck",
      date: "2025-01-30",
      order: [
        { itemId: "I001", itemName: "Cement", quantity: 100, unit: "Bags" },
        { itemId: "I002", itemName: "Steel Rods", quantity: 50, unit: "Kg" },
      ],
    },
    {
      siteId: "002",
      VendorId: "V1002",
      transport: "Ship",
      date: "2025-02-01",
      order: [
        { itemId: "I003", itemName: "Bricks", quantity: 500, unit: "Pieces" },
        { itemId: "I004", itemName: "Sand", quantity: 200, unit: "Kg" },
      ],
    },
    {
      siteId: "003",
      VendorId: "V1003",
      transport: "Air",
      date: "2025-02-05",
      order: [
        {
          itemId: "I005",
          itemName: "Glass Panels",
          quantity: 20,
          unit: "Sheets",
        },
      ],
    },
    ,
    {
      siteId: "003",
      VendorId: "V1003",
      transport: "Air",
      date: "2025-02-05",
      order: [
        {
          itemId: "I005",
          itemName: "Glass Panels",
          quantity: 20,
          unit: "Sheets",
        },
      ],
    },
    ,
    {
      siteId: "003",
      VendorId: "V1003",
      transport: "Air",
      date: "2025-02-05",
      order: [
        {
          itemId: "I005",
          itemName: "Glass Panels",
          quantity: 20,
          unit: "Sheets",
        },
      ],
    },
  ];

  const [tableData, setTableData] = useState(initialData);
  const [editIndex, setEditIndex] = useState(null);

  // Calculate Grand Sub Total
  const grandSubTotal = tableData.reduce((acc, row) => acc + row.subtotal, 0);

  // Handle contentEditable changes
  const handleInputChange = (index, field, value) => {
    const newData = [...tableData];
    newData[index][field] = value ? parseFloat(value) : 0;
    newData[index].subtotal =
      newData[index].suppliedQty * newData[index].unitPrice; // Update subtotal
    setTableData(newData);
  };

  // Handle Edit/Save button click
  const handleEditClick = (index) => {
    if (editIndex === index) {
      // Save changes to initial array
      setEditIndex(null);
    } else {
      setEditIndex(index); // Enter edit mode
    }
  };

  //   ------------gst-total--------
  const [gst, setGst] = useState(1);
  const total = grandSubTotal * gst;

  
  return (
    <article className="addinward-container">
      <div className="addinward-popup-inner">
        <div className="addinward-card">
          <header>
            <div className="addinward-header-top">
              <h3>#xgcfhj</h3>
              <div className="addinward-date">1/01/2024</div>
              <div className="addinward-cross">
                <Link to={"purchase"}>
                  <p>
                    <RxCrossCircled />
                  </p>
                </Link>
              </div>
            </div>
            <div className="addinward-header-bottom">
              <h1>Inward</h1>
            </div>
          </header>
        </div>
        <div className="scroll">
          <div className="addinward-selection">
            {Orders.map((details, index) => (
              <div className="addinward-vendor-details" key={index}>
                <div className="show">
                  <p>{details.VendorId}</p>
                </div>
                <div className="show">
                  <p>{details.transport}</p>
                </div>
                <div className="show">
                  <p>{details.siteId}</p>
                </div>
              </div>
            ))}
          </div>
          {/* Table to display orders */}
          <div className="addinward-table">
            <table className="addinward-purchase-table">
              <thead>
                <tr className="addinward-table-header">
                  {tableHeaders.map((header, index) => (
                    <th key={index} className="addinward-th">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, index) => (
                  <tr key={index}>
                    <td className="addinward-td">{row.serialNo}</td>
                    <td className="addinward-td">{row.productName}</td>
                    <td className="addinward-td">{row.details}</td>
                    <td className="addinward-td">{row.reqQty}</td>
                    <td className="addinward-td">{row.unit}</td>

                    {/* Editable Supplied Qty */}
                    <td
                      className="addinward-td"
                      contentEditable={editIndex === index}
                      suppressContentEditableWarning={true}
                      onBlur={(e) =>
                        handleInputChange(
                          index,
                          "suppliedQty",
                          e.target.innerText
                        )
                      }
                    >
                      {row.suppliedQty}
                    </td>

                    {/* Editable Unit Price */}
                    <td
                      className="addinward-td"
                      contentEditable={editIndex === index}
                      suppressContentEditableWarning={true}
                      onBlur={(e) =>
                        handleInputChange(
                          index,
                          "unitPrice",
                          e.target.innerText
                        )
                      }
                    >
                      {row.unitPrice}
                    </td>

                    {/* Subtotal */}
                    <td className="addinward-td">{row.subtotal}</td>

                    {/* Edit/Save Button */}
                    <td
                      className="addinward-td lchid"
                      onClick={() => handleEditClick(index)}
                    >
                      {editIndex === index ? <FaSave /> : <FaRegEdit />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Grand Sub Total Calculation */}
          <div className="total">
            <div className="total-field">
              <input
                type="text"
                value={`Grand Sub Total : ${grandSubTotal}`}
                readOnly
              />
            </div>
            <div className="total-field">
              <input
                type="text"
                placeholder="GST"
                value={gst} // Display the current GST value
                onChange={(e) =>
                  setGst(e.target.value ? parseFloat(e.target.value) : "")
                }
              />
            </div>
            <div className="total-field">
              <input type="text" value={`Grand Total : ${total}`} readOnly />
            </div>
          </div>

          {/* Confirm Button */}
          <div className="addinward-btn">
            <button className="addinward-confirm-btn">Confirm</button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default VendorSelection;

import React, { useState } from "react";
import { RxCrossCircled } from "react-icons/rx";

const Outward = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [tableData, setTableData] = useState([
    {
      slNo: 1,
      product: "Product A",
      total: 100,
      currentStock: 50,
      usedStock: 30,
    },
    {
      slNo: 2,
      product: "Product B",
      total: 200,
      currentStock: 150,
      usedStock: 70,
    },
    {
      slNo: 3,
      product: "Product C",
      total: 150,
      currentStock: 100,
      usedStock: 50,
    },
    {
      slNo: 4,
      product: "Product D",
      total: 300,
      currentStock: 250,
      usedStock: 100,
    },
    {
      slNo: 5,
      product: "Product E",
      total: 120,
      currentStock: 80,
      usedStock: 40,
    },
    {
      slNo: 1,
      product: "Product A",
      total: 100,
      currentStock: 50,
      usedStock: 30,
    },
    {
      slNo: 2,
      product: "Product B",
      total: 200,
      currentStock: 150,
      usedStock: 70,
    },
    {
      slNo: 3,
      product: "Product C",
      total: 150,
      currentStock: 100,
      usedStock: 50,
    },
    {
      slNo: 4,
      product: "Product D",
      total: 300,
      currentStock: 250,
      usedStock: 100,
    },
    {
      slNo: 5,
      product: "Product E",
      total: 120,
      currentStock: 80,
      usedStock: 40,
    },
    {
      slNo: 1,
      product: "Product A",
      total: 100,
      currentStock: 50,
      usedStock: 30,
    },
    {
      slNo: 2,
      product: "Product B",
      total: 200,
      currentStock: 150,
      usedStock: 70,
    },
    {
      slNo: 3,
      product: "Product C",
      total: 150,
      currentStock: 100,
      usedStock: 50,
    },
    {
      slNo: 4,
      product: "Product D",
      total: 300,
      currentStock: 250,
      usedStock: 100,
    },
    {
      slNo: 5,
      product: "Product E",
      total: 120,
      currentStock: 80,
      usedStock: 40,
    },
    {
      slNo: 4,
      product: "Product D",
      total: 300,
      currentStock: 250,
      usedStock: 100,
    },
  ]);

  // Filter table data only by product name
  const filteredData = tableData.filter((item) =>
    item.product.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle input change for "Used Stock"
  const handleStockChange = (e, index) => {
    const newUsedStock = Number(e.target.value); // Convert to number

    setTableData((prevData) =>
      prevData.map((item, i) => {
        if (i === index) {
          const updatedUsedStock = Math.min(newUsedStock, item.total); // Ensure it does not exceed Total
          const updatedCurrentStock = item.total - updatedUsedStock; // Adjust Current Stock

          return {
            ...item,
            usedStock: updatedUsedStock,
            currentStock: updatedCurrentStock,
          };
        }
        return item;
      })
    );
  };
  const [addOutward, setAddOutward] = useState(false);
  return (
    <main className="outward-main">
      {addOutward && (
        <div className="add-outward-pg">
          <div className="outward-card">
            <header>
              <h2>Add outward</h2>
              <p onClick={()=>{setAddOutward(false)}}><RxCrossCircled /></p>
            </header>
            <div className="container">
              <input type="text" placeholder="Enter the Product Name"/>
              <input type="text" placeholder="Enter the Used Qty"/>
            </div>
            <div className="btn">
              <button onClick={()=>{setAddOutward(false)}}>Add</button>
            </div>
          </div>
        </div>
      )}
      <section>
        <header className="outward-header">
          <h1>Material Outward</h1>
          <div className="outward-search-bar">
            <div className="outward-search">
              <input
                type="text"
                placeholder="Search by Product Name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="outward-search-button">Search</button>
            </div>
            <div className="outward-vendor-actions">
              <button className="outward-download-button">Download</button>
              <button className="outward-add-button" onClick={()=>{setAddOutward(true)}}>Add</button>
              <button
                className="outward-edit-button"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? "Save" : "Edit"}
              </button>
            </div>
          </div>
        </header>
        <div className="outward-table-container">
          <table className="outward-purchase-table">
            <thead>
              <tr className="outward-table-header">
                <th className="outward-th">Sl.no</th>
                <th className="outward-th">Product</th>
                <th className="outward-th">Total</th>
                <th className="outward-th">Current Stock</th>
                <th className="outward-th">Used Stock</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((item, index) => (
                  <tr key={item.slNo} className="outward-table-row">
                    <td className="outward-td">{item.slNo}</td>
                    <td className="outward-td">{item.product}</td>
                    <td className="outward-td">{item.total}</td>
                    <td className="outward-td">{item.currentStock}</td>
                    <td className="outward-td">
                      {isEditing ? (
                        <input
                          type="number"
                          value={item.usedStock}
                          onChange={(e) => handleStockChange(e, index)}
                          className="edit-input"
                        />
                      ) : (
                        item.usedStock
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="outward-td">
                    No results found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
};

export default Outward;

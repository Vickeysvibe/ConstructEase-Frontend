import React, { useState, useEffect } from "react";
import { RxCrossCircled } from "react-icons/rx";
import { useParams } from "react-router-dom";
import { request } from "../../../api/request";

const Outward = () => {
  const { siteId } = useParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [addOutward, setAddOutward] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true); // Loading state

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setLoading(true);
        const data = await request("GET", `/materials/getMaterials/${siteId}`);
        setTableData(data);
      } catch (error) {
        console.error("Error fetching materials:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMaterials();
  }, [siteId]);

  // Handle change in used stock input
  const handleStockChange = (e, index) => {
    const newUsedStock = Number(e.target.value);
    setTableData((prevData) =>
      prevData.map((item, i) => {
        if (i === index) {
          const updatedUsedStock = Math.min(newUsedStock, item.suppliedQty); // Prevent exceeding supply
          const updatedAvailableQty = item.suppliedQty - updatedUsedStock;
          return {
            ...item,
            usedQty: updatedUsedStock,
            availableQty: updatedAvailableQty,
          };
        }
        return item;
      })
    );
  };

  // Save stock changes to backend
  const saveStockChanges = async () => {
    try {
      for (const material of tableData) {
        await request("PUT", `/materials/editUse/${material.matId}`, {
          usedQty: material.usedQty, // Correct value
        });
      }
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating stock:", error);
      alert("Failed to update stock!");
    }
  };

  const filteredData = tableData.filter((item) =>
    item?.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="outward-main">
      {/* Add Outward Popup */}
      {addOutward && (
        <div className="add-outward-pg">
          <div className="outward-card">
            <header>
              <h2>Add Outward</h2>
              <p onClick={() => setAddOutward(false)}>
                <RxCrossCircled />
              </p>
            </header>
            <div className="container">
              <input type="text" placeholder="Enter Product Name" />
              <input type="number" placeholder="Enter Used Qty" />
            </div>
            <div className="btn">
              <button onClick={() => setAddOutward(false)}>Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Section */}
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
              <button
                className="outward-edit-button"
                onClick={() =>
                  isEditing ? saveStockChanges() : setIsEditing(true)
                }
              >
                {isEditing ? "Save" : "Edit"}
              </button>
            </div>
          </div>
        </header>

        {/* Table Container */}
        <div className="outward-table-container">
          {loading ? (
            <p>Loading materials...</p>
          ) : (
            <table className="outward-purchase-table">
              <thead>
                <tr className="outward-table-header">
                  <th className="outward-th">Sl.no</th>
                  <th className="outward-th">Product</th>
                  <th className="outward-th">From Vendor</th>
                  <th className="outward-th">Supplied Qty</th>
                  <th className="outward-th">Available Qty</th>
                  <th className="outward-th">Used Qty</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map((item, index) => (
                    <tr key={item.matId} className="outward-table-row">
                      <td className="outward-td">{index + 1}</td>
                      <td className="outward-td">{item.productName}</td>
                      <td className="outward-td">{item.fromVendor}</td>
                      <td className="outward-td">{item.suppliedQty}</td>
                      <td className="outward-td">{item.availableQty}</td>
                      <td className="outward-td">
                        {isEditing ? (
                          <input
                            type="number"
                            value={item.usedQty}
                            onChange={(e) => handleStockChange(e, index)}
                            className="edit-input"
                          />
                        ) : (
                          item.usedQty
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="outward-td">
                      No results found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </main>
  );
};

export default Outward;

import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { RxCrossCircled } from "react-icons/rx";
import { FaRegEdit, FaSave } from "react-icons/fa";
import { request } from "../../../api/request";

const VendorSelection = () => {
  const { companyName, siteId } = useParams();
  const [selectedPoId, setSelectedPoId] = useState();
  const [selectedPo, setSelectedPo] = useState();
  const [subTotal, setSubTotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [tableData, setTableData] = useState([]);
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

  const [pos, setPos] = useState();

  useEffect(() => {
    const fetchOrders = async () => {
      const response = await request(
        "GET",
        `/purchase/getAllPos?siteId=${siteId}`
      );
      setPos(response);
    };
    fetchOrders();
  }, []);

  useEffect(() => {
    const fetchPO = async () => {
      const response = await request("GET", `/purchase/getPo/${selectedPoId}`);
      console.log(response);
      setSelectedPo(response);
      setTableData(
        response.order.map((element) => {
          return { ...element, suppliedQty: 0, unitPrice: 0, total: 0 };
        })
      );
      console.log(tableData);
    };
    fetchPO();
  }, [selectedPoId]);

  const [editIndex, setEditIndex] = useState(null);

  console.log(tableData);
  // Handle contentEditable changes
  const handleInputChange = (index, field, value) => {
    const newData = [...tableData];
    newData[index][field] = value ? parseFloat(value) : 0;
    newData[index].total =
      newData[index].suppliedQty * newData[index].unitPrice; // Update subtotal
    setTableData(newData);
  };

  useEffect(() => {
    setSubTotal(tableData.reduce((acc, curr) => acc + curr.total, 0));
    setGrandTotal(subTotal + (subTotal * tax) / 100);
  }, [tableData, tax]);

  // Handle Edit/Save button click
  const handleEditClick = (index) => {
    if (editIndex === index) {
      // Save changes to initial array
      setEditIndex(null);
    } else {
      setEditIndex(index); // Enter edit mode
    }
  };

  const createMI = async () => {
    const response = await request("POST", `/materials/createMI`, {
      POid: selectedPoId,
      vendorId: selectedPo.vendorId._id,
      siteId: selectedPo.siteId._id,
      order: tableData.map((td) => {
        return {
          productId: td.productId._id,
          suppliedQty: td.suppliedQty,
          unitPrice: td.unitPrice,
        };
      }),
      subTotal: subTotal,
      tax: tax,
      grandTotal: grandTotal,
    });
    // console.log({
    //   POid: selectedPoId,
    //   vendorId: selectedPo.vendorId._id,
    //   siteId: selectedPo.siteId._id,
    //   order: tableData.map((td) => {
    //     return {
    //       productId: td.productId._id,
    //       suppliedQty: td.suppliedQty,
    //       unitPrice: td.unitPrice,
    //     };
    //   }),
    //   subTotal: subTotal,
    //   tax: tax,
    //   grandTotal: grandTotal,
    // });
    setSelectedPoId(null);
    setTableData(null);
    setTax(0);
    setGrandTotal(0);
    setSubTotal(0);
    setSelectedPo(null);
  };

  return (
    <article className="addinward-container">
      <div className="addinward-popup-inner">
        <div className="addinward-card">
          <header>
            <div className="addinward-header-top">
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
          {!selectedPoId && (
            <>
              <h1>Select Purchase order</h1>
              <div className="addinward-selection">
                {pos?.map((order, index) => (
                  <div
                    onClick={() => {
                      setSelectedPoId(order.POid);
                    }}
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
                  </div>
                ))}
              </div>
            </>
          )}
          {/* Table to display orders */}
          {selectedPoId && (
            <>
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
                    {tableData?.map((row, index) => (
                      <tr key={index}>
                        <td className="addinward-td">{index + 1}</td>
                        <td className="addinward-td">{row.productId.name}</td>
                        <td className="addinward-td">
                          {row.productId.description.substring(0, 200)}
                        </td>
                        <td className="addinward-td">{row.requiredQty}</td>
                        <td className="addinward-td">{row.productId.unit}</td>

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

                        <td className="addinward-td">{row.total}</td>

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
                    value={`Grand Sub Total : ${subTotal}`}
                    readOnly
                  />
                </div>
                <div className="total-field">
                  <input
                    type="text"
                    placeholder="GST"
                    value={tax} // Display the current GST value
                    onChange={(e) =>
                      setTax(e.target.value ? parseFloat(e.target.value) : "")
                    }
                  />
                </div>
                <div className="total-field">
                  <input
                    type="text"
                    value={`Grand Total : ${grandTotal}`}
                    readOnly
                  />
                </div>
              </div>

              {/* Confirm Button */}
              <div className="addinward-btn">
                <button onClick={createMI} className="addinward-confirm-btn">
                  Confirm
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </article>
  );
};

export default VendorSelection;

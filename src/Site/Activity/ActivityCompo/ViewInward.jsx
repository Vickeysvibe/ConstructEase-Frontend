import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { RxCrossCircled } from "react-icons/rx";
import { FaRegEdit, FaSave } from "react-icons/fa";
import { request } from "../../../api/request";

const ViewInward = () => {
  const { companyName, siteId, MIid } = useParams();
  const [materialIn, setMaterialIn] = useState();
  const tableHeaders = [
    "Serial No",
    "Product Name",
    "Details",
    "Unit",
    "Supplied Qty",
    "Unit Price",
    "Sub Total",
  ];

  useEffect(() => {
    const fetchPO = async () => {
      const response = await request(
        "GET",
        `/materials/getMI/${MIid}?siteId=${siteId}`
      );
      setMaterialIn(response);
    };
    fetchPO();
  }, []);

  const [editIndex, setEditIndex] = useState(null);

  return (
    <article className="addinward-container">
      <div className="addinward-popup-inner">
        <div className="addinward-card">
          <header>
            <div className="addinward-header-top">
              <h3></h3>
              <div className="addinward-cross">
                <Link to={`/${companyName}/${siteId}/activity/inwards`}>
                  <p>
                    <RxCrossCircled />
                  </p>
                </Link>
              </div>
            </div>
            <div className="addinward-header-bottom">
              <h1>Inward-View</h1>
            </div>
          </header>
        </div>
        <div className="scroll">
          <div className="addinward-selection">
            <div className="addinward-vendor-details">
              <div className="show">
                <p>{materialIn?.POid.vendorId.name}</p>
              </div>
              <div className="show">
                <p>{materialIn?.POid.vendorId.ownerName}</p>
              </div>
              <div className="show">
                <p>{materialIn?.POid.vendorId.gstIn}</p>
              </div>
            </div>
            <div className="addinward-vendor-details">
              <div className="show">
                <p>{materialIn?.POid.transport}</p>
              </div>
              <div className="show">
                <p>{new Date(materialIn?.POid.date).toLocaleDateString()}</p>
              </div>
              <div className="show">
                <p>{materialIn?.POid.vendorId.gstIn}</p>
              </div>
            </div>
          </div>
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
                {materialIn?.materials.map((row, index) => (
                  <tr key={index}>
                    <td className="addinward-td">{index + 1}</td>
                    <td className="addinward-td">{row.productId.name}</td>
                    <td className="addinward-td">
                      {row.productId.description.substring(0, 200)}
                    </td>
                    <td className="addinward-td">{row.productId.unit}</td>
                    <td className="addinward-td">{row.suppliedQty}</td>
                    <td className="addinward-td">{row.unitPrice}</td>
                    <td className="addinward-td">
                      {row.suppliedQty * row.unitPrice}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="total">
            <div className="total-field">
              <input
                type="text"
                value={`Grand Sub Total : ${materialIn?.subTotal}`}
                readOnly
              />
            </div>
            <div className="total-field">
              <input type="text" value={`Tax: ${materialIn?.tax} %`} readOnly />
            </div>

            <div className="total-field">
              <input
                type="text"
                value={`Grand Total : ${materialIn?.grandTotal}`}
                readOnly
              />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

export default ViewInward;

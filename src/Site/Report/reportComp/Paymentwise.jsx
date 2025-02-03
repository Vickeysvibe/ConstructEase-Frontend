import "../Report.css";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { request } from "../../../api/request";

export default function paymentwise() {
  const [selectedProduct, setSelectedProduct] = useState("vendor"); 
  const { companyName, siteId: site } = useParams();

  const products = ["vendor", "client", "labor", "others"];

  const handleDownload = async () => {
    if (!selectedProduct) {
      alert("Please select a product type!");
      return;
    }

    try {
      const requestBody = {
        type: selectedProduct, 
        siteId:site
      };

      const response = await request("POST", `/reports/paymentReport?siteId=${site}`, requestBody, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: response.headers["content-type"] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `payments_${selectedProduct}_${site}.xlsx`); // Set the download file name
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading report:", error);
    }
  };

  return (
    <>
      <main className="reportmain">
        <section className="reportsec">
          <h1>Payment Report</h1>
          <form className="reportform" onSubmit={(e) => e.preventDefault()}>
            <label>Select Product :</label>
            <select
              className="reportinput"
              value={selectedProduct} // Set value to the selected product
              onChange={(e) => setSelectedProduct(e.target.value)} // Update selected product on change
            >
              {products.map((product) => (
                <option key={product} value={product}>
                  {product}
                </option>
              ))}
            </select>

            {/* Optional: You can uncomment these date inputs if needed */}
            {/* <label>Start Date :</label>
            <span className="reportinput reportdateinput">
              {startDate === "" ? <p>Select Date (YYYY-MM-DD)</p> : null}
              <input
                className="dateinput"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </span>

            <label>End Date :</label>
            <span className="reportinput reportdateinput">
              {endDate === "" ? <p>Select Date (YYYY-MM-DD)</p> : null}
              <input
                className="dateinput"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </span> */}

            <div className="reportdownloadbtncon">
              <p className="reportdownloadbtn" onClick={handleDownload}>
                Download as Excel
              </p>
            </div>
          </form>
        </section>
      </main>
    </>
  );
}

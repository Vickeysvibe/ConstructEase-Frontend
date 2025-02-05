import "../Report.css";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { request } from "../../../api/request";

export default function Vendorwise() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [vendor, setVendor] = useState("");

  const {siteId:site } = useParams();

  const vendors = ["Vendor 8", "Vendor 9", "Vendor 10", "Vendor 53", "gfxhbv", "d"];

  const handleDownload = async () => {
    if (!startDate || !endDate) {
      alert("Please select start and end dates.");
      return;
    }

    try {
      const response = await request(
        "POST", 
        `/reports/vendor-report?siteId=${site}`, 
        { 
          siteId: site,
          startDate,
          endDate,
          vendor: vendor || "ALL",
        },
        { responseType: "blob" }
      );

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = "VendorReport.xlsx";
      link.click();
    } catch (error) {
      console.error("Error downloading report:", error);
      alert("Failed to download report.");
    }
  };

  return (
    <>
      <main className="reportmain">
        <section className="reportsec">
          <h1>Vendor Report</h1>
          <form className="reportform">
            <label>Select Vendor:</label>
            <select
              className="reportinput"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
            >
              <option value="">All</option>
              {vendors.map((vendorItem) => (
                <option key={vendorItem} value={vendorItem}>
                  {vendorItem}
                </option>
              ))}
            </select>

            <label>Start Date:</label>
            <span className="reportinput reportdateinput">
              {startDate === "" ? <p>Select Date (YYYY-MM-DD)</p> : null}
              <input
                className="dateinput"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </span>

            <label>End Date:</label>
            <span className="reportinput reportdateinput">
              {endDate === "" ? <p>Select Date (YYYY-MM-DD)</p> : null}
              <input
                className="dateinput"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </span>
            <div className="reportdownloadbtncon">
              <p
                type="button"
                onClick={handleDownload}
                className="reportdownloadbtn"
              >
                Download as Excel
              </p>
            </div>
          </form>
        </section>
      </main>
    </>
  );
}

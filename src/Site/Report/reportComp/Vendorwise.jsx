import "../Report.css";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { request } from "../../../api/request";

export default function Vendorwise() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [vendor, setVendor] = useState("");
  const [vendors, setVendors] = useState([]); 
  const { siteId: site } = useParams();

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = await request("GET", `/vendors/getAllvendor?siteId=${site}`);
        if (response) {
          setVendors(response);
        }
      } catch (error) {
        console.error("Error fetching vendors:", error);
      }
    };

    if (site) {
      fetchVendors();
    }
  }, [site]);

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
                <option key={vendorItem._id} value={vendorItem.name}>
                  {vendorItem.name}
                </option>
              ))}
            </select>

            <label>Start Date:</label>
            <input
              className="reportinput"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />

            <label>End Date:</label>
            <input
              className="reportinput"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />

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

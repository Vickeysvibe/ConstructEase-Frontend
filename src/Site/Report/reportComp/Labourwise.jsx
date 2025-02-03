import "../Report.css";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { request } from "../../../api/request";

export default function Labourwise() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");

  const { companyName, siteId: site } = useParams();

  const categories = ["Carpenter", "dfga", "ugfcvt", "gfxdfcgvhb", "gfxhbv", "d"];
  const subCategories = ["Framework", "dfga", "ugfcvt", "gfxdfcgvhb", "gfxhbv", "d"];

  const handleDownload = async () => {
    if (!startDate || !endDate) {
      alert("Please select start and end dates.");
      return;
    }

    try {
      const response = await request(
        "POST", 
        "/reports/labourReport", 
        { 
          siteId: site,
          startDate,
          endDate,
          laborCategory: category || "ALL",
          subCategory: subCategory || "",
        },
        { responseType: "blob" }
      );

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = "LaborReport.xlsx";
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
          <h1>Labour Report</h1>
          <form className="reportform">
            <label>Category:</label>
            <select
              className="reportinput"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All</option>
              {categories.map((labor) => (
                <option key={labor} value={labor}>
                  {labor}
                </option>
              ))}
            </select>

            <label>Sub Category (optional):</label>
            <select
              className="reportinput"
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
            >
              <option value="">All</option>
              {subCategories.map((labor) => (
                <option key={labor} value={labor}>
                  {labor}
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
              <p type="button" onClick={handleDownload} className="reportdownloadbtn">
                Download as Excel
              </p>
            </div>
          </form>
        </section>
      </main>
    </>
  );
}

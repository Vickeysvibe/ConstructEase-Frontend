import "../Report.css";
import { useState } from "react";
import axios from "axios";

export default function Labourwise() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");

  const categories = ["qwert", "dfga", "ugfcvt", "gfxdfcgvhb", "gfxhbv", "d"];
  const subCategories = [
    "qwert",
    "dfga",
    "ugfcvt",
    "gfxdfcgvhb",
    "gfxhbv",
    "d",
  ];

  const siteId = "your-site-id"; // Replace with actual site ID from context/state

  const handleDownload = async (format) => {
    if (!startDate || !endDate) {
      alert("Please select start and end dates.");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/api/labor-report",
        {
          siteId,
          startDate,
          endDate,
          laborCategory: category || "ALL",
          subCategory: subCategory || "",
        },
        { responseType: "blob" } // Important for handling file downloads
      );

      const blob = new Blob([response.data], {
        type:
          format === "pdf"
            ? "application/pdf"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = format === "pdf" ? "LaborReport.pdf" : "LaborReport.xlsx";
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
            <label>Category :</label>
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

            <label>Sub Category (optional) :</label>
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
              <p
                type="button"
                onClick={() => handleDownload("excel")}
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

import { useState, useEffect } from 'react';
// import '../App.css';
import '../Attendance.css';
import TodayAttendance from './TodayAttendance';

export default function LabourAtt() {

    const [currentDate, setCurrentDate] = useState('');

    const laboratthead = ['Serial No', 'Name', 'Category', 'SubCategory' ,'Wages', 'Attendance'];
    useEffect(() => {
        const today = new Date();
        const formattedDate = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
        setCurrentDate(formattedDate);
    }, []);
    
    const laboratt = [
        {   id:1,
            name: "John Doe",
            category: "Labour",
            subCategory: "Mason",
            wagesPerShift: 500,
          },
          { id:2,
            name: "Jane Smith",
            category: "Labour",
            subCategory: "Carpenter",
            wagesPerShift: 600,
          },
          { id:3,
            name: "Ali Khan",
            category: "Labour",
            subCategory: "Electrician",
            wagesPerShift: 700,
          },
          { id:4,
            name: "Emily Davis",
            category: "Labour",
            subCategory: "Painter",
            wagesPerShift: 550,
          },
          { id:5,
            name: "Rajesh Gupta",
            category: "Labour",
            subCategory: "Plumber",
            wagesPerShift: 650,
          },
      ];
      

    const [searchTerm, setSearchTerm] = useState('');
    const [filteredData, setFilteredData] = useState(laboratt);
    const [presentlab, setpresentlab] = useState([]);
    const [presentDetials,setPresentDetials] = useState([]);

    useEffect(() => {
        const result = laboratt.filter((worker) =>
            worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            worker.workerType.toLowerCase().includes(searchTerm.toLowerCase()) ||
            worker.shift.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredData(result);
    }, [searchTerm]);
    const handleCheckboxChange = (e, worker) => {
        // console.log(worker)
        if (e.target.checked) {
            setpresentlab([...presentlab, worker.id]);
            const index = worker.id-1;
            setPresentDetials([...presentDetials,laboratt[index]])
        }
    };
    const[today,setToday]=useState(false);
    const finish = () =>{
        console.log(presentlab);
        console.log(presentDetials);
    }
    return (
        <>
            <main className="attendancemain">
                {today && <TodayAttendance />}
                <section className="attendancesec">
                    <div className="searchcon">
                        <h1>Labour Manage</h1>
                        <div className="inpcon">
                            <input
                                type="search"
                                className='search'
                                placeholder='Search by name, type'
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value) }}
                            />
                            <p>Search</p>
                            <p className="adtxt">|</p>
                            <p className="adtxt">{currentDate}</p>
                        </div>
                    </div>
                    <div className="tablecon">
                        {filteredData.length > 0 ? (
                            <table className="attendancetable">
                                <thead>
                                    <tr className='labhead'>
                                        {laboratthead.map((header, index) => (
                                            <th className="attendanceth" key={index}>{header}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.map((worker, index) => (
                                        <tr key={worker.id}>
                                            <td className="attendancetd">{index + 1}</td>
                                            <td className="attendancetd">{worker.name}</td>
                                            <td className="attendancetd">{worker.category}</td>
                                            <td className="attendancetd">{worker.subCategory}</td>
                                            <td className="attendancetd">{worker.wagesPerShift}</td>
                                            <td className="attendancetd attbox" ><input
                                                type="checkbox"
                                                onChange={(e) => handleCheckboxChange(e, worker)} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p>No result found</p>
                        )}
                    </div>
                    <div onClick={finish} className="finishbtn">Finish</div>
                </section>
            </main>
        </>
    );
}

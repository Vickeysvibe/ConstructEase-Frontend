import { useEffect, useState } from 'react';
import '../Activity.css';
import '../../../Home/Home.css'
import { AiOutlineDelete } from "react-icons/ai";
import { IoCalendarOutline, IoAdd, IoClose } from "react-icons/io5";
import { request } from '../../../api/request';
import { useParams } from 'react-router-dom';

const categories = [
    "Vendor Payments | ",
    "Labour Payments | ",
    "Client Payments | ",
    "Others"
];

// useEffect(()=>{
//     const fetchPayement =async () => {
//         try {

//             const response = await request('GET','/p')

//         } catch (error) {

//         }

//     }
// })

// const vendorPayments = [
//     { id: 1, name: "Kathir Kumar", amount: "₹1000", product: "Cement", quantity: "5", unit: "/Kg" },
//     { id: 2, name: "Kathir Kumar", amount: "₹1000", product: "Cement", quantity: "5", unit: "/Kg" },
//     { id: 3, name: "Raj Kumar", amount: "₹1000", product: "Cement", quantity: "5", unit: "/Kg" },

// ];

// const labourPayments = [
//     { id: 1, name: "Suresh Kumar", amount: "₹1000", product: "Bank Transfer" }
// ];

// const clientPayments = [
//     { id: 1, name: "Suresh Kumar", amount: "₹1000", description: "About this payment" }
// ];

// const otherPayments = [
//     { id: 1, name: "Suresh Kumar", amount: "₹1000", product: "Bank Transfer" }
// ];

export default function Funds() {
    const { siteId } = useParams()
    const [payfor, setpayfor] = useState(0);
    const [vendorList, setVendorList] = useState([]);
    const [labourList, setLabourList] = useState([]);
    const [clientList, setClientList] = useState([]);
    const [otherList, setOtherList] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [newPayment, setNewPayment] = useState({ name: "", amount: "", product: "", quantity: "", unit: "", CostPerUnit: "", method: "" });

    useEffect(() => {
        const fetchPayments = async () => {
            try {
                const typeMap = ["vendor", "labour", "client", "other"];
                const type = typeMap[payfor];
                console.log("Fetching:", type);

                const response = await request('GET', `/payments/getPayments?siteId=${siteId}&type=${type}`);

                if (!response || !Array.isArray(response)) {
                    console.error("Invalid response format:", response);
                    return;
                }
                console.log(payfor)
                console.log(response)

                if (payfor === 0) setVendorList(response);
                if (payfor === 1) setLabourList(response);
                if (payfor === 2) setClientList(response);
                if (payfor === 3) setOtherList(response);

            } catch (error) {
                console.error("Error fetching payments:", error);
            }
        };

        if (siteId) fetchPayments();
    }, [payfor, siteId]);


    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewPayment({ ...newPayment, [name]: value });
    };

    const addNewPayment = async () => {
        if (!newPayment.name || !newPayment.amount) {
            return alert("Name and Amount are required!");
        }
    
        const typeMap = ["vendor", "labour", "client", "other"];
        const type = typeMap[payfor];
    
        const paymentData = {
            date: new Date().toISOString(), // Sending current date
        };
    
        // Assign relevant fields based on category type
        if (type === "vendor") {
            Object.assign(paymentData, {
                description: newPayment.product,
                amount: newPayment.amount,
                quantity: newPayment.quantity,
                unit: newPayment.unit,
                costPerUnit: newPayment.CostPerUnit,
            });
        } else if (type === "labour") {
            Object.assign(paymentData, {
                description: newPayment.product,
                amount: newPayment.amount,
            });
        } else if (type === "client") {
            Object.assign(paymentData, {
                paymentReceived: newPayment.amount,
                paymentAs: newPayment.method,
                paymentBy: newPayment.name,
            });
        } else {
            Object.assign(paymentData, {
                description: newPayment.product,
                amount: newPayment.amount,
            });
        }
    
        try {
            const response = await request("POST", `/payments/createPayment?siteId=${siteId}&type=${type}`, paymentData);
    
            if (response) {
                if (payfor === 0) setVendorList([...vendorList, response]);
                if (payfor === 1) setLabourList([...labourList, response]);
                if (payfor === 2) setClientList([...clientList, response]);
                if (payfor === 3) setOtherList([...otherList, response]);
    
                alert("Payment added successfully!");
                setShowForm(false);
                setNewPayment({ name: "", amount: "", product: "", quantity: "", unit: "", CostPerUnit: "", method: "" });
            }
        } catch (error) {
            console.error("Error adding payment:", error);
            alert("Failed to add payment. Please try again.");
        }
    };
    
    
    

    const currentDate = new Date();
    const formattedDate = new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric'
    }).format(currentDate);

    const handleDelete = (id, category) => {
        if (category === 0) setVendorList(vendorList.filter(item => item.id !== id));
        if (category === 1) setLabourList(labourList.filter(item => item.id !== id));
        if (category === 2) setClientList(clientList.filter(item => item.id !== id));
        if (category === 3) setOtherList(otherList.filter(item => item.id !== id));
    };

    const getCurrentList = () => {
        if (payfor === 0) return vendorList;
        if (payfor === 1) return labourList;
        if (payfor === 2) return clientList ;
        return otherList;
    };
    return (
        <main className="funds-main">
            <div className="add-funds-btn" onClick={() => setShowForm(true)}>Add +</div>
            <div className='funds-nav'>
                {categories.map((category, index) => (
                    <p
                        key={index}
                        onClick={() => setpayfor(index)}
                        className={`funds-nav-items ${payfor === index ? "highlight" : ""}`}
                    >
                        {category}
                    </p>
                ))}
            </div>
            <div className="funds-cards-container">
                {getCurrentList().length === 0 ? (
                    <p>No payments found for this category.</p>
                ) : (
                    getCurrentList().map(({ _id, name,paymentBy, paymentReceived, date, description, quantity, unit, paymentAs }) => {
                        const formattedDate = new Date(date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric"
                        });

                        return (
                            <div key={_id} className="funds-card">
                                <div className="funds-card-head">
                                    <p className="fund-date-icon"><IoCalendarOutline size={17} /></p>
                                    <p className='fund-date'>{formattedDate}</p>
                                    <span className="fund-btns-con">
                                        <p className="fund-btn" onClick={() => handleDelete(_id, payfor)}><AiOutlineDelete /></p>
                                    </span>
                                </div>
                                <div className="funds-card-info-container">
                                    <div className="fund-name-amt">
                                        <p className="fund-vendor-name">{paymentBy}</p>  
                                        <p className="fund-amount">{paymentReceived}</p> 
                                        <p className="fund-product-txt">{paymentAs}</p>   
                                        {description && <p className="fund-product-des">{description}</p>}
                                    </div>
                                    {quantity > 0 && unit && (
                                        <div className="fund-qty-unit">
                                            <p className="fund-qty">{quantity}<span className="fund-unit">{unit}</span></p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {showForm && (
                <div className="menu-addsuper-con fund-add-container">
                    <header>
                        <p className="menu-superadd-txt">Add Payment</p>
                        <p onClick={() => setShowForm(false)}>
                            <IoClose />
                        </p>
                    </header>
                    <label className="menu-superadd-label">Name</label>
                    <input type="text" name="name" className="menu-superadd-input" placeholder="Name" value={newPayment.name} onChange={handleInputChange} />

                    <label className="menu-superadd-label">Amount</label>
                    <input type="text" name="amount" className="menu-superadd-input" placeholder="Amount" value={newPayment.amount} onChange={handleInputChange} />

                    {payfor === 0 && (
                        <>
                            <label className="menu-superadd-label">Product</label>
                            <input type="text" name="product" className="menu-superadd-input" placeholder="Product" value={newPayment.product} onChange={handleInputChange} />

                            <label className="menu-superadd-label">Quantity</label>
                            <input type="text" name="quantity" className="menu-superadd-input" placeholder="Quantity" value={newPayment.quantity} onChange={handleInputChange} />

                            <label className="menu-superadd-label">Unit</label>
                            <input type="text" name="unit" className="menu-superadd-input" placeholder="Kg / Bag / Tons" value={newPayment.unit} onChange={handleInputChange} />

                            <label className="menu-superadd-label">Per Unit Cost</label>
                            <input type="text" name="CostPerUnit" className="menu-superadd-input" placeholder="Unit Cost" value={newPayment.CostPerUnit} onChange={handleInputChange} />

                        </>
                    )}
                    {payfor === 1 && (
                        <>
                            <label className="menu-superadd-label">Description</label>
                            <input
                                type="text"
                                name="CostPerUnit"
                                className="menu-superadd-input"
                                placeholder="Bank Transfer / Cash"
                                value={newPayment.CostPerUnit}
                                onChange={handleInputChange}
                            />
                        </>
                    )}
                    {payfor === 2 && (
                        <>
                            <label className="menu-superadd-label">Payment Method</label>
                            <input
                                type="text"
                                name="method"
                                className="menu-superadd-input"
                                placeholder="Bank Transfer / Cash / UPI"
                                value={newPayment.method}
                                onChange={handleInputChange}
                            />
                        </>
                    )}

                    <p className="menu-superadd-btn" onClick={addNewPayment}>Add Payment</p>
                </div>
            )}


        </main>
    );
}

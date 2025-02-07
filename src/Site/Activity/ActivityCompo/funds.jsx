import { useState, useEffect } from 'react';
import '../Activity.css';
import '../../../Home/Home.css';
import { AiOutlineDelete } from "react-icons/ai";
import { IoCalendarOutline, IoClose } from "react-icons/io5";
import { request } from "../../../api/request";  
import { useParams } from "react-router-dom"; 
const api = import.meta.env.VITE_API;

const categories = [
    "Vendor Payments | ",
    "Labour Payments | ",
    "Client Payments | ",
    "Others"
];

const token = localStorage.getItem("authToken");


export default function Funds() {
    const { siteId } = useParams();  
    const [payfor, setpayfor] = useState(0);
    const [payments, setPayments] = useState([]);
    const [showForm, setShowForm] = useState(false);

    const [vendorPayment, setVendorPayment] = useState({
        type: "vendor", date: "", name: "", description: "", amount: "", quantity: "", unit: "", costPerUnit: ""
    });
    const [labourPayment, setLabourPayment] = useState({
        name: "", type: "labour", date: "", description: "", amount: ""
    });
    const [clientPayment, setClientPayment] = useState({
        type: "client", date: "", name: "", paymentReceived: "", paymentAs: "", paymentBy: ""
    });
    const [otherPayment, setOtherPayment] = useState({
        type: "others", date: "", description: "", amount: ""
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (payfor === 0) {
            setVendorPayment(prev => ({ ...prev, [name]: value }));
        } else if (payfor === 1) {
            setLabourPayment(prev => ({ ...prev, [name]: value }));
        } else if (payfor === 2) {
            setClientPayment(prev => ({ ...prev, [name]: value }));
        } else if (payfor === 3) {
            setOtherPayment(prev => ({ ...prev, [name]: value }));
        }
    };

    const addNewPayment = async () => {
        let paymentData = {};
        let paymentType = ""; 
        if (payfor === 0) {
            paymentData = { ...vendorPayment, siteId };
            paymentType = "vendor";
        } else if (payfor === 1) {
            paymentData = { ...labourPayment, siteId };
            paymentType = "labour";
        } else if (payfor === 2) {
            paymentData = { ...clientPayment, siteId };
            paymentType = "client";
        } else if (payfor === 3) {
            paymentData = { ...otherPayment, siteId };
            paymentType = "others";
        }
    
        try {
            const response = await request("POST", `${api}/payments/createPayment?siteId=${siteId}&type=${paymentType}`, paymentData);
            
            setPayments([...payments, response]);
            setShowForm(false);
    
            if (payfor === 0) setVendorPayment({ type: "vendor", date: "", name: "", description: "", amount: "", quantity: "", unit: "", costPerUnit: "" });
            else if (payfor === 1) setLabourPayment({ name: "", type: "labour", date: "", description: "", amount: "" });
            else if (payfor === 2) setClientPayment({ type: "client", date: "", name: "", paymentReceived: "", paymentAs: "", paymentBy: "" });
            else if (payfor === 3) setOtherPayment({ type: "others", date: "", description: "", amount: "" });
    
        } catch (error) {
            console.error("Error adding new payment:", error);
        }
    };
    

    const fetchPayments = async (type) => {
        try {
            const response = await request("GET", `${api}/payments/getPayments?siteId=${siteId}&type=${type}`);
            setPayments(response);
        } catch (error) {
            console.error("Error fetching payments:", error);
        }
    };

    const handleDelete = async (_id, type) => {
        try {
            const response = await fetch(`${api}/payments/deletePayment/${_id}?siteId=${siteId}&type=${type}`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                }
              });
              
              
    
            if (response && response.status === 200) {
                setPayments(payments.filter(item => item._id !== _id));
            } else {
                console.error("Failed to delete payment. Response: ", response);
            }
        } catch (error) {
            console.error("Error deleting payment:", error);
        }
    };
    
   
    

    useEffect(() => {
        if (payfor === 0) fetchPayments('vendor');
        if (payfor === 1) fetchPayments('labour');
        if (payfor === 2) fetchPayments('client');
        if (payfor === 3) fetchPayments('others');
    }, [payfor, siteId]);

    const currentDate = new Date();
    const formattedDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'numeric', year: 'numeric' }).format(currentDate);



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
    {payments.map(({ _id, name, amount, product, quantity, unit, description,type }) => (
      <div key={_id} className="funds-card">
        <div className="funds-card-head">
          <p className="fund-date-icon"><IoCalendarOutline size={17} /></p>
          <p className='fund-date'>{formattedDate}</p>
          <span className="fund-btns-con">
          <p className="fund-btn" onClick={() => handleDelete(_id, type)}><AiOutlineDelete /></p>
          </span>
                        </div>
                        <div className="funds-card-info-container">
                            <div className="fund-name-amt">
                                <p className="fund-vendor-name">{name}</p>
                                <p className="fund-amount">{amount}</p>
                                {product && <p className="fund-product-txt">{product}</p>}
                                {description && <p className="fund-product-des">{description}</p>}
                            </div>
                            {quantity && unit && (
                                <div className="fund-qty-unit">
                                    <p className="fund-qty">{quantity}<span className="fund-unit">{unit}</span></p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            {showForm && (
                <div className="menu-addsuper-con fund-add-container">
                    <header>
                        <p className="menu-superadd-txt">Add Payment</p>
                        <p onClick={() => setShowForm(false)}><IoClose /></p>
                    </header>

                    {/* Dynamic form fields based on payment type */}
                    {payfor === 0 && (  // Vendor Payment
                        <>
                            <label className="menu-superadd-label">Type</label>
                            <input type="text" name="type" className="menu-superadd-input" placeholder="Type" value={vendorPayment.type} onChange={handleInputChange} />
                            <label className="menu-superadd-label">Date</label>
                            <input type="date" name="date" className="menu-superadd-input" placeholder="Date" value={vendorPayment.date} onChange={handleInputChange} />
                            <label className="menu-superadd-label">Name</label>
                            <input type="text" name="name" className="menu-superadd-input" placeholder="Name" value={vendorPayment.name} onChange={handleInputChange} />
                            <label className="menu-superadd-label">Description</label>
                            <input type="text" name="description" className="menu-superadd-input" placeholder="Description" value={vendorPayment.description} onChange={handleInputChange} />
                            <label className="menu-superadd-label">Amount</label>
                            <input type="text" name="amount" className="menu-superadd-input" placeholder="Amount" value={vendorPayment.amount} onChange={handleInputChange} />
                            <label className="menu-superadd-label">Quantity</label>
                            <input type="text" name="quantity" className="menu-superadd-input" placeholder="Quantity" value={vendorPayment.quantity} onChange={handleInputChange} />
                            <label className="menu-superadd-label">Unit</label>
                            <input type="text" name="unit" className="menu-superadd-input" placeholder="Kg / Bag / Tons" value={vendorPayment.unit} onChange={handleInputChange} />
                            <label className="menu-superadd-label">Per Unit Cost</label>
                            <input type="text" name="costPerUnit" className="menu-superadd-input" placeholder="Unit Cost" value={vendorPayment.costPerUnit} onChange={handleInputChange} />
                        </>
                    )}
                    {payfor === 1 && (  // Labour Payment
                        <>
                            <label className="menu-superadd-label">Name</label>
                            <input type="text" name="name" className="menu-superadd-input" placeholder="Name" value={labourPayment.name} onChange={handleInputChange} />
                            <label className="menu-superadd-label">Type</label>
                            <input type="text" name="type" className="menu-superadd-input" placeholder="Type" value={labourPayment.type} onChange={handleInputChange} />
                            <label className="menu-superadd-label">Date</label>
                            <input type="date" name="date" className="menu-superadd-input" value={labourPayment.date} onChange={handleInputChange} />
                            <label className="menu-superadd-label">Description</label>
                            <input type="text" name="description" className="menu-superadd-input" placeholder="Description" value={labourPayment.description} onChange={handleInputChange} />
                            <label className="menu-superadd-label">Amount</label>
                            <input type="text" name="amount" className="menu-superadd-input" placeholder="Amount" value={labourPayment.amount} onChange={handleInputChange} />
                        </>
                    )}
                    {payfor === 2 && (  // Client Payment
                        <>
                            <label className="menu-superadd-label">Type</label>
                            <input type="text" name="type" className="menu-superadd-input" placeholder="Type" value={clientPayment.type} onChange={handleInputChange} />
                            <label className="menu-superadd-label">Date</label>
                            <input type="date" name="date" className="menu-superadd-input" value={clientPayment.date} onChange={handleInputChange} />
                            <label className="menu-superadd-label">Name</label>
                            <input type="text" name="name" className="menu-superadd-input" placeholder="Name" value={clientPayment.name} onChange={handleInputChange} />
                            <label className="menu-superadd-label">Payment Received</label>
                            <input type="text" name="paymentReceived" className="menu-superadd-input" placeholder="Amount Received" value={clientPayment.paymentReceived} onChange={handleInputChange} />
                            <label className="menu-superadd-label">Payment As</label>
                            <input type="text" name="paymentAs" className="menu-superadd-input" placeholder="Payment As" value={clientPayment.paymentAs} onChange={handleInputChange} />
                            <label className="menu-superadd-label">Payment By</label>
                            <input type="text" name="paymentBy" className="menu-superadd-input" placeholder="Payment By" value={clientPayment.paymentBy} onChange={handleInputChange} />
                        </>
                    )}
                    {payfor === 3 && (  // Other Payments
                        <>
                        <label className="menu-superadd-label">Date</label>
                        <input type="date" name="date" className="menu-superadd-input" value={otherPayment.date} onChange={handleInputChange} />
                            <label className="menu-superadd-label">Description</label>
                            <input type="text" name="description" className="menu-superadd-input" placeholder="Description" value={otherPayment.description} onChange={handleInputChange} />
                            <label className="menu-superadd-label">Amount</label>
                            <input type="text" name="amount" className="menu-superadd-input" placeholder="Amount" value={otherPayment.amount} onChange={handleInputChange} />
                        </>
                    )}
                    <button onClick={addNewPayment} className="menu-superadd-btn">Add Payment</button>
                </div>
            )}
        </main>
    );
}
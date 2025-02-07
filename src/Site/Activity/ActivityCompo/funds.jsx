import { useState } from 'react';
import '../Activity.css';
import '../../../Home/Home.css'
import { AiOutlineDelete } from "react-icons/ai";
import { IoCalendarOutline, IoAdd, IoClose } from "react-icons/io5";

const categories = [
    "Vendor Payments | ",
    "Labour Payments | ",
    "Client Payments | ",
    "Others"
];

const vendorPayments = [
    { id: 1, name: "Kathir Kumar", amount: "₹1000", product: "Cement", quantity: "5", unit: "/Kg" },
    { id: 2, name: "Kathir Kumar", amount: "₹1000", product: "Cement", quantity: "5", unit: "/Kg" },
    { id: 3, name: "Raj Kumar", amount: "₹1000", product: "Cement", quantity: "5", unit: "/Kg" },

];

const labourPayments = [
    { id: 1, name: "Suresh Kumar", amount: "₹1000", product: "Bank Transfer" }
];

const clientPayments = [
    { id: 1, name: "Suresh Kumar", amount: "₹1000", description: "About this payment" }
];

const otherPayments = [
    { id: 1, name: "Suresh Kumar", amount: "₹1000", product: "Bank Transfer" }
];

export default function Funds() {
    const [payfor, setpayfor] = useState(0);
    const [vendorList, setVendorList] = useState(vendorPayments);
    const [labourList, setLabourList] = useState(labourPayments);
    const [clientList, setClientList] = useState(clientPayments);
    const [otherList, setOtherList] = useState(otherPayments);
    const [showForm, setShowForm] = useState(false);
    const [newPayment, setNewPayment] = useState({ name: "", amount: "", product: "", quantity: "", unit: "", CostPerUnit: "", method:"" });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewPayment({ ...newPayment, [name]: value });
    };

    const addNewPayment = () => {
        if (!newPayment.name || !newPayment.amount) return alert("Name and Amount are required!");

        const newEntry = { id: Date.now(), ...newPayment };

        if (payfor === 0) setVendorList([...vendorList, newEntry]);
        if (payfor === 2) setLabourList([...labourList, newEntry]);
        if (payfor === 1) setClientList([...clientList, newEntry]);
        if (payfor === 3) setOtherList([...otherList, newEntry]);

        setShowForm(false);
        setNewPayment({ name: "", amount: "", product: "", quantity: "", unit: "", CostPerUnit: "" });
    };

    const currentDate = new Date();
    const formattedDate = new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric'
    }).format(currentDate);

    const handleDelete = (id, category) => {
        if (category === 0) setVendorList(vendorList.filter(item => item.id !== id));
        if (category === 2) setLabourList(labourList.filter(item => item.id !== id));
        if (category === 1) setClientList(clientList.filter(item => item.id !== id));
        if (category === 3) setOtherList(otherList.filter(item => item.id !== id));
    };

    const getCurrentList = () => {
        if (payfor === 0) return vendorList;
        if (payfor === 2) return labourList;
        if (payfor === 1) return clientList;
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
                {getCurrentList().map(({ id, name, amount, product, quantity, unit, description }) => (
                    <div key={id} className="funds-card">
                        <div className="funds-card-head">
                            <p className="fund-date-icon"><IoCalendarOutline size={17} /></p>
                            <p className='fund-date'>{formattedDate}</p>
                            <span className="fund-btns-con">
                                <p className="fund-btn" onClick={() => handleDelete(id, payfor)}><AiOutlineDelete /></p>
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
                            <input type="text" name="unit" className="menu-superadd-input" placeholder="Unit Cost" value={newPayment.CostPerUnit} onChange={handleInputChange} />

                        </>
                    )}
                    {payfor === 1 && (
                        <>
                            <label className="menu-superadd-label">Description</label>
                            <input
                                type="text"
                                name="product"
                                className="menu-superadd-input"
                                placeholder="Bank Transfer / Cash"
                                value={newPayment.product}
                                onChange={handleInputChange}
                            />
                        </>
                    )}
                    {payfor === 2 && (
                        <>
                            <label className="menu-superadd-label">Payment Method</label>
                            <input
                                type="text"
                                name="product"
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

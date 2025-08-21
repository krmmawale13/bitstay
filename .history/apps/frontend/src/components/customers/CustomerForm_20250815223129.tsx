import React, { useState, useEffect } from "react";
import { createCustomer, updateCustomer, getCustomerById } from "@/services/customers";

interface CustomerFormProps {
  customerId?: number;
  onSuccess?: () => void;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ customerId, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  // Load existing customer data if editing
  useEffect(() => {
    if (customerId) {
      getCustomerById(customerId).then((data) => {
        if (data) {
          setFormData({
            name: data.name || "",
            email: data.email || "",
            phone: data.phone || "",
            address: data.address || "",
          });
        }
      });
    }
  }, [customerId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (customerId) {
      await updateCustomer(customerId, formData);
    } else {
      await createCustomer(formData);
    }
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="Customer Name"
        className="border p-2 w-full"
        required
      />
      <input
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="Email"
        className="border p-2 w-full"
        type="email"
        required
      />
      <input
        name="phone"
        value={formData.phone}
        onChange={handleChange}
        placeholder="Phone"
        className="border p-2 w-full"
      />
      <input
        name="address"
        value={formData.address}
        onChange={handleChange}
        placeholder="Address"
        className="border p-2 w-full"
      />
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {customerId ? "Update Customer" : "Add Customer"}
      </button>
    </form>
  );
};

export default CustomerForm;

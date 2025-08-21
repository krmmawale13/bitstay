import { useState, useEffect } from "react";
import { Customer, UpsertCustomer, getCustomerById } from "@/services/customers.service";

interface Props {
  customerId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CustomerForm({ customerId, onSuccess, onCancel }: Props) {
  const [formData, setFormData] = useState<Partial<Customer>>({});

  useEffect(() => {
    if (customerId) {
      getCustomerById(customerId).then((data) => {
        if (data) setFormData(data);
      });
    }
  }, [customerId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await UpsertCustomer(formData);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="name"
        value={formData.name || ""}
        onChange={handleChange}
        placeholder="Name"
      />
      <input
        name="email"
        value={formData.email || ""}
        onChange={handleChange}
        placeholder="Email"
      />
      <input
        name="phone"
        value={formData.phone || ""}
        onChange={handleChange}
        placeholder="Phone"
      />
      <input
        name="address"
        value={formData.address || ""}
        onChange={handleChange}
        placeholder="Address"
      />
      <button type="submit">Save</button>
      <button type="button" onClick={onCancel}>
        Cancel
      </button>
    </form>
  );
}

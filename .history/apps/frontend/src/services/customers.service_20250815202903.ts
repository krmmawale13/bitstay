import axios from 'axios';

const BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/customers`
  : 'http://localhost:3001/api/v1/customers';

export async function getCustomers() {
  const { data } = await axios.get(BASE);
  return data;
}

export async function getCustomerById(id: string | number) {
  const { data } = await axios.get(`${BASE}/${id}`);
  return data;
}

export async function createCustomer(payload: any) {
  const { data } = await axios.post(BASE, payload);
  return data;
}

export async function updateCustomer(id: string | number, payload: any) {
  const { data } = await axios.put(`${BASE}/${id}`, payload);
  return data;
}

export async function deleteCustomer(id: string | number) {
  const { data } = await axios.delete(`${BASE}/${id}`);
  return data;
}

// Optional — for dropdown metadata; safely ignored if endpoint not present
export async function getCustomerMetadata() {
  const url = BASE + '/metadata';
  const { data } = await axios.get(url);
  return data;
}

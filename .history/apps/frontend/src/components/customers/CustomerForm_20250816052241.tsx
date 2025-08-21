import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { createCustomer } from "@/services/customers.service";

interface CustomerFormProps {
  onSuccess?: () => void; // Parent ko notify karega CRUD refresh ke liye
}

interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
}

export default function CustomerForm({ onSuccess }: CustomerFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormData>();

  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data: CustomerFormData) => {
    try {
      setIsLoading(true);
      await createCustomer(data);
      toast.success("Customer created successfully");
      reset(); // form reset
      onSuccess?.(); // refresh list
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message || "Failed to create customer";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"
    >
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Name
        </label>
        <input
          type="text"
          {...register("name", { required: "Name is required" })}
          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        {errors.name && (
          <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Email
        </label>
        <input
          type="email"
          {...register("email", { required: "Email is required" })}
          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        {errors.email && (
          <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Phone
        </label>
        <input
          type="text"
          {...register("phone", { required: "Phone number is required" })}
          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        {errors.phone && (
          <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || isSubmitting}
        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md shadow hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
      >
        {isLoading ? "Saving..." : "Save"}
      </button>
    </form>
  );
}

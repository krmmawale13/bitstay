interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

const login = async (email: string, password: string) => {
  try {
    setLoading(true);
    const res = await axios.post<LoginResponse>(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/v1/auth/login`,
      { email, password }
    );

    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));

    Router.push("/dashboard"); // keep your existing dashboard page name
  } catch (err: any) {
    console.error("Login failed:", err);
    throw new Error(err?.response?.data?.message || "Login failed");
  } finally {
    setLoading(false);
  }
};

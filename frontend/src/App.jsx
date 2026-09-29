import React, { useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate
} from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function Login({ setUser, setToken }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function login(e) {
    e.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setToken(data.token);
      setUser(data.user);
      navigate("/dashboard");
    } catch (error) {
      if (error.message.includes("Failed to fetch") || error.name === "TypeError") {
        setMessage("Cannot connect to backend server. Make sure the backend is running on http://localhost:5000");
      } else {
        setMessage(error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page center">
      <form className="card login-card" onSubmit={login}>
        <div className="icon">🔐</div>
        <h1>RBAC Login</h1>
        <p className="subtitle">
          Login with your assigned role
        </p>

        <label>Username</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="admin or viewer"
          required
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          required
        />

        {message && <div className="error">{message}</div>}

        <button className="btn primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Logging in..." : "Login"}
        </button>

        <div className="demo-box">
          <strong>Demo accounts</strong>
          <div>Admin: admin / admin123</div>
          <div>Viewer: viewer / viewer123</div>
        </div>
      </form>
    </div>
  );
}

function ProtectedRoute({ isAuthenticated, children }) {
  return isAuthenticated ? children : <Navigate to="/" replace />;
}

function Dashboard({ user, token, setUser, setToken }) {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const role = user?.role || "viewer";
  const username = user?.username || "User";
  const isAdmin = role === "admin";

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setToken(null);
    navigate("/");
  }

  async function loadUsers() {
    if (!token) return;
    setLoading(true);

    try {
      const response = await fetch(`${API}/users`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          return;
        }
        throw new Error(data.message || "Failed to load users");
      }

      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      if (error.message.includes("Failed to fetch") || error.name === "TypeError") {
        setMessage("Cannot connect to backend server. Make sure the backend is running on http://localhost:5000");
      } else {
        setMessage(error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function addUser() {
    const newUsername = prompt("New username:");
    const newPassword = prompt("Password:");

    if (!newUsername || !newPassword) return;

    try {
      const response = await fetch(`${API}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          role: "viewer"
        })
      });

      const data = await response.json();
      setMessage(data.message || (response.ok ? "User created successfully" : "Failed to create user"));

      if (response.ok) loadUsers();
    } catch (error) {
      setMessage(error.message || "Failed to add user");
    }
  }

  async function deleteUser(id) {
    if (!confirm("Delete this user?")) return;

    try {
      const response = await fetch(`${API}/users/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      setMessage(data.message || (response.ok ? "User deleted successfully" : "Failed to delete user"));

      if (response.ok) loadUsers();
    } catch (error) {
      setMessage(error.message || "Failed to delete user");
    }
  }

  return (
    <div className="page dashboard-page">
      <header className="navbar">
        <div>
          <h2>RBAC Dashboard</h2>
          <span className={`role-badge ${isAdmin ? "admin" : "viewer"}`}>
            {role.toUpperCase()}
          </span>
        </div>

        <button className="logout-btn" onClick={logout}>
          Logout
        </button>
      </header>

      <main className="dashboard-content">
        <section className="welcome-card">
          <h1>Hello, {username} 👋</h1>
          <p>
            You are logged in as <strong>{role}</strong>.
          </p>

          <div className={`access-message ${isAdmin ? "admin-message" : "viewer-message"}`}>
            {isAdmin
              ? "🔐 You have full administrative access."
              : "👁️ You have read-only access."}
          </div>
        </section>

        <section className="permissions-card">
          <h2>Actions</h2>

          {isAdmin ? (
            <div className="actions">
              <button className="action-btn" onClick={addUser}>
                ➕ Add User
              </button>
              <button className="action-btn" onClick={loadUsers}>
                🔄 Refresh Users
              </button>
            </div>
          ) : (
            <p className="readonly-note">
              Viewer accounts can read user data but cannot modify it.
            </p>
          )}

          {message && <p className="status">{message}</p>}
        </section>

        <section className="permissions-card">
          <h2>Users</h2>

          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Role</th>
                    {isAdmin && <th>Action</th>}
                  </tr>
                </thead>

                <tbody>
                  {Array.isArray(users) && users.length > 0 ? (
                    users.map((item) => (
                      <tr key={item._id || item.id || item.username}>
                        <td>{item.username}</td>
                        <td>{item.role}</td>
                        {isAdmin && (
                          <td>
                            <button
                              className="delete-btn"
                              onClick={() => deleteUser(item._id || item.id)}
                            >
                              Delete
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={isAdmin ? 3 : 2} style={{ textAlign: "center", color: "#64748b" }}>
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      if (!saved || saved === "undefined" || saved === "null") return null;
      return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse user from localStorage:", e);
      localStorage.removeItem("user");
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    const saved = localStorage.getItem("token");
    if (!saved || saved === "undefined" || saved === "null") return null;
    return saved;
  });

  const isAuthenticated = Boolean(user && token);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login setUser={setUser} setToken={setToken} />
            )
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Dashboard
                user={user}
                token={token}
                setUser={setUser}
                setToken={setToken}
              />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
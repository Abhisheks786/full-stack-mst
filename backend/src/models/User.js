import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, "../../data/users.json");

// Ensure data folder exists
const dataDir = path.dirname(DATA_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function readUsersFromFile() {
  if (!fs.existsSync(DATA_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to read users file:", err);
    return [];
  }
}

function writeUsersToFile(users) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2), "utf-8");
}

// Pre-populate with default demo users if empty
export async function initStorage() {
  let users = readUsersFromFile();
  if (users.length === 0) {
    const adminPasswordHash = await bcrypt.hash("admin123", 10);
    const viewerPasswordHash = await bcrypt.hash("viewer123", 10);

    users = [
      {
        _id: "user_admin_1",
        username: "admin",
        password: adminPasswordHash,
        role: "admin",
        createdAt: new Date().toISOString()
      },
      {
        _id: "user_viewer_1",
        username: "viewer",
        password: viewerPasswordHash,
        role: "viewer",
        createdAt: new Date().toISOString()
      }
    ];
    writeUsersToFile(users);
    console.log("Default admin and viewer demo users initialized in data/users.json");
  }
}

const User = {
  async find() {
    const users = readUsersFromFile();
    return {
      select(fields) {
        if (fields === "-password") {
          return users.map(({ password, ...rest }) => rest);
        }
        return users;
      }
    };
  },

  async findOne(query) {
    const users = readUsersFromFile();
    const user = users.find((u) => {
      for (const key of Object.keys(query)) {
        if (u[key] !== query[key]) return false;
      }
      return true;
    });
    return user || null;
  },

  async findById(id) {
    const users = readUsersFromFile();
    const user = users.find((u) => u._id === id || u.id === id);
    return user || null;
  },

  async findByIdAndDelete(id) {
    const users = readUsersFromFile();
    const index = users.findIndex((u) => u._id === id || u.id === id);
    if (index === -1) return null;
    const [deleted] = users.splice(index, 1);
    writeUsersToFile(users);
    return deleted;
  },

  async create(data) {
    const users = readUsersFromFile();
    const newUser = {
      _id: "user_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      username: data.username.trim(),
      password: data.password,
      role: data.role || "viewer",
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    writeUsersToFile(users);
    return newUser;
  }
};

export default User;
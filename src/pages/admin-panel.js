import { useEffect, useState } from "react";
import { auth, db } from "../firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { useRouter } from "next/router";

export default function AdminPanel() {
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState(""); // Search input
    const [filterRole, setFilterRole] = useState("all"); // Role filter
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                router.push("/login");
            } else {
                setUser(currentUser);
                const userSnap = await getDocs(collection(db, "users"));

                if (userSnap.docs.length > 0) {
                    const userData = userSnap.docs.find(doc => doc.id === currentUser.uid)?.data();
                    if (userData?.role === "admin") {
                        setIsAdmin(true);
                        loadUsers();
                    } else {
                        router.push("/not-authorized");
                    }
                }
            }
        });

        return () => unsubscribe();
    }, []);

    // Load all users from Firestore
    const loadUsers = async () => {
        const querySnapshot = await getDocs(collection(db, "users"));
        setUsers(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    // Promote user to admin
    const makeAdmin = async (userId) => {
        await updateDoc(doc(db, "users", userId), { role: "admin" });
        loadUsers();
    };

    // Revoke admin access
    const removeAdmin = async (userId) => {
        await updateDoc(doc(db, "users", userId), { role: "user" });
        loadUsers();
    };

    // Logout
    const handleLogout = async () => {
        await signOut(auth);
        router.push("/login");
    };

    // Filter users based on search term and selected role
    const filteredUsers = users.filter((u) => 
        (filterRole === "all" || u.role === filterRole) &&
        (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (!user) return <p>Loading...</p>;
    if (!isAdmin) return <p>Checking admin status...</p>;

    return (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
            <h1>Admin Panel</h1>
            <p>Manage user roles</p>
            <button onClick={handleLogout}>Logout</button>

            <h2>All Users</h2>

            {/* Search & Filter Controls */}
            <input 
                type="text" 
                placeholder="Search by name or email..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                style={{ marginBottom: "10px", padding: "5px", width: "300px" }}
            />

            <select 
                value={filterRole} 
                onChange={(e) => setFilterRole(e.target.value)}
                style={{ marginLeft: "10px", padding: "5px" }}
            >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
            </select>

            <table border="1" style={{ margin: "auto", marginTop: "20px" }}>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredUsers.map((u) => (
                        <tr key={u.id}>
                            <td>{u.name}</td>
                            <td>{u.email}</td>
                            <td>{u.role}</td>
                            <td>
                                {u.role !== "admin" ? (
                                    <button onClick={() => makeAdmin(u.id)}>Make Admin</button>
                                ) : (
                                    <button onClick={() => removeAdmin(u.id)}>Remove Admin</button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

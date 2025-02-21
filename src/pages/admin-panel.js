import { useEffect, useState } from "react";
import { auth, db } from "../firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { useRouter } from "next/router";

export default function AdminPanel() {
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [users, setUsers] = useState([]);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                router.push("/login");
            } else {
                setUser(currentUser);
                // Check if user is an admin
                const userRef = doc(db, "users", currentUser.uid);
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

    if (!user) return <p>Loading...</p>;
    if (!isAdmin) return <p>Checking admin status...</p>;

    return (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
            <h1>Admin Panel</h1>
            <p>Manage user roles</p>
            <button onClick={handleLogout}>Logout</button>

            <h2>All Users</h2>
            <table border="1" style={{ margin: "auto" }}>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
    {users.map((u) => (
        <tr key={u.id} className="text-center border-b">
            <td className="flex items-center gap-2 p-4">
                <img 
                    src={u.photoURL || "/default-avatar.png"} 
                    alt="Profile" 
                    className="w-10 h-10 rounded-full border"
                />
                {u.name}
            </td>
            <td className="p-4">{u.email}</td>
            <td className="p-4">{u.role}</td>
            <td className="p-4">
                {u.role !== "admin" ? (
                    <button
                        onClick={() => makeAdmin(u.id)}
                        className="bg-blue-500 hover:bg-blue-700 text-white px-3 py-1 rounded-md"
                    >
                        Make Admin
                    </button>
                ) : (
                    <button
                        onClick={() => removeAdmin(u.id)}
                        className="bg-yellow-500 hover:bg-yellow-700 text-white px-3 py-1 rounded-md"
                    >
                        Remove Admin
                    </button>
                )}
            </td>
        </tr>
    ))}
</tbody>

            </table>
        </div>
    );
}

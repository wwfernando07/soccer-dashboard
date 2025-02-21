import { useEffect, useState } from "react";
import { auth, db } from "../firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/router";

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                router.push("/login"); // Redirect if not logged in
            } else {
                setUser(currentUser);

                // Check Firestore for admin role
                const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                if (userDoc.exists() && userDoc.data().role === "admin") {
                    setIsAdmin(true);
                } else {
                    router.push("/not-authorized"); // Redirect non-admins
                }
            }
        });

        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
        router.push("/login");
    };

    if (!user) return <p>Loading...</p>;

    if (!isAdmin) return <p>Checking admin status...</p>;

    return (
        <div style={{ textAlign: "center", marginTop: "100px" }}>
            <h1>Soccer Dashboard</h1>
            <p>Welcome, {user.displayName}!</p>
            <button onClick={handleLogout}>Logout</button>
        </div>
    );
}

import { useEffect, useState } from "react";
import { auth, provider, db } from "../firebaseConfig"; // Import Firebase
import { signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/router";

export default function Login() {
    const [user, setUser] = useState(null);
    const router = useRouter();

    useEffect(() => {
        onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                router.push("/dashboard"); // Redirect logged-in users to dashboard
            }
        });
    }, []);

    const handleGoogleLogin = async () => {
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            setUser(user);

            // Save user data in Firestore
            const userRef = doc(db, "users", user.uid);
            await setDoc(userRef, {
                name: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                role: "user", // Default role
                createdAt: new Date(),
            }, { merge: true });

            router.push("/dashboard"); // Redirect after login
        } catch (error) {
            console.error("Login failed:", error);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        setUser(null);
    };

    return (
        <div style={{ textAlign: "center", marginTop: "100px" }}>
            <h1>Login to Soccer Dashboard</h1>
            {user ? (
                <div>
                    <p>Welcome, {user.displayName}!</p>
                    <button onClick={handleLogout}>Logout</button>
                </div>
            ) : (
                <button onClick={handleGoogleLogin}>Sign in with Google</button>
            )}
        </div>
    );
}

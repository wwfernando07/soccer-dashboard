import { useState, useEffect } from "react";
import { auth, storage, db } from "../firebaseConfig";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function UploadPhoto() {
    const [user, setUser] = useState(null);
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [photoURL, setPhotoURL] = useState(null);

    // Check if user is logged in and load existing profile picture
    useEffect(() => {
        onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                if (userDoc.exists()) {
                    setPhotoURL(userDoc.data().photoURL || "/default-avatar.png");
                }
            }
        });
    }, []);

    // Handle file selection
    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setImage(e.target.files[0]);
        }
    };

    // Upload the image to Firebase Storage
    const handleUpload = async () => {
        if (!image || !user) return;

        setLoading(true);
        const storageRef = ref(storage, `profilePictures/${user.uid}`);

        try {
            await uploadBytes(storageRef, image);
            const downloadURL = await getDownloadURL(storageRef);

            // Update Firestore with the new profile picture URL
            await updateDoc(doc(db, "users", user.uid), { photoURL: downloadURL });

            setPhotoURL(downloadURL); // Update UI
            alert("Profile picture updated!");
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Upload failed. Try again.");
        } finally {
            setLoading(false);
        }
    };

    // Delete profile picture from Firebase Storage & reset in Firestore
    const handleDelete = async () => {
        if (!user || !photoURL) return;

        setLoading(true);
        const storageRef = ref(storage, `profilePictures/${user.uid}`);

        try {
            await deleteObject(storageRef);
            await updateDoc(doc(db, "users", user.uid), { photoURL: "/default-avatar.png" });

            setPhotoURL("/default-avatar.png"); // Reset UI
            alert("Profile picture removed!");
        } catch (error) {
            console.error("Deletion failed:", error);
            alert("Error deleting profile picture.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
            <h1 className="text-2xl font-bold mb-4">Update Profile Picture</h1>

            {/* Display Current Profile Picture */}
            <img src={photoURL} alt="Profile" className="w-32 h-32 rounded-full border mb-4" />

            {/* Upload New Picture */}
            <input type="file" accept="image/*" onChange={handleFileChange} className="mb-4" />
            <button 
                onClick={handleUpload}
                className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded-md mb-2"
                disabled={loading}
            >
                {loading ? "Uploading..." : "Upload New Picture"}
            </button>

            {/* Delete Profile Picture */}
            <button 
                onClick={handleDelete}
                className="bg-red-500 hover:bg-red-700 text-white px-4 py-2 rounded-md"
                disabled={loading}
            >
                {loading ? "Removing..." : "Remove Profile Picture"}
            </button>
        </div>
    );
}

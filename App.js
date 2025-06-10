
import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  set,
  onValue,
  push,
  remove,
  child,
} from "firebase/database";
import DeleteModal from "./DeleteModal";
import "./App.css";

const firebaseConfig = {
  apiKey: "AIzaSyB5tGapvf0uQVQpnLopJBMJEMS8jxyONLo",
  authDomain: "any-dex-73a23.firebaseapp.com",
  databaseURL:
    "https://any-dex-73a23-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "any-dex-73a23",
  storageBucket: "any-dex-73a23.firebasestorage.app",
  messagingSenderId: "464980822152",
  appId: "1:464980822152:web:4a97da8d8c84a88947b73d",
  measurementId: "G-LQKM57CCN8",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

function App() {
  const [user, setUser] = useState(null);
  const [friendName, setFriendName] = useState("");
  const [friendPhone, setFriendPhone] = useState("");
  const [connections, setConnections] = useState([]);
  const [messages, setMessages] = useState([]);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedMsgKey, setSelectedMsgKey] = useState(null);

  // Login Submit
  const handleLogin = (e) => {
    e.preventDefault();
    const name = e.target.name.value.trim();
    const phone = e.target.phone.value.trim();
    if (name && phone) {
      const userObj = { name, phone };
      set(ref(db, `users/${phone}`), userObj);
      setUser(userObj);
    }
  };

  // Connect Friend
  const handleConnect = () => {
    if (!friendName || !friendPhone) return;
    const userRef = ref(db, `connections/${user.phone}`);
    set(child(userRef, friendPhone), { name: friendName, phone: friendPhone });
    setConnections((prev) => [...prev, { name: friendName, phone: friendPhone }]);
    setFriendName("");
    setFriendPhone("");
    document.getElementById("popup").style.display = "none";
  };

  // Load connections and messages
  useEffect(() => {
    if (user) {
      const connRef = ref(db, `connections/${user.phone}`);
      onValue(connRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setConnections(Object.values(data));
        } else {
          setConnections([]);
        }
      });

      const msgRef = ref(db, `messages/${user.phone}`);
      onValue(msgRef, (snapshot) => {
        const data = snapshot.val();
        if (data) setMessages(Object.entries(data));
        else setMessages([]);
      });
    }
  }, [user]);

  // Send message (voice input)
  const handleSendMessage = (text) => {
    if (!text || !user || connections.length === 0) return;
    connections.forEach((friend) => {
      const msgRef = push(ref(db, `messages/${friend.phone}`));
      set(msgRef, {
        from: user.phone,
        text,
        timestamp: Date.now(),
      });
    });
  };

  // Web Speech API Voice recognition
  const simulateVoice = () => {
    if (!("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      alert("Sorry, your browser does not support Speech Recognition.");
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      if (text) handleSendMessage(text);
    };

    recognition.onerror = (event) => {
      alert("Speech recognition error: " + event.error);
    };
  };

  // Modal open/close
  const openModal = (msgKey) => {
    setSelectedMsgKey(msgKey);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedMsgKey(null);
  };

  // Delete messages
  const handleDelete = (msgKey, type) => {
    if (type === "me") {
      remove(ref(db, `messages/${user.phone}/${msgKey}`));
    } else if (type === "everyone") {
      connections.forEach((friend) => {
        remove(ref(db, `messages/${friend.phone}/${msgKey}`));
      });
      remove(ref(db, `messages/${user.phone}/${msgKey}`));
    }
    closeModal();
  };

  // Helper to get friend name by phone
  const getFriendName = (phone) => {
    if (phone === user.phone) return "You";
    const friend = connections.find((f) => f.phone === phone);
    return friend ? friend.name : phone;
  };

  if (!user) {
    return (
      <div className="login">
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <input name="name" placeholder="Full Name" required />
          <input name="phone" placeholder="Phone Number" required />
          <button type="submit">Get Started</button>
        </form>
      </div>
    );
  }

  return (
    <div className="app">
      <h2>Welcome, {user.name}</h2>
      <button
        className="plus"
        onClick={() => (document.getElementById("popup").style.display = "block")}
        title="Add Friend"
      >
        +
      </button>
      <div id="popup" className="popup" style={{ display: "none" }}>
        <input
          placeholder="Friend's Name"
          value={friendName}
          onChange={(e) => setFriendName(e.target.value)}
        />
        <input
          placeholder="Friend's Phone"
          value={friendPhone}
          onChange={(e) => setFriendPhone(e.target.value)}
        />
        <button onClick={handleConnect}>Connect</button>
      </div>

      <div className="friends">
        <h4>Friends</h4>
        <ul>
          {connections.map((f, i) => (
            <li key={i}>
              {f.name} ({f.phone})
            </li>
          ))}
        </ul>
      </div>

      <div className="messages">
        {messages.map(([key, msg]) => (
          <div key={key} onClick={() => openModal(key)} title="Click to delete message">
            <b>{getFriendName(msg.from)}</b>: {msg.text}
          </div>
        ))}
      </div>

      <button className="voice" onClick={simulateVoice} title="Speak to send message">
        🎤
      </button>

      <DeleteModal
        showModal={showModal}
        handleDelete={handleDelete}
        msgKey={selectedMsgKey}
        closeModal={closeModal}
      />
    </div>
  );
}

export default App;

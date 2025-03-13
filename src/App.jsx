import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAUt2CWyLH0TZtbQH3QkS_AqfBG3EOgJbA",
  authDomain: "tzp-dashboard.firebaseapp.com",
  projectId: "tzp-dashboard",
  storageBucket: "tzp-dashboard.firebasestorage.app",
  messagingSenderId: "147828675983",
  appId: "1:147828675983:web:ef7f1d340d9682bd0967fa",
  measurementId: "G-ZLT61Y6CJX",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const App = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [players, setPlayers] = useState([]);
  const [newPlayer, setNewPlayer] = useState("");
  const [matchStats, setMatchStats] = useState({});
  const [sortBy, setSortBy] = useState("kills");
  const [timeFilter, setTimeFilter] = useState("all");

  useEffect(() => {
    const fetchPlayers = async () => {
      const querySnapshot = await getDocs(collection(db, "players"));
      const playersData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPlayers(playersData);
    };
    fetchPlayers();
  }, []);

  const addPlayer = async () => {
    if (newPlayer.trim() !== "") {
      const newPlayerData = {
        name: newPlayer,
        matches: 0,
        kills: 0,
        damage: 0,
        lastMatch: new Date().toISOString(),
      };
      const docRef = await addDoc(collection(db, "players"), newPlayerData);
      setPlayers([...players, { id: docRef.id, ...newPlayerData }]);
      setNewPlayer("");
    }
  };

  const updateStats = async (updates) => {
    const updatedPlayers = await Promise.all(
      players.map(async (player) => {
        const updatedStats = updates[player.name];
        if (updatedStats) {
          const playerRef = doc(db, "players", player.id);
          const newStats = {
            matches: player.matches + 1,
            kills: player.kills + updatedStats.kills,
            damage: player.damage + updatedStats.damage,
            lastMatch: new Date().toISOString(),
          };
          await updateDoc(playerRef, newStats);
          return { ...player, ...newStats };
        }
        return player;
      })
    );
    setPlayers(updatedPlayers);
    setMatchStats({});
  };

  const handleAdminLogin = () => {
    if (adminPassword === "goku0929") {
      setIsAdmin(true);
      setShowAdminLogin(false);
    } else {
      alert("Incorrect password");
    }
    setAdminPassword("");
  };

  const sortedPlayers = [...players].sort((a, b) => b[sortBy] - a[sortBy]);

  const filteredPlayers = sortedPlayers.filter((player) => {
    const now = new Date();
    const lastMatch = new Date(player.lastMatch);
    if (timeFilter === "today") {
      return lastMatch.toDateString() === now.toDateString();
    } else if (timeFilter === "weekly") {
      const oneWeekAgo = new Date(now);
      oneWeekAgo.setDate(now.getDate() - 7);
      return lastMatch >= oneWeekAgo;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold text-center mb-4">
        ZindaPan Leaderboard
      </h1>
      {!isAdmin && (
        <button
          onClick={() => setShowAdminLogin(true)}
          className="p-2 bg-yellow-600 rounded"
        >
          Admin Login
        </button>
      )}
      {showAdminLogin && (
        <div className="mt-4 p-4 bg-gray-800 rounded">
          <input
            type="password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            className="p-2 rounded bg-gray-700 text-white"
            placeholder="Only for Goku"
          />
          <button
            onClick={handleAdminLogin}
            className="ml-2 p-2 bg-blue-600 rounded"
          >
            Login
          </button>
        </div>
      )}
      {isAdmin && (
        <div className="mb-4 mt-4">
          <input
            type="text"
            value={newPlayer}
            onChange={(e) => setNewPlayer(e.target.value)}
            className="p-2 rounded bg-gray-700 text-white"
            placeholder="Enter player name"
          />
          <button onClick={addPlayer} className="ml-2 p-2 bg-blue-600 rounded">
            Add Player
          </button>
        </div>
      )}
      <div className="mb-4 flex gap-4 mt-5 ">
        <select
          onChange={(e) => setSortBy(e.target.value)}
          className="p-2 bg-gray-700 rounded"
        >
          <option value="kills">Sort by Kills</option>
          <option value="damage">Sort by Damage</option>
        </select>
        <select
          onChange={(e) => setTimeFilter(e.target.value)}
          className="p-2 bg-gray-700 rounded"
        >
          <option value="today">Today</option>
          <option value="weekly">Weekly</option>
          <option value="all">All Time</option>
        </select>
      </div>
      <table className="w-full border border-gray-600 text-center">
        <thead>
          <tr className="bg-gray-800">
            <th className="p-2">Matches</th>
            <th className="p-2">Player Name</th>
            <th className="p-2">Kills</th>
            <th className="p-2">Damage</th>
          </tr>
        </thead>
        <tbody>
          {filteredPlayers.map((player) => (
            <tr key={player.id} className="border-t border-gray-600">
              <td className="p-2">{player.matches}</td>
              <td className="p-2">{player.name}</td>
              <td className="p-2">{player.kills}</td>
              <td className="p-2">{player.damage}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {isAdmin && (
        <div className="mb-4 mt-4 p-4 bg-gray-800 rounded">
          <h2 className="text-xl mb-2">Submit Match Stats</h2>
          {players.map((player) => (
            <div
              key={player.id}
              className="flex gap-2 mb-2 flex-col md:flex-row"
            >
              <span className="w-32">{player.name}</span>
              <input
                type="number"
                placeholder="Kills"
                className="p-2 bg-gray-700 rounded"
                onChange={(e) =>
                  setMatchStats((prev) => ({
                    ...prev,
                    [player.name]: {
                      ...prev[player.name],
                      kills: Number(e.target.value) || 0,
                    },
                  }))
                }
              />
              <input
                type="number"
                placeholder="Damage"
                className="p-2 bg-gray-700 rounded"
                onChange={(e) =>
                  setMatchStats((prev) => ({
                    ...prev,
                    [player.name]: {
                      ...prev[player.name],
                      damage: Number(e.target.value) || 0,
                    },
                  }))
                }
              />
            </div>
          ))}
          <button
            onClick={() => updateStats(matchStats)}
            className="p-2 bg-green-600 rounded mt-2"
          >
            Submit Stats
          </button>
        </div>
      )}
    </div>
  );
};

export default App;

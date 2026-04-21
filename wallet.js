/* =========================
   FIREBASE SETUP (INLINE)
========================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  push,
  onValue
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-database.js";

// 🔥 YOUR FIREBASE CONFIG (PUT YOUR REAL VALUES HERE)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);


/* =========================
   START
========================= */
document.addEventListener("DOMContentLoaded", function () {

  console.log("Wallet JS Loaded ✅");

  /* =========================
     SIMPLE USER ID (NO LOGIN)
  ========================= */
  function getUserId() {
    let uid = localStorage.getItem("tzf_uid");

    if (!uid) {
      uid = "user_" + Math.random().toString(36).substring(2, 10);
      localStorage.setItem("tzf_uid", uid);
    }

    return uid;
  }

  const currentUserId = getUserId();

  /* =========================
     ELEMENTS (SAFE)
  ========================= */
  const chooseProviderBtn = document.getElementById("chooseProviderBtn");
  const depositAmountInput = document.getElementById("depositAmount");
  const providerSection = document.getElementById("providerSection");

  const airtelBtn = document.getElementById("airtelBtn");
  const mtnBtn = document.getElementById("mtnBtn");

  const paymentDetails = document.getElementById("paymentDetails");
  const selectedProviderTitle = document.getElementById("selectedProviderTitle");
  const payToNumber = document.getElementById("payToNumber");
  const payAmount = document.getElementById("payAmount");

  const senderNumberInput = document.getElementById("senderNumber");
  const transactionIdInput = document.getElementById("transactionId");
  const confirmDepositBtn = document.getElementById("confirmDepositBtn");

  const activeDepositsList = document.getElementById("activeDepositsList");
  const transactionHistoryList = document.getElementById("transactionHistoryList");

  const depositBalanceEl = document.getElementById("depositBalance");
  const referralBalanceEl = document.getElementById("referralBalance");

  if (!chooseProviderBtn || !providerSection) {
    alert("JS Error: Button or Provider section not found");
    return;
  }

  let currentDepositAmount = 0;
  let selectedProvider = "";

  /* =========================
     CONTINUE BUTTON
  ========================= */
  chooseProviderBtn.onclick = function () {

    const amount = parseFloat(depositAmountInput.value);

    if (!amount || amount < 10) {
      alert("Enter at least ZMK 10");
      return;
    }

    currentDepositAmount = amount;
    providerSection.style.display = "block";
    chooseProviderBtn.style.display = "none";
  };

  /* =========================
     PROVIDER SELECT
  ========================= */
  airtelBtn.onclick = () => showPayment("Airtel Money");
  mtnBtn.onclick = () => showPayment("MTN Mobile Money");

  function showPayment(provider) {
    selectedProvider = provider;

    selectedProviderTitle.textContent = provider;
    payAmount.textContent = "ZMK " + currentDepositAmount.toFixed(2);

    payToNumber.textContent =
      provider === "Airtel Money"
        ? "Send to: 0779653509 (Leah Bwalya)"
        : "Send to: 0768526191 (Lewis Mwaba)";

    paymentDetails.style.display = "block";
  }

  /* =========================
     CONFIRM DEPOSIT
  ========================= */
  confirmDepositBtn.onclick = async function () {

    const senderNumber = senderNumberInput.value.trim();
    const txId = transactionIdInput.value.trim();

    if (!senderNumber || !txId) {
      alert("Fill all fields");
      return;
    }

    const depositId = "d_" + Date.now();

    const data = {
      uid: currentUserId,
      amount: currentDepositAmount,
      provider: selectedProvider,
      senderNumber,
      transactionId: txId,
      status: "pending",
      timestamp: Date.now()
    };

    try {
      await set(ref(db, `users/${currentUserId}/deposits/${depositId}`), data);
      await set(ref(db, `depositRequests/${depositId}`), data);

      await push(ref(db, `notifications/${currentUserId}`), {
        message: "Deposit submitted",
        time: Date.now()
      });

      alert("Deposit submitted ✅");
      resetFlow();

    } catch (err) {
      console.error(err);
      alert("Error saving deposit");
    }
  };

  function resetFlow() {
    depositAmountInput.value = "";
    senderNumberInput.value = "";
    transactionIdInput.value = "";

    providerSection.style.display = "none";
    paymentDetails.style.display = "none";

    chooseProviderBtn.style.display = "block";
  }

  /* =========================
     REAL-TIME DATA
  ========================= */
  onValue(ref(db, `users/${currentUserId}/depositWallet`), snap => {
    const val = snap.exists() ? snap.val() : 0;
    depositBalanceEl.textContent = "ZMK " + Number(val).toFixed(2);
  });

  onValue(ref(db, `users/${currentUserId}/referralWallet`), snap => {
    const val = snap.exists() ? snap.val() : 0;
    referralBalanceEl.textContent = "ZMK " + Number(val).toFixed(2);
  });

  onValue(ref(db, `users/${currentUserId}/deposits`), snap => {
    activeDepositsList.innerHTML = "";

    if (!snap.exists()) {
      activeDepositsList.innerHTML = "<p>No deposits</p>";
      return;
    }

    Object.values(snap.val()).forEach(d => {
      const div = document.createElement("div");
      div.className = "list-item";
      div.textContent = `${d.provider} - ZMK ${d.amount} - ${d.status}`;
      activeDepositsList.prepend(div);
    });
  });

  onValue(ref(db, `users/${currentUserId}/transactions`), snap => {
    transactionHistoryList.innerHTML = "";

    if (!snap.exists()) {
      transactionHistoryList.innerHTML = "<p>No transactions</p>";
      return;
    }

    Object.values(snap.val()).forEach(t => {
      const div = document.createElement("div");
      div.className = "list-item";
      div.textContent = `${t.type}: ZMK ${t.amount}`;
      transactionHistoryList.prepend(div);
    });
  });

});

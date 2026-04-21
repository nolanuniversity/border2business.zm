import { db } from "./firebase.js";
import {
  ref, set, push, onValue
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-database.js";

/* =========================
   WAIT FOR DOM
========================= */
document.addEventListener("DOMContentLoaded", () => {

  console.log("Wallet Loaded ✅");

  /* =========================
     UNIQUE USER (NO LOGIN)
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
     ELEMENTS
  ========================= */
  const depositBalanceEl = document.getElementById("depositBalance");
  const referralBalanceEl = document.getElementById("referralBalance");
  const depositAmountInput = document.getElementById("depositAmount");
  const chooseProviderBtn = document.getElementById("chooseProviderBtn");

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

  let selectedProvider = "";
  let currentDepositAmount = 0;
  let depositBalance = 0;
  let referralBalance = 0;

  /* =========================
     BALANCES (REAL-TIME)
  ========================= */
  function setupRealtimeBalances() {
    const depositRef = ref(db, `users/${currentUserId}/depositWallet`);
    const referralRef = ref(db, `users/${currentUserId}/referralWallet`);

    onValue(depositRef, (snap) => {
      depositBalance = snap.exists() ? Number(snap.val()) : 0;
      updateBalances();
    });

    onValue(referralRef, (snap) => {
      referralBalance = snap.exists() ? Number(snap.val()) : 0;
      updateBalances();
    });
  }

  function updateBalances() {
    depositBalanceEl.textContent = `ZMK ${depositBalance.toFixed(2)}`;
    referralBalanceEl.textContent = `ZMK ${referralBalance.toFixed(2)}`;
  }

  /* =========================
     CONTINUE BUTTON
  ========================= */
  chooseProviderBtn.addEventListener("click", () => {
    const amount = parseFloat(depositAmountInput.value);

    if (!amount || amount < 10) {
      alert("Enter a valid deposit amount (minimum ZMK 10)");
      return;
    }

    currentDepositAmount = amount;

    providerSection.classList.remove("hidden");

    chooseProviderBtn.style.display = "none";
  });

  /* =========================
     PROVIDER SELECT
  ========================= */
  airtelBtn.addEventListener("click", () => showPaymentDetails("Airtel Money"));
  mtnBtn.addEventListener("click", () => showPaymentDetails("MTN Mobile Money"));

  function showPaymentDetails(provider) {
    selectedProvider = provider;

    selectedProviderTitle.textContent = provider;
    payAmount.textContent = `ZMK ${currentDepositAmount.toFixed(2)}`;

    payToNumber.textContent =
      provider === "Airtel Money"
        ? "Send to: 0779653509 (Trust ZedFund Admin — Leah Bwalya)"
        : "Send to: 0768 526 191 (Trust ZedFund Manager — Lewis Mwaba)";

    paymentDetails.classList.remove("hidden");
  }

  /* =========================
     CONFIRM DEPOSIT
  ========================= */
  confirmDepositBtn.addEventListener("click", async () => {
    const senderNumber = senderNumberInput.value.trim();
    const txId = transactionIdInput.value.trim();

    if (!senderNumber || !txId) {
      alert("Enter your mobile number and transaction ID");
      return;
    }

    const depositId = "d_" + Date.now();

    const depositData = {
      uid: currentUserId,
      amount: currentDepositAmount,
      provider: selectedProvider,
      senderNumber,
      transactionId: txId,
      status: "pending",
      timestamp: Date.now()
    };

    try {
      await set(ref(db, `users/${currentUserId}/deposits/${depositId}`), depositData);
      await set(ref(db, `depositRequests/${depositId}`), depositData);

      await push(ref(db, `notifications/${currentUserId}`), {
        message: "💰 Deposit submitted. Awaiting confirmation.",
        read: false,
        time: Date.now(),
        type: "deposit"
      });

      resetDepositFlow();

      alert("Deposit submitted successfully. Pending confirmation.");
    } catch (err) {
      console.error(err);
      alert("Failed to submit deposit.");
    }
  });

  /* =========================
     ACTIVE DEPOSITS
  ========================= */
  function setupRealtimeDeposits() {
    const depositsRef = ref(db, `users/${currentUserId}/deposits`);

    onValue(depositsRef, (snap) => {
      activeDepositsList.innerHTML = "";

      if (!snap.exists()) {
        activeDepositsList.innerHTML = `<p class="subtext">No active deposits yet</p>`;
        return;
      }

      const data = snap.val();

      Object.values(data).forEach(d => {
        const div = document.createElement("div");
        div.className = "list-item";
        div.textContent = `${d.provider} — ZMK ${d.amount.toFixed(2)} — ${d.status}`;
        activeDepositsList.prepend(div);
      });
    });
  }

  /* =========================
     TRANSACTIONS
  ========================= */
  function setupRealtimeTransactions() {
    const txRef = ref(db, `users/${currentUserId}/transactions`);

    onValue(txRef, (snap) => {
      transactionHistoryList.innerHTML = "";

      if (!snap.exists()) {
        transactionHistoryList.innerHTML = `<p class="subtext">No transactions yet</p>`;
        return;
      }

      const data = snap.val();

      Object.values(data).forEach(t => {
        const div = document.createElement("div");
        div.className = "list-item";
        div.textContent = `${t.type}: ZMK ${t.amount.toFixed(2)} via ${t.provider}`;
        transactionHistoryList.prepend(div);
      });
    });
  }

  /* =========================
     RESET
  ========================= */
  function resetDepositFlow() {
    depositAmountInput.value = "";
    senderNumberInput.value = "";
    transactionIdInput.value = "";

    providerSection.classList.add("hidden");
    paymentDetails.classList.add("hidden");

    chooseProviderBtn.style.display = "block";

    currentDepositAmount = 0;
    selectedProvider = "";
  }

  /* =========================
     INIT
  ========================= */
  setupRealtimeBalances();
  setupRealtimeDeposits();
  setupRealtimeTransactions();

});

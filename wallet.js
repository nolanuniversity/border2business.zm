/* =========================
   WALLET JS (NO FIREBASE)
========================= */
document.addEventListener("DOMContentLoaded", function () {

  console.log("Wallet JS Loaded ✅");

  /* =========================
     SIMPLE USER ID
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

  // Initialize balances from localStorage
  let depositBalance = parseFloat(localStorage.getItem("depositBalance") || "0");
  let referralBalance = parseFloat(localStorage.getItem("referralBalance") || "0");
  
  depositBalanceEl.textContent = "ZMK " + depositBalance.toFixed(2);
  referralBalanceEl.textContent = "ZMK " + referralBalance.toFixed(2);

  if (!chooseProviderBtn || !providerSection) {
    console.error("Required elements not found");
    return;
  }

  let currentDepositAmount = 0;
  let selectedProvider = "";

  /* =========================
     CONTINUE BUTTON
  ========================= */
  chooseProviderBtn.onclick = function (e) {
    e.preventDefault();
    console.log("Continue clicked");

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
  confirmDepositBtn.onclick = function (e) {
    e.preventDefault();

    const senderNumber = senderNumberInput.value.trim();
    const txId = transactionIdInput.value.trim();

    if (!senderNumber || !txId) {
      alert("Fill all fields");
      return;
    }

    const depositId = "d_" + Date.now();

    const deposit = {
      uid: currentUserId,
      amount: currentDepositAmount,
      provider: selectedProvider,
      senderNumber,
      transactionId: txId,
      status: "pending",
      timestamp: new Date().toISOString()
    };

    // Save to localStorage
    const deposits = JSON.parse(localStorage.getItem("deposits") || "[]");
    deposits.push(deposit);
    localStorage.setItem("deposits", JSON.stringify(deposits));

    // Update UI
    displayDeposits();
    
    alert("Deposit submitted ✅\nAdmin will verify your payment.");
    resetFlow();
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
     DISPLAY DEPOSITS
  ========================= */
  function displayDeposits() {
    const deposits = JSON.parse(localStorage.getItem("deposits") || "[]");
    
    if (activeDepositsList) {
      activeDepositsList.innerHTML = "";
      
      if (deposits.length === 0) {
        activeDepositsList.innerHTML = "<p>No active deposits yet</p>";
        return;
      }

      deposits.slice().reverse().forEach(d => {
        const div = document.createElement("div");
        div.className = "list-item";
        div.textContent = `${d.provider} - ZMK ${d.amount} - ${d.status}`;
        activeDepositsList.appendChild(div);
      });
    }
  }

  // Initial display
  displayDeposits();

});

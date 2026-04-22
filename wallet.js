/* =========================
   WALLET JS (NO FIREBASE)
========================= */

// SIMPLE USER ID
function getUserId() {
  let uid = localStorage.getItem("tzf_uid");
  if (!uid) {
    uid = "user_" + Math.random().toString(36).substring(2, 10);
    localStorage.setItem("tzf_uid", uid);
  }
  return uid;
}

const currentUserId = getUserId();

// STATE
let currentDepositAmount = 0;
let selectedProvider = "";

document.addEventListener("DOMContentLoaded", function () {

  console.log("✅ Wallet Loaded (No Firebase)");

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
  const depositBalanceEl = document.getElementById("depositBalance");
  const referralBalanceEl = document.getElementById("referralBalance");

  if (!chooseProviderBtn || !depositAmountInput || !providerSection) {
    console.error("❌ Missing required elements");
    return;
  }

  /* =========================
     LOAD BALANCES
  ========================= */
  function loadBalances() {
    const depositBalance = parseFloat(localStorage.getItem("depositBalance") || "0");
    const referralBalance = parseFloat(localStorage.getItem("referralBalance") || "0");

    if (depositBalanceEl) {
      depositBalanceEl.textContent = "ZMK " + depositBalance.toFixed(2);
    }

    if (referralBalanceEl) {
      referralBalanceEl.textContent = "ZMK " + referralBalance.toFixed(2);
    }
  }

  /* =========================
     LOAD DEPOSITS
  ========================= */
  function loadDeposits() {
    if (!activeDepositsList) return;

    const deposits = JSON.parse(localStorage.getItem("deposits") || "[]");
    const userDeposits = deposits.filter(d => d.uid === currentUserId);

    activeDepositsList.innerHTML = "";

    if (userDeposits.length === 0) {
      activeDepositsList.innerHTML = '<p class="subtext">No active deposits yet</p>';
      return;
    }

    userDeposits.reverse().forEach(d => {
      const div = document.createElement("div");
      div.className = "list-item";
      div.textContent = `${d.provider} - ZMK ${d.amount} - ${d.status}`;
      activeDepositsList.appendChild(div);
    });
  }

  /* =========================
     SHOW PAYMENT
  ========================= */
  function showPayment(provider) {
    selectedProvider = provider;

    selectedProviderTitle.textContent = provider;
    payAmount.textContent = "ZMK " + currentDepositAmount.toFixed(2);

    payToNumber.textContent =
      provider === "Airtel Money"
        ? "Send to: 0975914001 (Lewis Mwaba)"
        : "Send to: 0768526191 (Lewis Mwaba)";

    paymentDetails.classList.remove("hidden");
  }

  /* =========================
     RESET
  ========================= */
  function resetFlow() {
    depositAmountInput.value = "";
    senderNumberInput.value = "";
    transactionIdInput.value = "";

    providerSection.classList.add("hidden");
    paymentDetails.classList.add("hidden");

    chooseProviderBtn.style.display = "block";
  }

  /* =========================
     EVENTS
  ========================= */

  // CONTINUE
  chooseProviderBtn.addEventListener("click", function (e) {
    e.preventDefault();

    const amount = parseFloat(depositAmountInput.value);

    if (!amount || amount < 10) {
      alert("Enter at least ZMK 10");
      return;
    }

    currentDepositAmount = amount;
    providerSection.classList.remove("hidden");
    chooseProviderBtn.style.display = "none";
  });

  // PROVIDERS
  airtelBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    showPayment("Airtel Money");
  });

  mtnBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    showPayment("MTN Mobile Money");
  });

  /* =========================
     CONFIRM + WHATSAPP
  ========================= */
  confirmDepositBtn?.addEventListener("click", function (e) {
    e.preventDefault();

    const senderNumber = senderNumberInput.value.trim();
    const txId = transactionIdInput.value.trim();

    if (!senderNumber || !txId) {
      alert("Fill all fields");
      return;
    }

    if (!currentDepositAmount || !selectedProvider) {
      alert("Complete deposit steps first");
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
      // ✅ SAVE LOCALLY
      const deposits = JSON.parse(localStorage.getItem("deposits") || "[]");
      deposits.push(data);
      localStorage.setItem("deposits", JSON.stringify(deposits));

      // ✅ WHATSAPP MESSAGE
      const message =
`Thank you for making your payment 🙏

🆔 Deposit ID: ${depositId}
💰 Amount: ZMK ${currentDepositAmount}
🏦 Provider: ${selectedProvider}
📱 Sender: ${senderNumber}
🔖 Transaction ID: ${txId}

Please send us your proof of payment (screenshot or receipt) here.`;

      const yourWhatsAppNumber = "260771196634"; // 🔴 YOUR NUMBER

      const url = `https://wa.me/${yourWhatsAppNumber}?text=${encodeURIComponent(message)}`;

      window.open(url, "_blank");

      alert("Deposit saved. Continue on WhatsApp ✅");

      resetFlow();
      loadDeposits();

    } catch (err) {
      console.error(err);
      alert("Error saving deposit");
    }
  });

  /* =========================
     INIT
  ========================= */
  loadBalances();
  loadDeposits();

});

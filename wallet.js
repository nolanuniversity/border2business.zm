/* =========================
   WALLET JS (MODULE VERSION)
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

// State
let currentDepositAmount = 0;
let selectedProvider = "";

document.addEventListener("DOMContentLoaded", function () {
  console.log("✅ Wallet Module Loaded");

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

  // Check if critical elements exist
  if (!chooseProviderBtn || !providerSection || !depositAmountInput) {
    console.error("❌ Required elements not found!");
    return;
  }

  /* =========================
     LOAD BALANCES FROM LOCALSTORAGE
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
     LOAD DEPOSITS FROM LOCALSTORAGE
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
      div.textContent = `${d.provider || 'Unknown'} - ZMK ${d.amount} - ${d.status || 'pending'}`;
      activeDepositsList.appendChild(div);
    });
  }

  /* =========================
     SHOW PAYMENT FUNCTION
  ========================= */
  function showPayment(provider) {
    selectedProvider = provider;

    if (selectedProviderTitle) {
      selectedProviderTitle.textContent = provider;
    }
    if (payAmount) {
      payAmount.textContent = "ZMK " + currentDepositAmount.toFixed(2);
    }
    if (payToNumber) {
      payToNumber.textContent = provider === "Airtel Money"
        ? "Send to: 097 5914001 (Lewis Mwaba)"
        : "Send to: 0768526191 (Lewis Mwaba)";
    }

    if (paymentDetails) {
      paymentDetails.classList.remove("hidden");
    }
  }

  /* =========================
     RESET FLOW
  ========================= */
  function resetFlow() {
    if (depositAmountInput) depositAmountInput.value = "";
    if (senderNumberInput) senderNumberInput.value = "";
    if (transactionIdInput) transactionIdInput.value = "";

    if (providerSection) providerSection.classList.add("hidden");
    if (paymentDetails) paymentDetails.classList.add("hidden");

    if (chooseProviderBtn) chooseProviderBtn.classList.remove("hidden");
    chooseProviderBtn.style.display = "block";
  }

  /* =========================
     EVENT LISTENERS
  ========================= */

  // CONTINUE BUTTON
  chooseProviderBtn.addEventListener("click", function (e) {
    e.preventDefault();
    console.log("🔥 Continue clicked");

    const amount = parseFloat(depositAmountInput.value);

    if (!amount || amount < 10) {
      alert("Enter at least ZMK 10");
      return;
    }

    currentDepositAmount = amount;
    providerSection.classList.remove("hidden");
    chooseProviderBtn.style.display = "none";
  });

  // PROVIDER BUTTONS
  if (airtelBtn) {
    airtelBtn.addEventListener("click", function (e) {
      e.preventDefault();
      showPayment("Airtel Money");
    });
  }

  if (mtnBtn) {
    mtnBtn.addEventListener("click", function (e) {
      e.preventDefault();
      showPayment("MTN Mobile Money");
    });
  }

  // CONFIRM DEPOSIT BUTTON
if (confirmDepositBtn) {
  confirmDepositBtn.addEventListener("click", async function (e) {
    e.preventDefault();

    const senderNumber = senderNumberInput?.value.trim() || "";
    const txId = transactionIdInput?.value.trim() || "";

    if (!senderNumber || !txId) {
      alert("Fill all fields");
      return;
    }

    if (!currentDepositAmount || currentDepositAmount <= 0) {
      alert("Enter deposit amount first");
      return;
    }

    if (!selectedProvider) {
      alert("Select provider first");
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
      // ✅ SAVE TO FIREBASE
      await set(ref(db, `users/${currentUserId}/deposits/${depositId}`), data);
      await set(ref(db, `depositRequests/${depositId}`), data);

      await push(ref(db, `notifications/${currentUserId}`), {
        message: "Deposit submitted",
        time: Date.now()
      });

      // ✅ WHATSAPP MESSAGE
      const message =
`Thank you for making your payment 🙏

🆔 Deposit ID: ${depositId}
💰 Amount: ZMK ${currentDepositAmount}
🏦 Provider: ${selectedProvider}
📱 Sender: ${senderNumber}
🔖 Transaction ID: ${txId}

Please send us your proof of payment (screenshot or receipt) here.`;

      const yourWhatsAppNumber = "260771196634"; // 🔴 PUT YOUR NUMBER

      const url = `https://wa.me/${yourWhatsAppNumber}?text=${encodeURIComponent(message)}`;

      // ✅ OPEN WHATSAPP
      window.open(url, "_blank");

      alert("Deposit saved. Continue on WhatsApp ✅");

      resetFlow();

    } catch (err) {
      console.error(err);
      alert("Error saving deposit");
    }
  });
                }
   
   

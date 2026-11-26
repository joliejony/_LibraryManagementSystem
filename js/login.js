/* Demo account sign-in, sign-up, password reset, and sign-out. */
document.addEventListener("DOMContentLoaded", () => {
    const app = window.CPLPrototype;
    if (app.blocked) return;
    const { sessionKey, getStorage, setStorage, readJSON, writeJSON, params, isSignedIn } = app;
    /* ---------- Log in ---------- */
    const loginForm = document.querySelector("[data-login-form]");
    const loginError = document.querySelector("[data-login-error]");
    const defaultLoginError = loginError?.innerHTML || "";
    const resetDialog = document.querySelector("#password-reset-dialog");
    const resetForm = document.querySelector("#password-reset-form");
    const resetFeedback = document.querySelector("[data-reset-feedback]");
    const createDialog = document.querySelector("#create-account-dialog");
    const createForm = document.querySelector("#create-account-form");
    const createFeedback = document.querySelector("[data-create-feedback]");
    const resetPasswordVisibility = (form) => form.querySelectorAll("[data-toggle-password]").forEach((button) => {
        const input = document.getElementById(button.dataset.togglePassword);
        if (input) input.type = "password";
        button.textContent = "Show";
        button.setAttribute("aria-label", "Show password");
        button.setAttribute("aria-pressed", "false");
    });
    document.querySelectorAll(".login-form").forEach((form) => form.addEventListener("reset", () => resetPasswordVisibility(form)));
    document.querySelectorAll("dialog").forEach((dialog) => dialog.addEventListener("close", () => {
        dialog.querySelectorAll(".login-form").forEach(resetPasswordVisibility);
    }));
    document.querySelectorAll("[data-toggle-password]").forEach((button) => button.addEventListener("click", () => {
        const input = document.getElementById(button.dataset.togglePassword);
        if (!input) return;
        const visible = input.type === "password";
        input.type = visible ? "text" : "password";
        button.textContent = visible ? "Hide" : "Show";
        button.setAttribute("aria-label", `${visible ? "Hide" : "Show"} password`);
        button.setAttribute("aria-pressed", String(visible));
        input.focus({ preventScroll: true });
    }));
    const accountsKey = "cpl-demo-accounts";
    const currentUserKey = "cpl-demo-current-user";
    const oldPasswordKey = "cpl-demo-password";
    let accounts = readJSON(accountsKey, null);
    if (Array.isArray(accounts)) accounts = accounts.filter((account) => account && typeof account.name === "string" && typeof account.email === "string" && typeof account.cardNumber === "string" && typeof account.password === "string");
    if (!Array.isArray(accounts) || !accounts.length) {
        let oldPassword = "library";
        try { oldPassword = localStorage.getItem(oldPasswordKey) || "library"; } catch {}
        accounts = [{ name: "Maria", email: "maria@example.com", cardNumber: "3456", password: oldPassword }];
        writeJSON(accountsKey, accounts);
    }

    const activeEmail = getStorage(currentUserKey);
    const activeAccount = accounts.find((account) => account.email === activeEmail);
    if (activeAccount) {
        const accountTitle = document.querySelector("#account-title");
        const cardNumber = document.querySelector(".library-card-number strong");
        if (accountTitle) accountTitle.textContent = `Hello, ${activeAccount.name}`;
        if (cardNumber) cardNumber.textContent = activeAccount.cardNumber.slice(-4);
    }

    document.querySelectorAll(".account-menu a").forEach((link) => {
        if (link.textContent.trim().toLowerCase() === "log out") {
            link.textContent = isSignedIn ? "Log out" : "Sign in";
            link.href = isSignedIn ? "Login.html?logout=1" : "Login.html";
        }
    });
    if (params.get("logout") === "1") {
        try {
            localStorage.removeItem(sessionKey);
            localStorage.removeItem(currentUserKey);
        } catch {
            setStorage(sessionKey, "");
            setStorage(currentUserKey, "");
        }
        if (loginError) {
            loginError.classList.add("is-info");
            loginError.innerHTML = "<strong>You’re signed out.</strong><span>Your saved books, holds, and event registrations remain in this browser.</span>";
            loginError.hidden = false;
        }
    }
    if (loginForm && loginError) {
        const idInput = loginForm.querySelector("#library-id");
        const passwordInput = loginForm.querySelector("#login-password");
        const next = params.get("next");
        if (next && params.get("logout") !== "1") {
            const nextPage = next.split(/[?#]/, 1)[0].split("/").pop();
            const message = nextPage === "PlaceHold.html"
                ? "Sign in to place your hold. Your selected book and format will be waiting."
                : nextPage === "MyAccount.html" ? "Sign in to view your library account." : "Sign in to continue.";
            loginError.classList.add("is-info");
            loginError.innerHTML = `<strong>${message}</strong><span>Use your demo email or card number and password to continue.</span>`;
            loginError.hidden = false;
        }
        const openReset = () => { if (resetFeedback) resetFeedback.textContent = ""; resetDialog?.showModal(); resetDialog?.querySelector("#reset-email")?.focus(); };
        document.addEventListener("click", (event) => {
            if (!event.target.closest("[data-forgot-password]")) return;
            event.preventDefault(); openReset();
        });
        loginForm.addEventListener("submit", (event) => {
            event.preventDefault();
            loginError.classList.remove("is-info");
            if (!idInput.value.trim() || !passwordInput.value) {
                loginError.innerHTML = "<strong>Please fill in both fields.</strong><span>Enter your email or library card number and your password.</span>";
                loginError.hidden = false;
                (idInput.value.trim() ? passwordInput : idInput).focus();
                return;
            }
            const identifier = idInput.value.trim().toLowerCase();
            const member = accounts.find((account) => account.email.toLowerCase() === identifier || account.cardNumber === idInput.value.trim());
            if (!member || passwordInput.value !== member.password) {
                loginError.innerHTML = defaultLoginError;
                loginError.hidden = false;
                idInput.setAttribute("aria-invalid", "true");
                passwordInput.setAttribute("aria-invalid", "true");
                passwordInput.value = "";
                passwordInput.focus();
                return;
            }
            setStorage(sessionKey, "true");
            setStorage(currentUserKey, member.email);
            let destination = "MyAccount.html";
            if (next) {
                try {
                    const candidate = new URL(next, location.href);
                    const allowedPages = ["MyAccount.html", "PlaceHold.html", "BookDetails.html", "Browse.html", "Events.html"];
                    if (candidate.origin === location.origin && allowedPages.includes(candidate.pathname.split("/").pop())) destination = `${candidate.pathname.split("/").pop()}${candidate.search}${candidate.hash}`;
                } catch { /* Invalid return path: use the account page. */ }
            }
            location.href = destination;
        });
        [idInput, passwordInput].forEach((input) => input.addEventListener("input", () => input.removeAttribute("aria-invalid")));
    }
    resetForm?.addEventListener("submit", (event) => {
        event.preventDefault();
        const email = resetForm.querySelector("#reset-email").value.trim().toLowerCase();
        const nextPassword = resetForm.querySelector("#new-password").value;
        const confirmPassword = resetForm.querySelector("#confirm-password").value;
        const memberIndex = accounts.findIndex((account) => account.email.toLowerCase() === email);
        if (memberIndex < 0) { resetFeedback.textContent = "No demo account uses that email. Create an account first, or check the address."; return; }
        if (nextPassword !== confirmPassword) { resetFeedback.textContent = "The passwords do not match. Please enter them again."; resetForm.querySelector("#confirm-password").focus(); return; }
        accounts[memberIndex].password = nextPassword;
        writeJSON(accountsKey, accounts);
        resetFeedback.textContent = "Your demo password was changed. Sign in with this email and your new password. No email was sent.";
        resetForm.reset();
    });
    document.querySelector("[data-create-account]")?.addEventListener("click", () => {
        if (createFeedback) createFeedback.textContent = "";
        createForm?.reset();
        createDialog?.showModal();
        createDialog?.querySelector("#new-member-name")?.focus();
    });
    createForm?.addEventListener("submit", (event) => {
        event.preventDefault();
        const name = createForm.querySelector("#new-member-name").value.trim();
        const email = createForm.querySelector("#new-member-email").value.trim().toLowerCase();
        const password = createForm.querySelector("#new-member-password").value;
        const confirmation = createForm.querySelector("#new-member-password-confirm").value;
        if (!name) {
            createFeedback.textContent = "Enter your name to create the demo account.";
            createForm.querySelector("#new-member-name").focus();
            return;
        }
        if (password !== confirmation) {
            createFeedback.textContent = "The passwords do not match. Please enter them again.";
            createForm.querySelector("#new-member-password-confirm").focus();
            return;
        }
        if (accounts.some((account) => account.email.toLowerCase() === email)) {
            createFeedback.textContent = "An account already uses this email. Sign in or use Forgot password?";
            createForm.querySelector("#new-member-email").focus();
            return;
        }
        const cardNumber = String(100000 + accounts.length);
        accounts.push({ name, email, cardNumber, password });
        writeJSON(accountsKey, accounts);
        createDialog.close();
        createForm.reset();
        const idInput = loginForm?.querySelector("#library-id");
        if (idInput) idInput.value = email;
        if (loginError) {
            loginError.classList.add("is-info");
            loginError.innerHTML = "<strong>Your demo account is ready.</strong><span></span>";
            loginError.querySelector("span").textContent = `Sign in with ${email} or card ${cardNumber}, and the password you chose.`;
            loginError.hidden = false;
        }
    });
});

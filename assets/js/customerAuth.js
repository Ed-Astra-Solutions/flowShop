/**
 * Flow Hydration - Customer Authentication
 * Handles OTP-based login via WhatsApp/SMS
 */

const CustomerAuth = (function() {
    // Production: https://api.flowhydration.in/api/customer
    // Local: /api/customer (relative path for same-origin)
    const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? '/api/customer'
        : 'https://api.flowhydration.in/api/customer';
    
    const TOKEN_KEY = 'flow_customer_token';
    const CUSTOMER_KEY = 'flow_customer';
    
    // State
    let currentMobile = '';
    let isNewCustomer = false;
    let onLoginSuccess = null;
    
    // ==================== Token Management ====================
    
    function getToken() {
        return localStorage.getItem(TOKEN_KEY);
    }
    
    function setToken(token) {
        localStorage.setItem(TOKEN_KEY, token);
    }
    
    function removeToken() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(CUSTOMER_KEY);
    }
    
    function getCustomer() {
        const data = localStorage.getItem(CUSTOMER_KEY);
        return data ? JSON.parse(data) : null;
    }
    
    function setCustomer(customer) {
        localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
    }
    
    function isLoggedIn() {
        return !!getToken();
    }
    
    function getAuthHeaders() {
        const token = getToken();
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }
    
    // ==================== API Calls ====================
    
    async function sendOTP(mobile, channel = 'whatsapp') {
        try {
            const response = await fetch(`${API_BASE}/send-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ mobile, channel })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to send OTP');
            }
            
            return data;
        } catch (error) {
            console.error('Send OTP error:', error);
            throw error;
        }
    }
    
    async function verifyOTP(mobile, otp, name = null) {
        try {
            const body = { mobile, otp };
            if (name) body.name = name;
            
            const response = await fetch(`${API_BASE}/verify-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Verification failed');
            }
            
            return data;
        } catch (error) {
            console.error('Verify OTP error:', error);
            throw error;
        }
    }
    
    async function checkAuth() {
        try {
            const token = getToken();
            if (!token) return false;
            
            const response = await fetch(`${API_BASE}/check-auth`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                removeToken();
                return false;
            }
            
            const data = await response.json();
            if (data.customer) {
                setCustomer(data.customer);
            }
            return true;
        } catch (error) {
            removeToken();
            return false;
        }
    }
    
    async function getProfile() {
        try {
            const response = await fetch(`${API_BASE}/profile`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    removeToken();
                }
                throw new Error('Failed to load profile');
            }
            
            const data = await response.json();
            if (data.customer) {
                setCustomer(data.customer);
            }
            return data;
        } catch (error) {
            console.error('Get profile error:', error);
            throw error;
        }
    }
    
    async function updateName(name) {
        try {
            const response = await fetch(`${API_BASE}/update-name`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify({ name })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to update name');
            }
            
            if (data.customer) {
                setCustomer(data.customer);
            }
            return data;
        } catch (error) {
            console.error('Update name error:', error);
            throw error;
        }
    }
    
    // ==================== UI Functions ====================
    
    function createLoginModal() {
        // Check if modal already exists
        if (document.getElementById('loginModal')) return;
        
        const modal = document.createElement('div');
        modal.id = 'loginModal';
        modal.className = 'login-modal';
        modal.innerHTML = `
            <div class="login-modal-backdrop"></div>
            <div class="login-modal-container">
                <button class="login-modal-close" onclick="CustomerAuth.closeModal()">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                
                <!-- Step 1: Enter Mobile -->
                <div class="login-step" id="loginStepMobile">
                    <div class="login-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                            <line x1="12" y1="18" x2="12" y2="18"/>
                        </svg>
                    </div>
                    <h2 class="login-title">Login to Flow</h2>
                    <p class="login-subtitle">Enter your mobile number to receive OTP</p>
                    
                    <div class="login-input-group">
                        <span class="login-input-prefix">+91</span>
                        <input type="tel" id="loginMobile" class="login-input" placeholder="Enter mobile number" maxlength="10" autocomplete="tel">
                    </div>
                    
                    <div class="login-channel-toggle">
                        <label class="channel-option">
                            <input type="radio" name="otpChannel" value="whatsapp" checked>
                            <span class="channel-label">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                </svg>
                                WhatsApp
                            </span>
                        </label>
                        <label class="channel-option">
                            <input type="radio" name="otpChannel" value="sms">
                            <span class="channel-label">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                </svg>
                                SMS
                            </span>
                        </label>
                    </div>
                    
                    <button class="login-btn" id="btnSendOTP" onclick="CustomerAuth.handleSendOTP()">
                        <span>Send OTP</span>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                    </button>
                    
                    <p class="login-terms">By continuing, you agree to our <a href="#">Terms</a> & <a href="#">Privacy Policy</a></p>
                </div>
                
                <!-- Step 2: Enter OTP -->
                <div class="login-step" id="loginStepOTP" style="display: none;">
                    <div class="login-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                    </div>
                    <h2 class="login-title">Verify OTP</h2>
                    <p class="login-subtitle">Enter the 6-digit code sent to <span id="otpMobileDisplay"></span></p>
                    
                    <div class="otp-input-container">
                        <input type="text" class="otp-digit" maxlength="1" data-index="0" inputmode="numeric">
                        <input type="text" class="otp-digit" maxlength="1" data-index="1" inputmode="numeric">
                        <input type="text" class="otp-digit" maxlength="1" data-index="2" inputmode="numeric">
                        <input type="text" class="otp-digit" maxlength="1" data-index="3" inputmode="numeric">
                        <input type="text" class="otp-digit" maxlength="1" data-index="4" inputmode="numeric">
                        <input type="text" class="otp-digit" maxlength="1" data-index="5" inputmode="numeric">
                    </div>
                    
                    <button class="login-btn" id="btnVerifyOTP" onclick="CustomerAuth.handleVerifyOTP()">
                        <span>Verify & Login</span>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                    </button>
                    
                    <div class="login-resend">
                        <span>Didn't receive code?</span>
                        <button id="btnResendOTP" onclick="CustomerAuth.handleResendOTP()" disabled>Resend in <span id="resendTimer">60</span>s</button>
                    </div>
                    
                    <button class="login-back" onclick="CustomerAuth.goToMobileStep()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M19 12H5M12 19l-7-7 7-7"/>
                        </svg>
                        Change Number
                    </button>
                </div>
                
                <!-- Step 3: Enter Name (for new customers) -->
                <div class="login-step" id="loginStepName" style="display: none;">
                    <div class="login-icon success">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                        </svg>
                    </div>
                    <h2 class="login-title">Welcome to Flow!</h2>
                    <p class="login-subtitle">What should we call you?</p>
                    
                    <div class="login-input-group">
                        <input type="text" id="loginName" class="login-input full" placeholder="Enter your name" autocomplete="name">
                    </div>
                    
                    <button class="login-btn" id="btnSaveName" onclick="CustomerAuth.handleSaveName()">
                        <span>Continue</span>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                    </button>
                </div>
                
                <div class="login-error" id="loginError" style="display: none;"></div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Setup OTP input handlers
        setupOTPInputs();
        
        // Setup mobile input
        const mobileInput = document.getElementById('loginMobile');
        mobileInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
        });
        mobileInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSendOTP();
        });
        
        // Setup name input
        const nameInput = document.getElementById('loginName');
        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSaveName();
        });
        
        // Close on backdrop click
        modal.querySelector('.login-modal-backdrop').addEventListener('click', closeModal);
    }
    
    function setupOTPInputs() {
        const inputs = document.querySelectorAll('.otp-digit');
        
        inputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                const value = e.target.value.replace(/\D/g, '');
                e.target.value = value;
                
                if (value && index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }
                
                // Auto-submit when all digits are entered
                if (index === inputs.length - 1 && value) {
                    const otp = Array.from(inputs).map(i => i.value).join('');
                    if (otp.length === 6) {
                        handleVerifyOTP();
                    }
                }
            });
            
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    inputs[index - 1].focus();
                }
            });
            
            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const pasteData = (e.clipboardData || window.clipboardData).getData('text');
                const digits = pasteData.replace(/\D/g, '').slice(0, 6);
                
                digits.split('').forEach((digit, i) => {
                    if (inputs[i]) {
                        inputs[i].value = digit;
                    }
                });
                
                if (digits.length === 6) {
                    inputs[5].focus();
                    setTimeout(() => handleVerifyOTP(), 100);
                }
            });
        });
    }
    
    function showModal(callback = null) {
        createLoginModal();
        onLoginSuccess = callback;
        
        const modal = document.getElementById('loginModal');
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Focus mobile input
        setTimeout(() => {
            document.getElementById('loginMobile').focus();
        }, 300);
    }
    
    function closeModal() {
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
            
            // Reset state
            setTimeout(() => {
                resetModal();
            }, 300);
        }
    }
    
    function resetModal() {
        currentMobile = '';
        isNewCustomer = false;
        
        // Reset inputs
        const mobileInput = document.getElementById('loginMobile');
        if (mobileInput) mobileInput.value = '';
        
        const nameInput = document.getElementById('loginName');
        if (nameInput) nameInput.value = '';
        
        document.querySelectorAll('.otp-digit').forEach(input => {
            input.value = '';
        });
        
        // Reset steps
        document.getElementById('loginStepMobile').style.display = 'block';
        document.getElementById('loginStepOTP').style.display = 'none';
        document.getElementById('loginStepName').style.display = 'none';
        
        // Hide error
        document.getElementById('loginError').style.display = 'none';
    }
    
    function showError(message) {
        const errorEl = document.getElementById('loginError');
        errorEl.textContent = message;
        errorEl.style.display = 'block';
        
        setTimeout(() => {
            errorEl.style.display = 'none';
        }, 5000);
    }
    
    function setButtonLoading(btnId, loading) {
        const btn = document.getElementById(btnId);
        if (loading) {
            btn.disabled = true;
            btn.classList.add('loading');
        } else {
            btn.disabled = false;
            btn.classList.remove('loading');
        }
    }
    
    function goToMobileStep() {
        document.getElementById('loginStepMobile').style.display = 'block';
        document.getElementById('loginStepOTP').style.display = 'none';
        document.getElementById('loginStepName').style.display = 'none';
        document.getElementById('loginError').style.display = 'none';
        
        setTimeout(() => {
            document.getElementById('loginMobile').focus();
        }, 100);
    }
    
    function goToOTPStep() {
        document.getElementById('loginStepMobile').style.display = 'none';
        document.getElementById('loginStepOTP').style.display = 'block';
        document.getElementById('loginStepName').style.display = 'none';
        document.getElementById('loginError').style.display = 'none';
        
        document.getElementById('otpMobileDisplay').textContent = `+91 ${currentMobile}`;
        
        // Start resend timer
        startResendTimer();
        
        // Focus first OTP input
        setTimeout(() => {
            document.querySelector('.otp-digit').focus();
        }, 100);
    }
    
    function goToNameStep() {
        document.getElementById('loginStepMobile').style.display = 'none';
        document.getElementById('loginStepOTP').style.display = 'none';
        document.getElementById('loginStepName').style.display = 'block';
        document.getElementById('loginError').style.display = 'none';
        
        setTimeout(() => {
            document.getElementById('loginName').focus();
        }, 100);
    }
    
    let resendTimerInterval = null;
    
    function startResendTimer() {
        let seconds = 60;
        const timerEl = document.getElementById('resendTimer');
        const btnResend = document.getElementById('btnResendOTP');
        
        btnResend.disabled = true;
        timerEl.textContent = seconds;
        
        if (resendTimerInterval) clearInterval(resendTimerInterval);
        
        resendTimerInterval = setInterval(() => {
            seconds--;
            timerEl.textContent = seconds;
            
            if (seconds <= 0) {
                clearInterval(resendTimerInterval);
                btnResend.disabled = false;
                btnResend.innerHTML = 'Resend OTP';
            }
        }, 1000);
    }
    
    // ==================== Event Handlers ====================
    
    async function handleSendOTP() {
        const mobile = document.getElementById('loginMobile').value.trim();
        const channel = document.querySelector('input[name="otpChannel"]:checked').value;
        
        if (!mobile || mobile.length !== 10) {
            showError('Please enter a valid 10-digit mobile number');
            return;
        }
        
        if (!/^[6-9]\d{9}$/.test(mobile)) {
            showError('Please enter a valid Indian mobile number');
            return;
        }
        
        setButtonLoading('btnSendOTP', true);
        
        try {
            const result = await sendOTP(mobile, channel);
            currentMobile = mobile;
            isNewCustomer = result.isNewCustomer;
            
            // Dev mode - show OTP in console
            if (result.otp) {
                console.log(`[DEV] OTP: ${result.otp}`);
            }
            
            goToOTPStep();
        } catch (error) {
            showError(error.message);
        } finally {
            setButtonLoading('btnSendOTP', false);
        }
    }
    
    async function handleVerifyOTP() {
        const otpInputs = document.querySelectorAll('.otp-digit');
        const otp = Array.from(otpInputs).map(i => i.value).join('');
        
        if (otp.length !== 6) {
            showError('Please enter the complete 6-digit OTP');
            return;
        }
        
        setButtonLoading('btnVerifyOTP', true);
        
        try {
            const result = await verifyOTP(currentMobile, otp);
            
            // Store token and customer data
            setToken(result.token);
            if (result.customer) {
                setCustomer(result.customer);
            }
            
            // Check if name is needed
            if (result.needsName) {
                goToNameStep();
            } else {
                // Login complete
                handleLoginSuccess(result.customer);
            }
        } catch (error) {
            showError(error.message);
            // Clear OTP inputs on error
            otpInputs.forEach(input => input.value = '');
            otpInputs[0].focus();
        } finally {
            setButtonLoading('btnVerifyOTP', false);
        }
    }
    
    async function handleResendOTP() {
        const channel = document.querySelector('input[name="otpChannel"]:checked').value;
        
        try {
            const result = await sendOTP(currentMobile, channel);
            
            // Dev mode - show OTP in console
            if (result.otp) {
                console.log(`[DEV] OTP: ${result.otp}`);
            }
            
            // Restart timer
            startResendTimer();
            
            // Clear OTP inputs
            document.querySelectorAll('.otp-digit').forEach(input => {
                input.value = '';
            });
            document.querySelector('.otp-digit').focus();
            
        } catch (error) {
            showError(error.message);
        }
    }
    
    async function handleSaveName() {
        const name = document.getElementById('loginName').value.trim();
        
        if (!name) {
            showError('Please enter your name');
            return;
        }
        
        setButtonLoading('btnSaveName', true);
        
        try {
            const result = await updateName(name);
            handleLoginSuccess(result.customer);
        } catch (error) {
            showError(error.message);
        } finally {
            setButtonLoading('btnSaveName', false);
        }
    }
    
    function handleLoginSuccess(customer) {
        closeModal();
        
        // Update UI
        updateAuthUI();
        
        // Call success callback if provided
        if (onLoginSuccess && typeof onLoginSuccess === 'function') {
            onLoginSuccess(customer);
        }
        
        // Show success toast
        showToast(`Welcome${customer?.name ? ', ' + customer.name : ''}!`);
    }
    
    function logout() {
        removeToken();
        updateAuthUI();
        showToast('Logged out successfully');
    }
    
    // ==================== UI Updates ====================
    
    function updateAuthUI() {
        const customer = getCustomer();
        const profileBtns = document.querySelectorAll('.profile-btn');
        
        profileBtns.forEach(btn => {
            if (customer && customer.name) {
                // Show first letter of name
                const initial = customer.name.charAt(0).toUpperCase();
                btn.innerHTML = `
                    <span class="profile-avatar">${initial}</span>
                    <span class="profile-text">${customer.name.split(' ')[0]}</span>
                `;
                btn.classList.add('logged-in');
            } else if (isLoggedIn()) {
                btn.innerHTML = `
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <span class="profile-text">Profile</span>
                `;
                btn.classList.add('logged-in');
            } else {
                btn.innerHTML = `
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <span class="profile-text">Profile</span>
                `;
                btn.classList.remove('logged-in');
            }
        });
    }
    
    function showToast(message) {
        // Remove existing toast
        const existingToast = document.querySelector('.flow-toast');
        if (existingToast) existingToast.remove();
        
        const toast = document.createElement('div');
        toast.className = 'flow-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    // ==================== Profile Button Handler ====================
    
    function handleProfileClick(e, callback = null) {
        e.preventDefault();
        
        if (isLoggedIn()) {
            // Redirect to profile page
            window.location.href = 'profile.html';
        } else {
            // Show login modal
            showModal(callback || (() => {
                window.location.href = 'profile.html';
            }));
        }
    }
    
    function requireAuth(callback) {
        if (isLoggedIn()) {
            callback();
        } else {
            showModal(callback);
        }
    }
    
    // ==================== Cart Sync Functions ====================
    
    const CART_KEY = 'flow_cart';
    
    // Get local cart
    function getLocalCart() {
        const data = localStorage.getItem(CART_KEY);
        return data ? JSON.parse(data) : [];
    }
    
    // Save to local cart
    function saveLocalCart(cart) {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        // Trigger cart update event
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart } }));
    }

    // Initialize cart - fetches from server if logged in, otherwise uses local
    async function initCart() {
        if (isLoggedIn()) {
            return await fetchCart();
        }
        return getLocalCart();
    }
    
    // Fetch cart from server
    async function fetchCart() {
        if (!isLoggedIn()) {
            return getLocalCart();
        }
        
        try {
            const response = await fetch(`${API_BASE}/cart`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                return getLocalCart();
            }
            
            const data = await response.json();
            const serverCart = data.cart || [];
            
            // Merge with local cart if needed
            const localCart = getLocalCart();
            if (localCart.length > 0 && serverCart.length === 0) {
                // Local cart has items, server is empty - sync local to server
                await syncCartToServer(localCart);
                return localCart;
            }
            
            // Use server cart and update local
            saveLocalCart(serverCart);
            return serverCart;
        } catch (error) {
            console.error('Fetch cart error:', error);
            return getLocalCart();
        }
    }
    
    // Sync cart to server
    async function syncCartToServer(cart = null) {
        if (!isLoggedIn()) {
            if (cart) saveLocalCart(cart);
            return;
        }
        
        const cartToSync = cart || getLocalCart();
        
        try {
            const response = await fetch(`${API_BASE}/cart`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify({ cart: cartToSync })
            });
            
            if (response.ok) {
                const data = await response.json();
                saveLocalCart(data.cart);
                return data.cart;
            }
        } catch (error) {
            console.error('Sync cart error:', error);
        }
        
        return cartToSync;
    }
    
    // Add item to cart
    async function addToCart(item) {
        const cart = getLocalCart();
        
        // Check if item exists (same product + flavour)
        const existingIndex = cart.findIndex(i => 
            i.productSlug === item.productSlug && i.flavour === item.flavour
        );
        
        if (existingIndex > -1) {
            cart[existingIndex].quantity += (item.quantity || 1);
        } else {
            cart.push({
                productId: item.productId || item.id,
                productSlug: item.productSlug || item.slug,
                name: item.name,
                flavour: item.flavour || item.selectedFlavour,
                quantity: item.quantity || 1,
                price: item.price,
                image: item.image
            });
        }
        
        saveLocalCart(cart);
        
        // Sync to server if logged in
        if (isLoggedIn()) {
            syncCartToServer(cart);
        }
        
        return cart;
    }
    
    // Update cart item quantity
    async function updateCartItem(index, quantity) {
        const cart = getLocalCart();
        
        if (index < 0 || index >= cart.length) return cart;
        
        if (quantity <= 0) {
            cart.splice(index, 1);
        } else {
            cart[index].quantity = quantity;
        }
        
        saveLocalCart(cart);
        
        // Sync to server if logged in
        if (isLoggedIn()) {
            syncCartToServer(cart);
        }
        
        return cart;
    }
    
    // Remove item from cart
    async function removeFromCart(index) {
        return updateCartItem(index, 0);
    }
    
    // Clear cart
    async function clearCart() {
        saveLocalCart([]);
        
        if (isLoggedIn()) {
            try {
                await fetch(`${API_BASE}/cart`, {
                    method: 'DELETE',
                    headers: getAuthHeaders()
                });
            } catch (error) {
                console.error('Clear cart error:', error);
            }
        }
        
        return [];
    }
    
    // Get cart total
    function getCartTotal(cart = null) {
        const items = cart || getLocalCart();
        return items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }
    
    // Get cart count
    function getCartCount(cart = null) {
        const items = cart || getLocalCart();
        return items.reduce((count, item) => count + item.quantity, 0);
    }
    
    // ==================== Initialize ====================
    
    function init() {
        // Check auth status
        checkAuth().then((isAuth) => {
            updateAuthUI();
            // If logged in, sync cart from server
            if (isAuth) {
                fetchCart();
            }
        });
        
        // Setup profile button click handlers
        document.querySelectorAll('.profile-btn').forEach(btn => {
            btn.addEventListener('click', (e) => handleProfileClick(e));
        });
    }
    
    // Auto-init when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Public API
    return {
        init,
        showModal,
        closeModal,
        isLoggedIn,
        getToken,
        getCustomer,
        getAuthHeaders,
        logout,
        requireAuth,
        handleProfileClick,
        handleSendOTP,
        handleVerifyOTP,
        handleResendOTP,
        handleSaveName,
        goToMobileStep,
        checkAuth,
        getProfile,
        // Cart functions
        initCart,
        getLocalCart,
        saveLocalCart,
        fetchCart,
        syncCartToServer,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        getCartTotal,
        getCartCount
    };
})();

// Make it globally available
window.CustomerAuth = CustomerAuth;

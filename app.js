// API Service
const apiService = {
    baseUrl: 'http://localhost:3000',
    
    async request(endpoint, method = 'GET', data = null) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        
        const config = {
            method,
            headers,
            credentials: 'include' // Important for sessions
        };
        
        if (data) {
            config.body = JSON.stringify(data);
        }
        
        try {
            const response = await fetch(url, config);
            const responseData = await response.json().catch(() => ({}));
            
            if (!response.ok) {
                throw new Error(responseData.error || 'Something went wrong');
            }
            
            return responseData;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    
    // Auth endpoints
    async login(credentials) {
        return this.request('/login', 'POST', credentials);
    },
    
    async signup(userData) {
        return this.request('/users', 'POST', { user: userData });
    },
    
    async getCurrentUser() {
        return this.request('/me', 'GET');
    },
    
    async logout() {
        try {
            await this.request('/logout', 'DELETE');
        } finally {
            localStorage.removeItem('rememberedUsername');
        }
    },
    
    // Product endpoints
    async getProducts() {
        return this.request('/products', 'GET');
    },
    
    async createProduct(productData) {
        return this.request('/products', 'POST', { product: productData });
    },
    
    async updateProduct(id, productData) {
        return this.request(`/products/${id}`, 'PATCH', { product: productData });
    },
    
    async deleteProduct(id) {
        return this.request(`/products/${id}`, 'DELETE');
    }
};

// Helper functions
function showError(alertElement, message) {
    if (!alertElement) return;
    alertElement.style.display = 'flex';
    alertElement.style.backgroundColor = '#fde8e8';
    alertElement.style.color = '#c53030';
    const icon = alertElement.querySelector('i');
    if (icon) icon.className = 'fas fa-exclamation-circle';
    const messageElement = alertElement.querySelector('span') || alertElement;
    messageElement.textContent = message;
}

function showSuccess(alertElement, message) {
    if (!alertElement) return;
    alertElement.style.display = 'flex';
    alertElement.style.backgroundColor = '#e6f7ee';
    alertElement.style.color = '#10b981';
    const icon = alertElement.querySelector('i');
    if (icon) icon.className = 'fas fa-check-circle';
    const messageElement = alertElement.querySelector('span') || alertElement;
    messageElement.textContent = message;
}

// View management
function showView(viewName) {
    document.querySelectorAll('.view').forEach(view => {
        view.style.display = 'none';
    });
    
    const view = document.getElementById(`${viewName}View`);
    if (view) view.style.display = 'flex';
}

// Auth functions
async function handleLogin(e) {
    e.preventDefault();
    
    const alert = document.getElementById('loginAlert');
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    if (!username || !password) {
        showError(alert, 'Please enter both username and password');
        return;
    }
    
    try {
        const loginBtn = document.querySelector('#loginForm button[type="submit"]');
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
        
        const response = await apiService.login({ username, password });
        
        if (rememberMe) {
            localStorage.setItem('rememberedUsername', username);
        } else {
            localStorage.removeItem('rememberedUsername');
        }
        
        showSuccess(alert, response.message || 'Login successful!');
        setTimeout(() => showView('dashboard'), 1000);
        
    } catch (error) {
        showError(alert, error.message || 'Invalid username or password');
    } finally {
        const loginBtn = document.querySelector('#loginForm button[type="submit"]');
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
        }
    }
}

async function handleSignup(e) {
    e.preventDefault();
    
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    const alert = document.getElementById('signupAlert');
    const username = document.getElementById('usernameSignup').value.trim();
    const password = document.getElementById('passwordSignup').value;
    
    if (!username) {
        document.getElementById('usernameSignupError').textContent = 'Username is required';
        return;
    }
    if (!password) {
        document.getElementById('passwordSignupError').textContent = 'Password is required';
        return;
    }
    
    try {
        const signupBtn = document.querySelector('#signupForm button[type="submit"]');
        signupBtn.disabled = true;
        signupBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
        
        await apiService.signup({ username, password });
        showSuccess(alert, 'Account created! Please login.');
        setTimeout(() => showView('login'), 1500);
        
    } catch (error) {
        showError(alert, error.message || 'Failed to create account');
    } finally {
        const signupBtn = document.querySelector('#signupForm button[type="submit"]');
        if (signupBtn) {
            signupBtn.disabled = false;
            signupBtn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
        }
    }
}

async function handleLogout() {
    try {
        await apiService.logout();
        showView('login');
    } catch (error) {
        console.error('Logout failed:', error);
    }
}

// Product functions
async function loadProducts() {
    try {
        const products = await apiService.getProducts();
        renderProducts(products);
    } catch (error) {
        console.error('Failed to load products:', error);
    }
}

function renderProducts(products) {
    const tbody = document.getElementById('productTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = products.map(product => `
        <tr>
            <td>${product.product_name || 'N/A'}</td>
            <td>${product.description || 'N/A'}</td>
            <td>$${product.original_price?.toFixed(2) || '0.00'}</td>
            <td>${product.quantity || 0}</td>
            <td>$${product.delivery_fee?.toFixed(2) || '0.00'}</td>
            <td>${product.user_id || 'N/A'}</td>
            <td>${product.target_margin || '0'}%</td>
            <td>
                <span class="status-badge ${getStatusClass(product.quantity)}">
                    ${getStatusText(product.quantity)}
                </span>
            </td>
            <td class="actions">
                <button class="btn btn-sm btn-icon edit-product" data-id="${product.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-icon btn-danger delete-product" data-id="${product.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function getStatusClass(quantity) {
    if (!quantity) return 'status-out';
    return quantity < 10 ? 'status-low' : 'status-available';
}

function getStatusText(quantity) {
    if (!quantity) return 'Out of Stock';
    return quantity < 10 ? 'Low Stock' : 'In Stock';
}

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    // Check auth status
    async function checkAuth() {
        try {
            const user = await apiService.getCurrentUser();
            if (user && user.id) {
                showView('dashboard');
                loadProducts();
            } else {
                showView('login');
            }
        } catch (error) {
            showView('login');
        }
    }

    // Set up event listeners
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const showSignupLink = document.getElementById('showSignup');
    const showLoginLink = document.getElementById('showLogin');
    
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (signupForm) signupForm.addEventListener('submit', handleSignup);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (showSignupLink) showSignupLink.addEventListener('click', (e) => { e.preventDefault(); showView('signup'); });
    if (showLoginLink) showLoginLink.addEventListener('click', (e) => { e.preventDefault(); showView('login'); });
    
    // Password toggle functionality
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);
            const type = input.type === 'password' ? 'text' : 'password';
            input.type = type;
            this.querySelector('i').classList.toggle('fa-eye');
            this.querySelector('i').classList.toggle('fa-eye-slash');
        });
    });
    
    // Pre-fill remembered username
    const rememberedUsername = localStorage.getItem('rememberedUsername');
    if (rememberedUsername) {
        const usernameInput = document.getElementById('username');
        if (usernameInput) {
            usernameInput.value = rememberedUsername;
            document.getElementById('rememberMe').checked = true;
        }
    }
    
    // Initialize the app
    checkAuth();
    
    // Password toggle functionality for all password fields
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const passwordInput = document.getElementById(targetId);
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.querySelector('i').classList.toggle('fa-eye');
            this.querySelector('i').classList.toggle('fa-eye-slash');
        });
    });

    // Current state
    let currentPage = 1;
    const itemsPerPage = 10;
    let allProducts = [];
    let filteredProducts = [];

    // Mock data - Replace with actual API calls to your Rails backend
    const mockProducts = [
        { 
            id: 1, 
            product_name: 'Laptop', 
            description: 'High-performance laptop with 16GB RAM', 
            original_price: 899.99, 
            quantity: 15, 
            delivery_fee: 29.99, 
            user_id: 1,
            target_margin: 20,
            status: 'available' 
        },
        { 
            id: 2, 
            product_name: 'Smartphone', 
            description: 'Latest model with 128GB storage', 
            original_price: 699.99, 
            quantity: 8, 
            delivery_fee: 19.99, 
            user_id: 1,
            target_margin: 25,
            status: 'low' 
        },
        { 
            id: 3, 
            product_name: 'Wireless Headphones', 
            description: 'Noise-cancelling bluetooth headphones', 
            original_price: 199.99, 
            quantity: 0, 
            delivery_fee: 9.99, 
            user_id: 1,
            target_margin: 30,
            status: 'out' 
        },
        { 
            id: 4, 
            product_name: 'Mechanical Keyboard', 
            description: 'RGB mechanical keyboard with blue switches', 
            original_price: 129.99, 
            quantity: 22, 
            delivery_fee: 14.99, 
            user_id: 1,
            target_margin: 15,
            status: 'available' 
        },
        { 
            id: 5, 
            product_name: 'Gaming Mouse', 
            description: 'High DPI gaming mouse with customizable buttons', 
            original_price: 79.99, 
            quantity: 30, 
            delivery_fee: 9.99, 
            user_id: 1,
            target_margin: 20,
            status: 'available' 
        }
    ];

    // Initialize the application
    function init() {
        // For demo purposes, we'll use mock data
        allProducts = [...mockProducts];
        filteredProducts = [...allProducts];
        
        // Set up event listeners
        setupEventListeners();
        
        // Show the login view by default
        showView('login');
        
        // Check for saved credentials
        checkRememberedUser();
    }
    
    // Check if user credentials are remembered
    function checkRememberedUser() {
        const rememberedUsername = localStorage.getItem('rememberedUsername');
        const rememberedPassword = localStorage.getItem('rememberedPassword');
        
        if (rememberedUsername && rememberedPassword) {
            document.getElementById('username').value = rememberedUsername;
            document.getElementById('password').value = rememberedPassword;
            document.getElementById('rememberMe').checked = true;
        }
    }


    
    // Simulate signup (replace with actual API call)
    function simulateSignup(userData) {
        // Show loading state
        const submitBtn = signupForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
        
        // Simulate API call delay
        setTimeout(() => {
            // In a real app, you would handle the API response here
            console.log('User signed up:', userData);
            
            // Show success message
            const alert = document.getElementById('signupAlert');
            alert.style.display = 'flex';
            alert.style.backgroundColor = '#e6f7ee';
            alert.style.color = '#10b981';
            alert.querySelector('i').className = 'fas fa-check-circle';
            document.getElementById('signupAlertMessage').textContent = 'Account created successfully! Redirecting...';
            
            // Reset form and redirect to login after delay
            setTimeout(() => {
                signupForm.reset();
                showView('login');
                
                // Show success message on login page
                const loginAlert = document.getElementById('loginAlert');
                loginAlert.style.display = 'flex';
                loginAlert.style.backgroundColor = '#e6f7ee';
                loginAlert.style.color = '#10b981';
                loginAlert.querySelector('i').className = 'fas fa-check-circle';
                document.getElementById('alertMessage').textContent = 'Account created successfully! Please log in.';
                
                // Reset button state
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }, 1500);
            
        }, 1500);
    }
    
    // Set up event listeners
    function setupEventListeners() {
        // Toggle between login and signup views
        if (showSignupLink) {
            showSignupLink.addEventListener('click', (e) => {
                e.preventDefault();
                showView('signup');
            });
        }
        
        if (showLoginLink) {
            showLoginLink.addEventListener('click', (e) => {
                e.preventDefault();
                showView('login');
            });
        }
        
        // Signup form submission
        if (signupForm) {
            signupForm.addEventListener('submit', handleSignup);
        }
        // Login form submission
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
            
            // Toggle password visibility
            const togglePassword = document.getElementById('togglePassword');
            const passwordInput = document.getElementById('password');
            
            if (togglePassword && passwordInput) {
                togglePassword.addEventListener('click', function() {
                    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                    passwordInput.setAttribute('type', type);
                    this.querySelector('i').classList.toggle('fa-eye');
                    this.querySelector('i').classList.toggle('fa-eye-slash');
                });
            }
            
            // Clear error on input
            const usernameInput = document.getElementById('username');
            if (usernameInput) {
                usernameInput.addEventListener('input', function() {
                    document.getElementById('usernameError').textContent = '';
                    document.getElementById('loginAlert').style.display = 'none';
                });
            }
            
            if (passwordInput) {
                passwordInput.addEventListener('input', function() {
                    document.getElementById('passwordError').textContent = '';
                    document.getElementById('loginAlert').style.display = 'none';
                });
            }
        }
        
        // Logout button
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }
        
        // Search input
        if (searchInput) {
            searchInput.addEventListener('input', handleSearch);
        }
        
        // Add product button
        if (addProductBtn) {
            addProductBtn.addEventListener('click', handleAddProduct);
        }
        
        // Pagination
        if (prevPageBtn) {
            prevPageBtn.addEventListener('click', () => changePage(-1));
        }
        
        if (nextPageBtn) {
            nextPageBtn.addEventListener('click', () => changePage(1));
        }
    }

    // Show a specific view
    function showView(viewName) {
        // Hide all views first
        document.querySelectorAll('.view').forEach(view => {
            view.style.display = 'none';
        });
        
        // Show the requested view
        if (viewName === 'login') {
            loginView.style.display = 'flex';
        } else if (viewName === 'signup') {
            signupView.style.display = 'flex';
        } else if (viewName === 'dashboard') {
            dashboardView.style.display = 'block';
        }
    }

    // Handle login
    function handleLogin(e) {
        e.preventDefault();
        
        // Reset error states
        document.getElementById('usernameError').textContent = '';
        document.getElementById('passwordError').textContent = '';
        document.getElementById('loginAlert').style.display = 'none';
        
        // Get form values
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;
        } else {
            // Show error message
            const alert = document.getElementById('signupAlert');
            document.getElementById('signupAlertMessage').textContent = 'Error creating account';
            alert.style.display = 'flex';
            alert.style.backgroundColor = '#fdebeb';
            alert.style.color = '#e11d48';
            alert.querySelector('i').className = 'fas fa-exclamation-circle';
        }
    })
    .catch(error => console.error('Error signing up:', error));
}
        // Clear any user data/session
        localStorage.removeItem('authToken');
        
        // Reset form
        document.getElementById('loginForm').reset();
        document.getElementById('rememberMe').checked = false;
        
        // Show login view
        showView('login');
    }
    
    // Handle search
    function handleSearch(e) {
        const searchTerm = e.target.value.toLowerCase();
        
        if (!searchTerm) {
            filteredProducts = [...allProducts];
        } else {
            filteredProducts = allProducts.filter(product => 
                product.product_name.toLowerCase().includes(searchTerm) ||
                (product.description && product.description.toLowerCase().includes(searchTerm))
            );
        }
        
        currentPage = 1; // Reset to first page on new search
        renderProducts();
    }
    
    // Handle add product
    function handleAddProduct() {
        // In a real app, this would open a modal to add a new product
        alert('Add product functionality will be implemented here');
    }
    
    // Change page
    function changePage(direction) {
        const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
        const newPage = currentPage + direction;
        
        if (newPage > 0 && newPage <= totalPages) {
            currentPage = newPage;
            renderProducts();
        }
    }
    
    // Render products table
    function renderProducts() {
        if (!productTableBody) return;
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
        const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
        
        // Clear the table
        productTableBody.innerHTML = '';
        
        if (paginatedProducts.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="6" class="text-center">No products found</td>
            `;
            productTableBody.appendChild(row);
        } else {
            // Add products to the table
            paginatedProducts.forEach(product => {
                const row = document.createElement('tr');
                
                // Determine status class
                let statusClass = 'status-available';
                let statusText = 'In Stock';
                
                if (product.status === 'low') {
                    statusClass = 'status-low';
                    statusText = 'Low Stock';
                } else if (product.status === 'out') {
                    statusClass = 'status-out';
                    statusText = 'Out of Stock';
                }
                
                row.innerHTML = `
                    <td>${product.product_name}</td>
                    <td>${product.description || 'N/A'}</td>
                    <td>$${product.original_price.toFixed(2)}</td>
                    <td>${product.quantity}</td>
                    <td>$${product.delivery_fee.toFixed(2)}</td>
                    <td>${product.target_margin}%</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td class="actions">
                        <button class="btn btn-sm btn-icon" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-icon btn-danger" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                
                productTableBody.appendChild(row);
            });
        }
        
        // Update pagination info
        updatePaginationInfo(paginatedProducts.length, filteredProducts.length, totalPages);
    }
    
    // Update pagination information
    function updatePaginationInfo(showing, total, totalPages) {
        if (showingCount) showingCount.textContent = showing;
        if (totalCount) totalCount.textContent = total;
        if (pageInfo) pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        
        // Update pagination buttons
        if (prevPageBtn) prevPageBtn.disabled = currentPage === 1;
        if (nextPageBtn) nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
    }
    
    // Initialize the app
    init();
});

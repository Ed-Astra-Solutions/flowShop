# FLOWW Shop - Customer Frontend

Customer-facing storefront for FLOWW e-commerce platform.

## Production Server
**API Base URL**: `https://api.flowhydration.in`

## Project Structure

```
frontend_user/
├── index.html          # Main storefront / homepage
├── profile.html        # Customer profile page
├── flow-shop-2.html    # Product listing page
└── icons/
    └── site.webmanifest
```

## Features

### Homepage (`index.html`)
- Product showcase
- Shopping cart functionality
- Customer authentication (WhatsApp OTP)

### Profile Page (`profile.html`)
- **Account Details**: View and edit personal info (name, email, phone, DOB)
- **Addresses**: Add, edit, delete, and set default delivery addresses
- **Preferences**: Toggle notifications (email, SMS, WhatsApp, promotional offers)
- **Orders**: View order history

### Authentication Flow
1. Customer enters mobile number
2. OTP sent via WhatsApp
3. Customer verifies OTP
4. JWT token stored in localStorage
5. Profile and cart data synced with server

## API Configuration

The frontend connects to the backend API. Update the API base URL in the JavaScript files:

```javascript
// For local development
const API_BASE = 'http://localhost:3000';

// For production
const API_BASE = 'https://api.flowhydration.in';
```

## API Endpoints Used

### Authentication
| Endpoint | Description |
|----------|-------------|
| `POST /api/customer/send-otp` | Send OTP to WhatsApp |
| `POST /api/customer/verify-otp` | Verify OTP and login |

### Profile
| Endpoint | Description |
|----------|-------------|
| `GET /api/customer/profile` | Get customer profile |
| `PUT /api/customer/profile` | Update customer profile |

### Addresses
| Endpoint | Description |
|----------|-------------|
| `POST /api/customer/addresses` | Add new address |
| `PUT /api/customer/addresses/:id` | Update address |
| `DELETE /api/customer/addresses/:id` | Delete address |
| `PUT /api/customer/addresses/:id/default` | Set default address |

### Cart
| Endpoint | Description |
|----------|-------------|
| `GET /api/customer/cart` | Get cart items |
| `POST /api/customer/cart/sync` | Sync cart with server |

## Local Development

1. Start the backend server (see [flowServer](https://github.com/Ed-Astra-Solutions/flowServer))
2. Update API_BASE to `http://localhost:3000`
3. Open HTML files in browser or use a local server:

```bash
# Using Python
python -m http.server 8080

# Using Node.js
npx serve .
```

## Tech Stack
- Vanilla HTML5/CSS3/JavaScript
- Responsive design
- LocalStorage for cart persistence
- JWT authentication

## Related Repositories
- **Backend Server**: [Ed-Astra-Solutions/flowServer](https://github.com/Ed-Astra-Solutions/flowServer)

---

*Ed-Astra Solutions*

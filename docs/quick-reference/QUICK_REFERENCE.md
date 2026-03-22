# Quick Reference - Restaurant Cafe DevOps Setup

## 🚀 Quick Start (Recommended)

```bash
# One command to set up everything automatically
chmod +x setup.sh && ./setup.sh
```

**What it does:** Installs PostgreSQL, creates database, installs dependencies, seeds data, and starts servers.

---

## 📚 Documentation Files

| File | Purpose | Size |
|------|---------|------|
| **SETUP_GUIDE.md** | Comprehensive setup guide (10 sections) | 703 lines |
| **setup.sh** | Fully automated setup script | 234 lines |
| **DEVOPS_COMPLETION_SUMMARY.md** | DevOps implementation report | 400+ lines |
| **.gitignore** | Git configuration (existing) | ~50 lines |

---

## 🔑 Default Credentials

```
Admin:   admin@restaurant.com       / Admin!2024@cafe
Manager: manager@restaurant.com     / Manager!2024@cafe
Cashier: cashier@restaurant.com     / Cashier!2024@cafe
Waiter:  waiter@restaurant.com      / Waiter!2024@cafe
Chef:    chef@restaurant.com        / Chef!2024@cafe
```

---

## 🌐 Access Points

| Service | URL | Port |
|---------|-----|------|
| Frontend | http://localhost:3000 | 3000 |
| Backend API | http://localhost:5001 | 5001 |
| Database | localhost | 5432 |

---

## 📋 Environment Variables

### Backend `.env`
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=restaurant_db
DB_USER=postgres
DB_PASSWORD=restaurant_pwd_2024!
JWT_SECRET=restaurant_jwt_secret_key_2024!
PORT=5001
FRONTEND_URL=http://localhost:3000
```

### Frontend `.env`
```bash
REACT_APP_API_URL=http://localhost:5001/api
```

---

## 🛠️ Manual Setup (if needed)

See **SETUP_GUIDE.md** - **Manual Setup** section for step-by-step instructions.

---

## 🐛 Troubleshooting

Common issues and solutions in **SETUP_GUIDE.md** - **Troubleshooting** section:

- PostgreSQL connection error
- Port already in use
- Module not found error
- Database seeding fails
- Frontend cannot connect to backend

---

## 📖 Detailed Documentation

For complete information, refer to:

1. **SETUP_GUIDE.md** - Full setup guide with all sections
2. **DEVOPS_COMPLETION_SUMMARY.md** - Implementation details and testing
3. **API_DOCUMENTATION.md** - API endpoint reference
4. **FEATURES.md** - Feature overview
5. **README.md** - Project overview

---

## ✅ Verification Checklist

After running setup.sh, verify:

- [ ] Backend running on http://localhost:5001
- [ ] Frontend running on http://localhost:3000
- [ ] Can login with admin@restaurant.com / Admin!2024@cafe
- [ ] Dashboard displays after successful login
- [ ] Database contains sample data (menu items, orders, inventory)

---

## 🔒 Security Notes

- **Never commit .env files** (already in .gitignore)
- **Change JWT_SECRET in production** - Generate new one using:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- **Change database password in production**
- **Use HTTPS in production** - See SETUP_GUIDE.md for instructions

---

## 📞 Support

If you encounter issues:

1. Check **Troubleshooting** section in SETUP_GUIDE.md
2. Review logs in `backend/logs/`
3. Ensure PostgreSQL is running
4. Verify ports 3000 and 5001 are available

---

**Status:** ✅ Production Ready  
**Last Updated:** March 7, 2026  
**Version:** 1.0.0

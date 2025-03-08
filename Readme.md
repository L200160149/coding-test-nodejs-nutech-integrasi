# Nutech Integrasi - Coding Test (Node.js Programmer)

**Author:** Supriadi

## 🌍 Application URL

**API Documentation:** [Nutech API Docs](https://nutech.supridev.com/api/v1/api-docs)

## 🛠 Technology Stack

- **Node.js 22** (Backend)
- **MySQL** (Database)

---

## 🚀 Installation Steps

1. **Clone the Repository:**
   ```sh
   git clone https://github.com/L200160149/coding-test-nodejs-nutech-integrasi.git
   cd coding-test-nodejs-nutech-integrasi
   ```
2. **Copy and Configure the Environment File:**
   ```sh
   cp .env.sample .env
   ```
   - Adjust the configuration in the `.env` file as needed.
3. **Import the Database:**
   - Import the provided database schema into your local MySQL server.
4. **Install Dependencies:**
   ```sh
   npm install
   ```

---

## ✅ Optional Steps

- **Run Unit Tests:**
  ```sh
  npm test
  ```

---

## 📢 Error Handling

If a **5xx HTTP error** occurs, the response will be structured as follows:

```json
{
  "status": 500,
  "message": "Internal Server Error",
  "errorId": "ea843536-a5a6-46aa-8d87-2ecc42f71d94"
}
```

- The `errorId` can be found in the log file: `logs/error.log`.
- Check this file to debug and understand the cause of the 5xx error.

---

### 🔗 Notes

- Ensure your **database is running** before starting the application.
- For any issues, refer to the logs or API documentation.

🚀 Happy coding!

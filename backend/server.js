require("dotenv").config();
console.log("DB_USER from .env:", process.env.DB_USER); // Should print 'varnan'

const app = require("./app");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 API available at http://localhost:${PORT}/api`);
  console.log(`🧪 Test with Postman at http://localhost:${PORT}/health`);
});

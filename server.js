require('dotenv').config();

const app = require('./src/app');
const { syncModels } = require('./src/models');

const PORT = process.env.PORT || 3000;

syncModels()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`HTXAFF.com đang chạy tại http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Không thể kết nối database:', err);
    process.exit(1);
  });

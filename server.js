import express from 'express';
// eslint-disable-next-line import/extensions
import route from './routes/index.js';


const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.listen(PORT, () => {
  console.log(`app listening on port : ${PORT}`);
});
app.use('/', route);

export default app;

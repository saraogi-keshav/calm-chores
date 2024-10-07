import express from 'express';
import { addUser, addHouse, addChore } from './Database/schemas.js';
import bodyParser from 'body-parser';

const app = express();
const port = 3000;


app.use(bodyParser.json());


// Route to add a user
app.post('/addUser', async (req, res) => {
  const { name, email, passwordHash, profileType, house_id, house_unit, chore_id } = req.body;
  try {
    const userId = await addUser(name, email, passwordHash, profileType, house_id, house_unit, chore_id);
    res.status(200).json({ userId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to add a house
app.post('/addHouse', async (req, res) => {
  const { house_name, house_unit, address } = req.body;
  try {
    const houseId = await addHouse(house_name, house_unit, address);
    res.status(200).json({ houseId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to add a chore
app.post('/addChore', async (req, res) => {
  const { chore_name, due_date, recurring, frequency } = req.body;
  try {
    const choreId = await addChore(chore_name, due_date, recurring, frequency);
    res.status(200).json({ choreId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

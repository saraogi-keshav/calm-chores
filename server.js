import express from 'express';
import { addUser, addHouse, addChore, rating} from './Database/schemas.js';
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

//Route to add rating
app.post('/rating', async (req, res) => {
  const { rated_user_id, rating_score, comment } = req.body;
  try {
    const rate = await rating(rated_user_id, rating_score, comment);
    res.status(200).json({rate});
  } catch (error) {
    res.status(500).json({error: error.message});
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

// Route to update an existing chore
app.put('/updateChore/:chore_id', async (req, res) => {
  const { chore_id } = req.params;
  const { chore_name, due_date, status, recurring, frequency } = req.body;
  try {
    await updateChore(chore_id, chore_name, due_date, status, recurring, frequency);
    res.status(200).json({ message: "Chore updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to delete an existing chore
app.delete('/deleteChore/:chore_id', async (req, res) => {
  const { chore_id } = req.params;
  try {
    await deleteChore(chore_id);
    res.status(200).json({ message: "Chore deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

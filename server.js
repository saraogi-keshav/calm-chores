import express from 'express';
import bodyParser from 'body-parser';
import { 
  addUser, 
  addHouse, 
  addChore, 
  rating, 
  addMaintenanceRequest, 
  updateMaintenanceStatus, 
  getMaintenanceRequestsByHouse,
  deleteMaintenanceRequest
} from './Database/schemas.js';

const app = express();
const port = 3001;


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

// Route to add a maintenance request
app.post('/addMaintenanceRequest', async (req, res) => {
  const { description, priority, tenant_id, house_id } = req.body;

  try {
      const requestId = await addMaintenanceRequest(description, priority);
      res.status(200).json({ requestId });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});

// Route to update maintenance request status
app.put('/updateMaintenanceRequest/:request_id', async (req, res) => {
  const { request_id } = req.params;
  const { new_status, updated_by } = req.body;

  try {
      await updateMaintenanceStatus(request_id, new_status, updated_by);
      res.status(200).json({ message: 'Maintenance request updated successfully' });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});

// Route to fetch all maintenance requests for a specific house
app.get('/maintenanceRequests/:house_id', async (req, res) => {
  const { house_id } = req.params;
  const { status } = req.query;

  try {
      const requests = await getMaintenanceRequestsByHouse(house_id, status);
      res.status(200).json(requests);
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});

// Route to delete a maintenance request
app.delete('/deleteMaintenanceRequest/:request_id', async (req, res) => {
  const { request_id } = req.params;

  try {
      await deleteMaintenanceRequest(request_id);
      res.status(200).json({ message: 'Maintenance request deleted successfully' });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});
import { collection, addDoc, doc, setDoc, getDocs, getDoc, query, where, updateDoc, deleteDoc, arrayUnion } from 'firebase/firestore';
import { db } from './firebase.js';
import { v4 as uuidv4 } from 'uuid';


//user table
export async function addUser(name, email, passwordHash, profileType, house_id=null, house_unit=null, chore_id=null) {
  // validate profileType
    if (!['Roommate', 'Landlord'].includes(profileType)) {
        throw new Error("Invalid profile type. Must be 'Roommate' or 'Landlord'.");
    }
    if (profileType == "Roommate") {
        try {
            // Add user document to the 'users' collection
            const user_docRef = await addDoc(collection(db, "users"), {
            name: name,
            email: email,
            password_hash: passwordHash,
            profile_type: profileType,
            house_id: house_id,
            house_unit: house_unit,
            chore_id: chore_id,
            rating: 0,
            created_at: new Date()
        });
    
        console.log('User added with ID: ', user_docRef.id);
        return user_docRef.id;
      } catch (error) {
        console.error('Error adding user: ', error);
      }
    }
    
    if (profileType == "Landlord") {
        try {
            // Add user document to the 'users' collection
            const user_docRef = await addDoc(collection(db, "landlord"), {
            name: name,
            email: email,
            password_hash: passwordHash,
            profile_type: profileType,
            house_id: [],
            created_at: new Date()
        });
    
        console.log('Landlord added with ID: ', user_docRef.id);
        return user_docRef.id;
      } catch (error) {
        console.error('Error adding landlord: ', error);
      }
    }
}

//testing user table
// const userName = "Testing";
// const userEmail = "testing@test.com";
// const userPasswordHash = "password";
// const userProfileType = "Landlord";

// // Call the function to add a user
// addUser(userName, userEmail, userPasswordHash, userProfileType)
//   .then(userId => {
//     console.log(`User added with unique ID: ${userId}`);
//   })
//   .catch(error => {
//     console.error("Failed to add user:", error);
//   });

// const user = "test2";
// const email = "testing@test.com";
// const pw = "password";
// const type = "Roommate";
  
//   // Call the function to add a user
// addUser(user, email, pw, type)
//     .then(userId => {
//       console.log(`User added with unique ID: ${userId}`);
//     })
//     .catch(error => {
//       console.error("Failed to add user:", error);
//     });


//rating table
export async function rating(rated_user_id, rating_score, comment=null) {
    try {
        //const rated_by = auth.currentUser.uid;
        const rated_by = "Be2sm7Lz6bDuaZxqIofp"

        const rating_docRef = await addDoc(collection(db, "rating"), {
            rating_id: uuidv4(),
            rated_by: rated_by,
            rated_user: rated_user_id,
            rating_score: rating_score,
            comment: comment,
            created_at: new Date()
        });
        console.log("Rating added:", rating_docRef.id);
        return rating_docRef.id;
    } catch (error) {
        console.error('Error adding rating: ', error);
    }
}

//testing
rating("vBakUO026D4jOTKoCyfR", 5, "done everything well")
    .then(rate => {
        console.log("rated: ", rate);
    })
    .catch(error => {
        console.log("error:", error)
    });

//calculate the rating for the users
export async function calculateRating(user_id) {
    try {
        const ratingsRef = collection(db, "rating");
        const getUserDocs = query(ratingsRef, where("rated_user", "==", user_id));
        const getrating = await getDocs(getUserDocs);

        let total = 0;
        let count = 0;

        getrating.forEach(doc => {
            const data = doc.data();
            total += data.rating_score;
            count++;
        });

        const new_rating = (total/count).toFixed(2);
        console.log(`User ${user_id} has an rating of: ${new_rating}`);

        return new_rating;
    } catch (error){
        console.error("Error calculating rating", error);
    }
}

// update rating in user table
export async function updateUserRating(user_id) {
    try {
        const new_rating = await calculateRating(user_id);
        const userRef = doc(db, "users", user_id);
        await updateDoc(userRef, {
        rating: new_rating
        });
        console.log('User rating updated');
    } catch (error) {
        console.error('Error updating user rating:', error);
        throw error;
    }
}

// testing updateUserRating function
const testUserId = "vBakUO026D4jOTKoCyfR";
updateUserRating(testUserId)
  .then(() => {
    console.log(`User rating updated successfully: ${testUserId}`);
  })
  .catch(error => {
    console.log("Error updating user rating:", error);
  });



//house table
export async function addHouse(house_name, house_unit, address) {
    try {
        //get the current user id
        // const userID = auth.currentUser.uid;
        const userID = "EkA0Mbq8Wf7aYGVG26CZ"

        //add house info
        const house_docRef = await addDoc(collection(db, "houses"), {
            house_id: uuidv4(),
            house_name: house_name,
            house_unit: house_unit,
            tenants: [],
            address: address,
            created_by: userID,
            created_at: new Date()
        });
        owned_by(userID);
        console.log('House added with ID: ', house_docRef.id);
        return house_docRef.id;
    }catch (error){
        console.error('Error adding house: ', error);
    }
}

//testing add house
// const house_name = "house 1";
// const houseUnit = "1";
// const address = "111 commonwealth ave";

// addHouse(house_name, houseUnit, address)
//     .then(houseID => {
//         console.log("House added with ID:", houseID);
//     })
//     .catch(error => {
//         console.error("Failed to add house ID:", error);
//     });

//house owned by which landlord, puts the house id to that landlord
export async function owned_by(userID) {
    try {
        const houseRef = collection(db, "houses");
        const gethouse_owner = query(houseRef, where("created_by", "==", userID));
        const houseDocs = await getDocs(gethouse_owner);

        const houseIDs = houseDocs.docs.map(doc => doc.data().house_id);

        const ownerRef = doc(db, "landlord", userID);
        await updateDoc(ownerRef, {
            house_id: arrayUnion(...houseIDs)
        });
        console.log(`House IDs added to landlord ${userID}:`, houseIDs);
    } catch (error) {
        console.error("Error updating landlord with house IDs:", error);
    }
}

//adding tenant into the house
export async function addTenant_toHouse(landlordID, houseID, tenantID) {
    const landlordRef = doc(db, "landlord", landlordID);
    const landlordDoc = await getDoc(landlordRef);

    if (landlordDoc.exists()) {
        const housesRef = collection(db, "houses");
        const house = query(housesRef, where("house_id", "==", houseID));
        const querySnapshot = await getDocs(house);

        const houseDoc = querySnapshot.docs[0].ref;
        
        await updateDoc(houseDoc, {
            tenants: arrayUnion(tenantID)
        });
        update_user_house(tenantID, houseID);
        console.log(`Tenant ${tenantID} added to house ${houseID} by landlord ${landlordID}.`);
    } else {
        throw new Error("Only landlords can edit the tenants in the house.");
    }
}

//testing add roommate
//addTenant_toHouse("EkA0Mbq8Wf7aYGVG26CZ", "42708c68-8f4b-4e33-9015-533af2b992d6", "85bKwsVMzsM9nRFdd8SY");

// updating the user house
export async function update_user_house(userID, houseID) {
    try {
        const userRef = doc(db, "users", userID);
        await updateDoc(userRef, {
        house_id: houseID
        });
        console.log('User house updated');
    } catch (error) {
        console.error('Error updating user house:', error);
        throw error;
    }
}

//assign a chore
export async function assignChore(status = "Pending", verified_by=null) {
    try {
        // const user_id = auth.currentUser.uid;
        const user_id = "PVdRO5GXmVysIH1i7n3y"

        const userRef = doc(db, "users", user_id);
        const userDoc = await getDoc(userRef);
        const { chore_id } = userDoc.data();

        const assignChore_docRef = await addDoc(collection(db, "chore_assignments"), {
            assignment_id: uuidv4(),
            chore_id: chore_id,
            user_id: user_id,
            status: status, //('Pending', 'Completed', 'Overdue')
            // might need modify
            verified_by: verified_by,
            created_at: new Date(),
            //need modify
            updated_at: new Date()
        });
        console.log('Chore assignment added with ID: ', assignChore_docRef.id);
        return assignChore_docRef.id;
    } catch (error) {
        console.error('Error assigning chore: ', error);
    }
}

//testing
// assignChore("pending","user 1")
//     .then(chore => {
//         console.log("Assigned chore:", chore);
//     })
//     .catch(error => {
//         console.log("Error adding:", error);
//     });


//notification table
export async function notification(message) {
    try {
        const user_id = "CNUo2LgQGG00HFuEsOWh"
        const userRef = doc(db, "users", user_id);
        const userDoc = await getDoc(userRef);
        const {chore_id} = userDoc.data();

        const notify_docRef = await addDoc(collection(db, "notification"), {
            notification_id: uuidv4(),
            user_id: user_id,
            chore_id: chore_id,
            message: message,
            sent_at: new Date()
        });
        console.log('Notification sent with ID: ', notify_docRef.id);
        return notify_docRef.id;
    } catch (error) {
        console.error('Error sending notification: ', error);
    }
}

//testing
// notification("pay your bill before the due date.")
//     .then(notify => {
//         console.log("sent:", notify);
//     })
//     .catch(error => {
//         console.log("Error:", error);
//     });

// Add a new maintenance request to Firestore
export async function addMaintenanceRequest(description, priority = "Medium", status = "Pending") {
    try {
        const user_id = "85bKwsVMzsM9nRFdd8SY";
        const userRef = doc(db, "users", user_id);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
            throw new Error(`No user found with ID: ${user_id}`);
        }
        
        const { house_id, house_unit } = userDoc.data();

        const landlordRef = query(collection(db, "landlord"), where("house_id", "array-contains", house_id));
        
        const landlordDocs = await getDocs(landlordRef);
        let landlord_id = null;
        landlordDocs.forEach(doc => {
            landlord_id = doc.id;
        });

        if (!landlord_id) {
            throw new Error(`No landlord found for house ID: ${house_id}`);
        }

        const request_id = uuidv4();

        await setDoc(doc(db, "maintenance_requests", request_id), {
            request_id: request_id,
            house_id: house_id,
            house_unit: house_unit,
            tenant_id: user_id,
            landlord_id: landlord_id,
            description: description,
            priority: priority,
            status: status,
            created_at: new Date(),
            updated_at: new Date()
        });

        console.log('Maintenance request created with ID:', request_id);
        return request_id;
    } catch (error) {
        console.error('Error adding maintenance request:', error);
    }
}

// Update an existing maintenance request in Firestore
export async function updateMaintenanceStatus(request_id, new_status, updated_by) {
    try {
        const requestRef = doc(db, "maintenance_requests", request_id); // Reference to the document
        const requestDoc = await getDoc(requestRef); // Fetch the document

        if (!requestDoc.exists()) {
            throw new Error(`No maintenance request found with ID: ${request_id}`);
        }

        await updateDoc(requestRef, {
            status: new_status,
            updated_by: updated_by,
            updated_at: new Date()
        });

        console.log('Maintenance request updated successfully:', request_id);
    } catch (error) {
        console.error('Error updating maintenance request:', error);
    }
}
// Fetch all maintenance requests for a specific house
export async function getMaintenanceRequestsByHouse(house_id, status = null) {
    try {
        const maintenanceRef = collection(db, "maintenance_requests");
        let q;

        if (status) {
            q = query(maintenanceRef, where("house_id", "==", house_id), where("status", "==", status));
        } else {
            q = query(maintenanceRef, where("house_id", "==", house_id));
        }

        const querySnapshot = await getDocs(q);
        const requests = [];
        querySnapshot.forEach(doc => {
            requests.push(doc.data());
        });

        console.log(`Fetched ${requests.length} maintenance requests for house ID: ${house_id}`);
        return requests;
    } catch (error) {
        console.error('Error fetching maintenance requests:', error);
    }
}

// Delete an existing maintenance request
export async function deleteMaintenanceRequest(request_id) {
    try {
        const requestRef = doc(db, "maintenance_requests", request_id);
        await deleteDoc(requestRef);
        console.log('Maintenance request deleted successfully:', request_id);
    } catch (error) {
        console.error('Error deleting maintenance request:', error);
    }
}

let requestId;
const tenantId = "85bKwsVMzsM9nRFdd8SY";
const description = "Leaking faucet in the kitchen";
const priority = "High";
const houseId = "41d150e4-d2a9-41e5-b03b-f6dd7565bf76";

addMaintenanceRequest(description, priority)
  .then((generatedRequestId) => {
    requestId = generatedRequestId;
    console.log(`Maintenance request added with unique ID: ${requestId}`);

    const newStatus = "Completed";
    const updatedBy = "EkA0Mbq8Wf7aYGVG26CZ"; // Example landlord ID
    return updateMaintenanceStatus(requestId, newStatus, updatedBy);
  })
  .then(() => {
    console.log(`Maintenance request status updated successfully for request ID: ${requestId}`);
    return getMaintenanceRequestsByHouse(houseId);
  })
  .then((requests) => {
    console.log("Fetched maintenance requests for the house:", requests);
    return deleteMaintenanceRequest(requestId);
  })
  .then(() => {
    console.log(`Maintenance request with ID ${requestId} deleted successfully.`);
    return getMaintenanceRequestsByHouse(houseId);
  })
  .then((remainingRequests) => {
    console.log("Remaining maintenance requests after deletion:", remainingRequests);
  })
  .catch((error) => {
    console.error("Error during the maintenance request test flow:", error);
  });

// Add a new chore to Firestore
export async function addChore(chore_name, due_date, recurring = true, frequency) {
    try {
        const user_id = "hUi9sYvSLeRuXEHQ6LDB"; // Mocked user ID for example
        const userRef = doc(db, "users", user_id);
        const userDoc = await getDoc(userRef);
        const { house_id, house_unit } = userDoc.data();
  
        const chore_id = uuidv4();

        await setDoc(doc(db, "chores", chore_id), {
            chore_id: chore_id,
            house_id: house_id,
            house_unit: house_unit,
            chore_name: chore_name,
            due_date: due_date,
            recurring: recurring,
            frequency: frequency,
            created_by: user_id,
            created_at: new Date()
        });
  
        console.log('Chore created with ID:', chore_id);
        return chore_id;
    } catch (error) {
        console.error('Error adding chore:', error);
    }
}

// Update an existing chore in Firestore
export async function updateChore(chore_id, chore_name, due_date, status, recurring, frequency) {
    try {
        const choreRef = doc(db, "chores", chore_id); // Reference to the document
        const choreDoc = await getDoc(choreRef); // Fetch the document
  
        if (!choreDoc.exists()) {
            throw new Error(`No chore found with ID: ${chore_id}`);
          }
  
          // Update the document with new data
          await updateDoc(choreRef, {
              chore_name: chore_name,
              due_date: due_date,
              status: status,
              recurring: recurring,
              frequency: frequency,
              updated_at: new Date() // Track the time of the update
          });
  
          console.log('Chore updated successfully:', chore_id);
      } catch (error) {
          console.error('Error updating chore:', error);
      }
  }
  
  // Delete an existing chore in Firestore
  export async function deleteChore(chore_id) {
      try {
          const choreRef = doc(db, "chores", chore_id);
          await deleteDoc(choreRef);
          console.log('Chore deleted successfully:', chore_id);
      } catch (error) {
          console.error('Error deleting chore:', error);
      }
  }
  
  // The full workflow to add, update, and delete a chore using the same chore_id
  async function manageChoreLifecycle() {
      try {
          // Step 1: Add a new chore
          const choreId = await addChore("Clean up", "12/12/2024", false, "weekly");
          console.log("Chore added with ID:", choreId);
  
          // Step 2: Update the same chore
          await updateChore(choreId, "Updated Clean up", "2024-12-15", "Completed", true, "weekly");
          console.log("Chore updated with ID:", choreId);
  
          // Step 3: Delete the same chore
          await deleteChore(choreId);
          console.log("Chore deleted with ID:", choreId);
      } catch (error) {
          console.error("Error in chore lifecycle:", error);
      }
  }
  
  // Execute the workflow
  manageChoreLifecycle();

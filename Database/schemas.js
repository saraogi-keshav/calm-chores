import { collection, addDoc, doc, getDocs, getDoc, query, where, updateDoc } from 'firebase/firestore';
import { db } from './firebase.js';
import { v4 as uuidv4 } from 'uuid';

//user table
export async function addUser(name, email, passwordHash, profileType, house_id=null, house_unit=null, chore_id=null) {
  // validate profileType
  if (!['Roommate', 'Landlord'].includes(profileType)) {
    throw new Error("Invalid profile type. Must be 'Roommate' or 'Landlord'.");
  }
  try {
    // Add user document to the 'users' collection
    const user_docRef = await addDoc(collection(db, "users"), {
    //   user_id: uuidv4(),
      name: name,
      email: email,
      password_hash: passwordHash,
      profile_type: profileType,
      house_id: house_id,
      house_unit: house_unit,
      chore_id: chore_id,
      //TODO: calculation of rating add a function in api file
      rating: 0,
      created_at: new Date()
    });

    console.log('User added with ID: ', user_docRef.id);
    return user_docRef.id; // return the document ID
  } catch (error) {
    console.error('Error adding user: ', error);
  }
}

//testing user table
const userName = "Testing";
const userEmail = "testing@test.com";
const userPasswordHash = "password";
const userProfileType = "Landlord";

// Call the function to add a user
addUser(userName, userEmail, userPasswordHash, userProfileType)
  .then(userId => {
    console.log(`User added with unique ID: ${userId}`);
  })
  .catch(error => {
    console.error("Failed to add user:", error);
  });

//house table
export async function addHouse(house_name, house_unit, address) {
    try {
        //get the current user id
        // const userID = auth.currentUser.uid;
        const userID = "1213"

        //add house info
        const house_docRef = await addDoc(collection(db, "houses"), {
            house_id: uuidv4(),
            house_name: house_name,
            house_unit: house_unit,
            address: address,
            created_by: userID,
            created_at: new Date()
        });
        console.log('House added with ID: ', house_docRef.id);
        return house_docRef.id;
    }catch (error){
        console.error('Error adding house: ', error);
    }
}

//testing add house
const house_name = "house 1";
const houseUnit = "1";
const address = "111 commonwealth ave";

addHouse(house_name, houseUnit, address)
    .then(houseID => {
        console.log("House added with ID:", houseID);
    })
    .catch(error => {
        console.error("Failed to add house ID:", error);
    });

//add chores
export async function addChore(chore_name, due_date, recurring=true, frequency) {
    try {
        //const user_id = auth.currentUser.uid;
        const user_id = "7eOgsYOB2gWMEdkMqbuP"

        const userRef = doc(db, "users", user_id);
        const userDoc = await getDoc(userRef);
        const { house_id, house_unit } = userDoc.data();

        const chore_docRef = await addDoc(collection(db, "chores"), {
            chore_id: uuidv4(),
            //added hosue id and unit
            house_id: house_id,
            house_unit: house_unit,
            chore_name: chore_name,
            due_date: due_date,
            recurring: recurring,
            frequency: frequency,
            created_by: user_id,
            created_at: new Date()
        });

        console.log('chore created id:', chore_docRef.id);
        return chore_docRef;
    } catch (error) {
        console.error('Error adding chore: ', error);
    }
}

//testing
addChore("Clean up", "12/12/2024", false, "weekly")
    .then(chore => {
        console.log("chore added:", chore);
    })
    .catch(error => {
        console.log("Error adding:", error);
    });

export async function assignChore(status = "Pending", verified_by=null) {
    try {
        // const user_id = auth.currentUser.uid;
        const user_id = "7eOgsYOB2gWMEdkMqbuP"

        const userRef = doc(db, "users", user_id);
        const userDoc = await getDoc(userRef);
        const {chore_id} = userDoc.data();

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
assignChore("pending","user 1")
    .then(chore => {
        console.log("assigned chore:", chore);
    })
    .catch(error => {
        console.log("Error adding:", error);
    });

//notification table
export async function notification(message) {
    try {
        // const user_id = auth.currentUser.uid;
        const user_id = "7eOgsYOB2gWMEdkMqbuP"
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
notification("pay your bill before the due date.")
    .then(notify => {
        console.log("sent:", notify);
    })
    .catch(error => {
        console.log("Error:", error);
    });

//rating table
export async function rating(rated_user_id, rating_score, comment=null) {
    try {
        //const rated_by = auth.currentUser.uid;
        const rated_by = "GlYiqNBr3sVqlfLmhuQI"

        const rating_docRef = await addDoc(collection(db, "rating"), {
            rating_id: uuidv4(),
            rated_by: rated_by,
            rated_user: rated_user_id,
            //need a function to calculate the rating ?
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
rating("IAfLUzafTQStmdLTbD6U", 4, "done everything well")
    .then(rate => {
        console.log("rated not loading: ", rate);
    })
    .catch(error => {
        console.log("error:", error)
    })

//maintenance request table
export async function addMaintenanceRequest(description, priority="Medium", status="Pending") {
    try {
        //const user_id = auth.currentUser.uid;
        const user_id = "GlYiqNBr3sVqlfLmhuQI"
        const userRef = doc(db, "users", user_id);
        const userDoc = await getDoc(userRef);
        const {house_id, house_unit} = userDoc.data();

        const landlordRef = query(collection(db, "users"),
                            where("profile_type", "==", "landlord"),
                            where("house_id", "==", house_id)
        );

        const landlordDoc = await getDocs(landlordRef);
        let landlord_id = null;
        landlordDoc.forEach(doc => {
            landlord_id = doc.id;
        });

        const maintenance_request_docRef = await addDoc(collection(db, "maintenance_requests"), {
            request_id: uuidv4(),
            house_id: house_id,
            house_unit: house_unit,
            tenant_id: user_id,
            landlord_id: landlord_id,
            description: description,
            priority: priority,
            status: status,
            created_at: new Date(),
            // update date when status changes
            updated_at: new Date(),
        });

        console.log('Maintenance request added with ID: ', maintenance_request_docRef.id);
        return maintenance_request_docRef.id;
    } catch (error) {
        console.error('Error adding maintenance request: ', error);
    }
}

//testing
addMaintenanceRequest("leaking in the kitchen", "high", "pending")
    .then(request => {
        console.log("maintenance: ", request);
    })
    .catch(error => {
        console.log("error:", error)
    })

// update rating in user table
export async function updateUserRating(user_id, new_rating) {
    try {
        const userRef = doc(db, "users", user_id);
        await updateDoc(userRef, {
        rating: new_rating,
        updated_at: new Date()
        });
        console.log('User rating updated');
    } catch (error) {
        console.error('Error updating user rating:', error);
        throw error;
    }
}

// testing updateUserRating function
const testUserId = "PnW1e409Oysb5lzOp5QH";
const newRating = 4.5;

updateUserRating(testUserId, newRating)
  .then(() => {
    console.log(`User rating updated successfully: ${testUserId}`);
  })
  .catch(error => {
    console.log("Error updating user rating:", error);
  });

// update calculations in the rating table
export async function updateRatingCalculation(rating_id, rating_score, comment = null) {
    try {
      const ratingRef = doc(db, "rating", rating_id);
      await updateDoc(ratingRef, {
        rating_score: rating_score,
        comment: comment,
        updated_at: new Date()
      });
      console.log('Rating updated');
    } catch (error) {
      console.error('Error updating rating:', error);
      throw error;
    }
  }

// testing updateRatingCalculation function
const testRatingId = "Nw1Zt2KnmLOXeAEMDNrn";
const updatedRatingScore = 4;
const ratingComment = "Great job, well done!";

updateRatingCalculation(testRatingId, updatedRatingScore, ratingComment)
  .then(() => {
    console.log(`Rating updated successfully: ${testRatingId}`);
  })
  .catch(error => {
    console.log("Error updating rating:", error);
  });


// update the maintainance table when the status changes
export async function updateMaintenanceStatus(request_id, new_status, updated_by) {
    try {
        const requestRef = doc(db, "maintenance_requests", request_id);
        await updateDoc(requestRef, {
        status: new_status,
        updated_by: updated_by,
        updated_at: new Date()
        });
        console.log('Maintenance request status updated');
    } catch (error) {
        console.error('Error updating maintenance request status:', error);
        throw error;
    }
}


// Testing updateMaintenanceStatus function
const testRequestId = "gSC63q1E0sLQfAqPtRQD";
const newStatus = "Completed";
const updatedBy = "landlord_123";

updateMaintenanceStatus(testRequestId, newStatus, updatedBy)
  .then(() => {
    console.log(`Maintenance request status updated successfully ${testRequestId}`);
  })
  .catch(error => {
    console.log("Error updating maintenance request status:", error);
  });


// rewards table
// rethink about having this table and feature
// need to check user rewards point in user table need to add reward point key value 
// export async function addRewardPoints(points, reason) {
//     try {
//         const user_id = auth.currentUser.uid;
//         const userRef = doc(db, "users", user_id);
//         const userDoc = await getDoc(userRef);
//         const {chore_id} = userDoc.data();

//         const reward_docRef = addDoc(collection(db, "reward_points"), {
//             points_id: uuidv4(),
//             user_id: user_id,
//             chore_id: chore_id,
//             points: points,
//             reason: reason,
//             created_at: new Date()
//         });
//         console.log("reward id", reward_docRef.id);
//         return reward_docRef;
//     } catch (error) {
//         console.error('Error adding reward points: ', error);
//     }
// }
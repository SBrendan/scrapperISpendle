import firebase from "../firebase.js";
import Fermentation from "../models/fermentationModel.js";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";

const db = getFirestore(firebase);

export const createFermentation = async (req, res, next) => {
  try {
    const data = req.body;
    await addDoc(collection(db, "fermentations"), data);
    res.status(200).send("fermentation created successfully");
  } catch (error) {
    res.status(400).send(error.message);
  }
};

export const getFermentations = async (req, res, next) => {
  try {
    const fermentations = await getDocs(collection(db, "fermentations"));
    const fermentationArray = [];

    if (fermentations.empty) {
      res.status(400).send("No fermentations found");
    } else {
      fermentations.forEach((doc) => {
        const fermentation = new Fermentation(
          doc.id,
          doc.data().temp,
          doc.data().alc,
          doc.data().densi,
          doc.data().att,
          doc.data().timestamp
        );
        fermentationArray.push(fermentation);
      });

      res.status(200).send(fermentationArray);
    }
  } catch (error) {
    res.status(400).send(error.message);
  }
};
